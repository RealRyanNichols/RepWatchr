// Runs only against a new in-memory database. Never accepts a database URL.
// Install @electric-sql/pglite in scratch and set REPWATCHR_PGLITE_PATH to its
// dist/index.js, or install it as an optional local test dependency.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { PGlite } = await import(process.env.REPWATCHR_PGLITE_PATH || '@electric-sql/pglite');
const db = new PGlite();
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url),'utf8');
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role', true) $$;
create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
`);
for (const file of ['supabase-schema.sql','supabase-profile-claims.sql','supabase-comments.sql','supabase-comment-ranking.sql','supabase-citizen-grades.sql','supabase-profile-scorecards.sql','supabase-race-community-poll-v1.sql']) {
  await db.exec(read(file).split('insert into storage.buckets')[0]);
}
await db.exec(`create or replace function public.is_repw_operator() returns boolean language sql stable security definer as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('admin','reviewer','researcher')) $$;`);
await db.exec(read('supabase-owner-bootstrap.sql'));
await db.exec(`grant all on all tables in schema public to anon, authenticated, service_role; grant usage,select on all sequences in schema public to anon, authenticated, service_role;`);
const ids = {member:'00000000-0000-4000-8000-000000000001',other:'00000000-0000-4000-8000-000000000002',researcher:'00000000-0000-4000-8000-000000000003',reviewer:'00000000-0000-4000-8000-000000000004',admin:'00000000-0000-4000-8000-000000000005'};
for(const id of Object.values(ids)) await db.query('insert into auth.users(id) values ($1)',[id]);
for(const role of ['researcher','reviewer','admin']) await db.query('insert into public.user_roles(user_id,role) values ($1,$2)',[ids[role],role]);
await db.query(`insert into public.profiles(user_id,county,verified) values ($1,'Legacy',true)`,[ids.member]);
await db.exec(read('supabase/migrations/20260908_member_trust_hardening.sql'));
// The migration is repeatable without changing records or promoting legacy data.
await db.exec(read('supabase/migrations/20260908_member_trust_hardening.sql'));
assert.equal((await db.query('select count(*)::int n from member_assurance')).rows[0].n,0);
assert.equal((await db.query('select verified from profiles')).rows[0].verified,true);
let checks=0;
async function as(role,id,fn) {
  await db.exec('begin');
  try {
    await db.query(`select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)`,[id||'',role]);
    await db.exec(`set local role ${role}`);
    const result=await fn(); await db.exec('commit');return result;
  } catch(error) {await db.exec('rollback');throw error;}
}
async function denied(name,role,id,sql,params=[]) {await assert.rejects(()=>as(role,id,()=>db.query(sql,params)),undefined,name);checks++;}
for(const role of ['member','researcher','reviewer']) {
  await denied(`${role} cannot self-grant admin`,'authenticated',ids[role],`insert into user_roles(user_id,role) values ($1,'admin')`,[ids.other]);
}
for(const role of ['member','researcher','reviewer']) assert.equal((await as('authenticated',ids[role],()=>db.query('select public.is_repw_admin() value'))).rows[0].value,false);
assert.equal((await as('authenticated',ids.admin,()=>db.query('select public.is_repw_admin() value'))).rows[0].value,true);
for (const role of ['member','researcher','reviewer']) {
  await denied(`${role} cannot create admin invitation`,'authenticated',ids[role],`insert into repw_operator_invites(email,roles) values ('forged@example.invalid',array['admin'])`);
}
await denied('anon cannot truncate invitations','anon',null,'truncate repw_operator_invites');
const invited='00000000-0000-4000-8000-000000000010', replay='00000000-0000-4000-8000-000000000011';
await as('authenticated',ids.admin,()=>db.query(`insert into repw_operator_invites(email,roles,created_by) values ('invited@example.invalid',array['researcher'],$1)`,[ids.admin]));
await db.query(`insert into auth.users(id,email) values ($1,'invited@example.invalid')`,[invited]);
assert.equal((await db.query('select count(*)::int n from user_roles where user_id=$1',[invited])).rows[0].n,0);
await db.query('update auth.users set email_confirmed_at=now() where id=$1',[invited]);
assert.equal((await db.query('select role from user_roles where user_id=$1',[invited])).rows[0].role,'researcher');
assert.equal((await db.query('select count(*)::int n from profiles where user_id=$1',[invited])).rows[0].n,0);
await db.query(`insert into auth.users(id,email,email_confirmed_at) values ($1,'invited@example.invalid',now())`,[replay]);
assert.equal((await db.query('select count(*)::int n from user_roles where user_id=$1',[replay])).rows[0].n,0);
assert.equal((await db.query(`select is_active from repw_operator_invites where email='invited@example.invalid'`)).rows[0].is_active,false);
await denied('cannot self-verify','authenticated',ids.member,`update profiles set verified=true where user_id=$1`,[ids.member]);
await denied('cannot insert verified profile','authenticated',ids.other,`insert into profiles(user_id,county,verified) values ($1,'Fake',true)`,[ids.other]);
await denied('cannot read identifier hash','authenticated',ids.member,'select dl_hash from profiles');
await denied('cannot self-verify new assurance','authenticated',ids.member,`insert into member_assurance(user_id,account_fee_status) values ($1,'paid')`,[ids.member]);
await denied('anon cannot truncate trust','anon',null,'truncate member_assurance');
await assert.rejects(()=>db.query(`insert into member_assurance(user_id,person_status,person_verified_at) values ($1,'verified',now())`,[ids.member]));checks++;
await as('service_role',null,()=>db.query(`insert into member_assurance(user_id,account_fee_status) values ($1,'paid')`,[ids.member]));
assert.equal((await as('authenticated',ids.other,()=>db.query('select count(*)::int n from member_assurance'))).rows[0].n,0);
assert.equal((await as('authenticated',ids.member,()=>db.query('select count(*)::int n from member_assurance'))).rows[0].n,1);
const claim=`insert into profile_claims(user_id,profile_type,profile_id,profile_name,official_email,proof_notes,status) values ($1,'official','test-official','Test official','test@example.invalid','Test evidence description for isolated QA only',$2) returning id`;
await denied('cannot self-approve claim','authenticated',ids.member,claim,[ids.member,'approved']);
const claimId=(await as('authenticated',ids.member,()=>db.query(claim,[ids.member,'pending']))).rows[0].id;
assert.equal((await as('authenticated',ids.member,()=>db.query(`update profile_claims set status='approved' where id=$1 returning id`,[claimId]))).rows.length,0);
assert.equal((await db.query(`select status from profile_claims where id=$1`,[claimId])).rows[0].status,'pending');
await denied('cannot forge claim audit','authenticated',ids.member,`insert into profile_claim_audit(claim_id,actor_id,action) values ($1,$2,'claim_approved')`,[claimId,ids.member]);
await denied('cannot pay by database assertion','authenticated',ids.member,`insert into subscriptions(user_id,claim_id,status) values ($1,$2,'active')`,[ids.member,claimId]);
// Real admin review and its audit/role writes remain usable; reviewer/researcher
// roles never inherit authority to grant roles or approve profiles.
await as('authenticated',ids.admin,()=>db.query(`update profile_claims set status='approved',reviewed_by=$2,reviewed_at=now() where id=$1`,[claimId,ids.admin]));
assert.equal((await db.query(`select status from profile_claims where id=$1`,[claimId])).rows[0].status,'approved');
await as('authenticated',ids.admin,()=>db.query(`insert into user_roles(user_id,role,created_by) values ($1,'claimed_official',$2) on conflict(user_id,role) do update set created_by=excluded.created_by`,[ids.member,ids.admin]));
await as('authenticated',ids.admin,()=>db.query(`insert into profile_claim_audit(claim_id,actor_id,action) values ($1,$2,'claim_approved')`,[claimId,ids.admin]));
await as('service_role',null,()=>db.query(`insert into subscriptions(user_id,claim_id,status) values ($1,$2,'active')`,[ids.member,claimId]));
const contentSql=`insert into claimed_profile_content(user_id,claim_id,profile_id,about_me,status) values ($1,$2,$3,'Isolated test draft',$4) returning id`;
await denied('cannot self-publish content','authenticated',ids.member,contentSql,[ids.member,claimId,'test-official','approved']);
await denied('cannot submit against another profile','authenticated',ids.member,contentSql,[ids.member,claimId,'other-official','pending_review']);
const otherClaimId=(await as('authenticated',ids.other,()=>db.query(claim,[ids.other,'pending']))).rows[0].id;
await denied('cannot substitute another claim ID','authenticated',ids.member,contentSql,[ids.member,otherClaimId,'test-official','pending_review']);
const draft=(await as('authenticated',ids.member,()=>db.query(contentSql,[ids.member,claimId,'test-official','pending_review']))).rows[0].id;
assert.equal((await as('anon',null,()=>db.query('select count(*)::int n from claimed_profile_content'))).rows[0].n,0);
assert.equal((await as('authenticated',ids.member,()=>db.query(`update claimed_profile_content set status='approved' where id=$1 returning id`,[draft]))).rows.length,0);
assert.equal((await as('authenticated',ids.reviewer,()=>db.query(`update claimed_profile_content set status='approved',reviewed_by=$2,reviewed_at=now() where id=$1 returning id`,[draft,ids.reviewer]))).rows.length,0);
await as('authenticated',ids.admin,()=>db.query(`update claimed_profile_content set status='approved',reviewed_by=$2,reviewed_at=now() where id=$1`,[draft,ids.admin]));
assert.equal((await as('anon',null,()=>db.query('select count(*)::int n from claimed_profile_content'))).rows[0].n,1);
const mediaSql=`insert into profile_media(user_id,claim_id,profile_id,media_type,public_url,status) values ($1,$2,$3,'video','https://example.invalid/video',$4) returning id`;
await denied('cannot self-publish media','authenticated',ids.member,mediaSql,[ids.member,claimId,'test-official','approved']);
await denied('cannot substitute another media claim','authenticated',ids.member,mediaSql,[ids.member,otherClaimId,'test-official','pending_review']);
const media=(await as('authenticated',ids.member,()=>db.query(mediaSql,[ids.member,claimId,'test-official','pending_review']))).rows[0].id;
assert.equal((await as('anon',null,()=>db.query('select count(*)::int n from profile_media'))).rows[0].n,0);
await as('authenticated',ids.admin,()=>db.query(`update profile_media set status='approved',reviewed_by=$2,reviewed_at=now() where id=$1`,[media,ids.admin]));
assert.equal((await as('anon',null,()=>db.query('select count(*)::int n from profile_media'))).rows[0].n,1);
await denied('anon cannot truncate public media','anon',null,'truncate profile_media');

await denied('legacy verified cannot vote','authenticated',ids.member,`insert into citizen_votes(user_id,official_id,vote,county) values ($1,'test','approve','Fake')`,[ids.member]);
await denied('legacy grade cannot bypass UI','authenticated',ids.member,`insert into citizen_grades(user_id,official_id,grade,county) values ($1,'test','A','Fake')`,[ids.member]);
const comment=`insert into comments(user_id,official_id,content,display_name,county,source_url) values ($1,'test','Isolated QA comment','QA account','Spoofed county',$2) returning *`;
await denied('cannot forge official badge','authenticated',ids.member,`insert into comments(user_id,official_id,content,display_name,county,author_type) values ($1,'test','test','QA','Fake','claimed_official')`,[ids.member]);
await denied('cannot submit official answer','authenticated',ids.member,`insert into comments(user_id,official_id,content,display_name,county,comment_kind) values ($1,'test','test','QA','Fake','official_answer')`,[ids.member]);
await denied('reject unsafe source','authenticated',ids.member,comment,[ids.member,'javascript:alert(1)']);
const c=(await as('authenticated',ids.member,()=>db.query(comment,[ids.member,'https://example.invalid/record']))).rows[0];
assert.equal(c.author_type,'signed_in');assert.equal(c.county,'Not verified');assert.equal(c.assurance_basis,'member_assurance_v1');assert.equal(c.contains_source,true);
await denied('cannot change moderation','authenticated',ids.member,`update comments set visibility_status='visible' where id=$1`,[c.id]);
await db.query(`update comments set visibility_status='removed_illegal' where id=$1`,[c.id]);
assert.equal((await as('anon',null,()=>db.query('select count(*)::int n from comments'))).rows[0].n,0);
await as('service_role',null,()=>db.query(`update member_assurance set person_status='verified',person_verified_at=now()-interval '1 day',person_expires_at=now()+interval '1 year',residence_status='verified',residence_verified_at=now()-interval '1 day',residence_expires_at=now()+interval '6 months',county='Confirmed county',jurisdiction_version='test-2026' where user_id=$1`,[ids.member]));
const verifiedComment=(await as('authenticated',ids.member,()=>db.query(comment,[ids.member,null]))).rows[0];assert.equal(verifiedComment.author_type,'verified_resident');assert.equal(verifiedComment.county,'Confirmed county');
for(let i=0;i<3;i++) await as('authenticated',ids.member,()=>db.query(comment,[ids.member,null]));
await denied('comment velocity limited','authenticated',ids.member,comment,[ids.member,null]);
const poll=(await db.query('select id from race_community_polls limit 1')).rows[0].id;
await db.query(`update race_community_polls set status='open',opens_at=now()-interval '1 day',closes_at=now()+interval '1 day' where id=$1`,[poll]);
const response=`insert into race_community_poll_responses(poll_id,user_id,option_id) values ($1,$2,$3) on conflict(poll_id,user_id) do update set option_id=excluded.option_id`;
await denied('no direct member poll writes','authenticated',ids.member,response,[poll,ids.member,'dina-k-carroll']);
await as('service_role',null,()=>db.query(response,[poll,ids.member,'dina-k-carroll']));
await as('service_role',null,()=>db.query(response,[poll,ids.member,'leward-j-lafleur-ii']));
assert.equal((await db.query('select count(*)::int n from race_community_poll_responses')).rows[0].n,1);
await db.query(`update race_community_polls set status='closed' where id=$1`,[poll]);
await denied('closed polls reject even service writes','service_role',null,response,[poll,ids.other,'dina-k-carroll']);
await db.query(`update race_community_polls set status='open',closes_at=now()-interval '1 minute' where id=$1`,[poll]);
await denied('expired polls reject writes','service_role',null,response,[poll,ids.other,'dina-k-carroll']);
await db.query(`update race_community_polls set closes_at=now()+interval '1 day' where id=$1`,[poll]);
await db.query(`update race_community_poll_options set active=false where poll_id=$1 and option_id='dina-k-carroll'`,[poll]);
await denied('inactive option rejects writes','service_role',null,response,[poll,ids.other,'dina-k-carroll']);
console.log(`Member trust migration passed ${checks} denial checks plus account isolation, legitimate drafts/comments, expiry, legacy preservation and poll uniqueness/window assertions in isolated Postgres.`);
await db.close();
