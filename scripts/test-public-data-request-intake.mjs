// Isolated Postgres only. This harness never accepts a database URL or submits
// a production form. Optional PGlite may be loaded from a scratch install.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { PGlite } = await import(process.env.REPWATCHR_PGLITE_PATH || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
grant usage on schema public,auth to anon,authenticated,service_role;
-- Simulate Supabase's broad default grants; the migration must override them.
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
`);
const migration=fs.readFileSync(new URL('../supabase/migrations/20260908_public_data_request_intake.sql',import.meta.url),'utf8');
await db.exec(migration);
await db.exec(migration);
async function as(role,fn) {
  await db.exec('begin');
  try {await db.exec(`set local role ${role}`); const result=await fn(); await db.exec('commit'); return result;}
  catch(error) {await db.exec('rollback'); throw error;}
}
let denials=0;
async function deny(role,sql,params=[]) {await assert.rejects(()=>as(role,()=>db.query(sql,params))); denials++;}
// Exact field shapes submitted by request-access route and usage helper.
const requestSql=`insert into api_access_requests(anonymous_id,user_id,email,name,organization,use_case,requested_scope,jurisdiction_focus,status)
values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id,status,created_at,updated_at`;
const payload=['test-browser',null,'qa@example.invalid','QA requester',null,'An isolated test of the source-linked data package request.','public_profiles_read','Harrison County, Texas','new'];
const eventSql=`insert into api_usage_events(api_key_id,user_id,endpoint,method,status_code,records_returned,metadata) values ($1,$2,$3,$4,$5,$6,$7) returning id`;
const saved=await as('service_role',async()=>{
  const row=(await db.query(requestSql,payload)).rows[0];
  const event=await db.query(eventSql,[null,null,'/api/public-data-api/request-access','POST',200,1,JSON.stringify({api_access_request_id:row.id,requested_scope:'public_profiles_read',event:'api_access_requested'})]);
  assert.ok(event.rows[0].id); return row;
});
assert.ok(saved.id);assert.equal(saved.status,'new');assert.ok(saved.created_at);assert.ok(saved.updated_at);
const defaultRow=await as('service_role',()=>db.query(`insert into api_access_requests(email,organization,use_case,requested_scope,jurisdiction_focus)
values ('default@example.invalid','QA organization','At least twenty characters for the pending request.','public_sources_read','Texas') returning status`));
assert.equal(defaultRow.rows[0].status,'new');
assert.equal((await as('service_role',()=>db.query('select count(*)::int n from api_access_requests'))).rows[0].n,2);
for(const role of ['anon','authenticated']) {
  await deny(role,requestSql,payload);
  await deny(role,'select * from api_access_requests');
  await deny(role,`update api_access_requests set status='approved'`);
  await deny(role,'delete from api_access_requests');
  await deny(role,'truncate api_access_requests');
  await deny(role,eventSql,[null,null,'/test','POST',200,1,'{}']);
  await deny(role,'select * from api_usage_events');
  await deny(role,'truncate api_usage_events');
}
await deny('service_role',requestSql,payload.map((v,i)=>i===6?'admin_internal':v));
await deny('service_role',requestSql,payload.map((v,i)=>i===2?'invalid email':v));
await deny('service_role',requestSql,payload.map((v,i)=>i===5?'Too short':v));
await deny('service_role',requestSql,payload.map((v,i)=>i===8?'active':v));
await deny('service_role',eventSql,[null,null,'/test','POST',200,1,'[]']);
await deny('service_role',eventSql,[null,null,'/test','POST',200,-1,'{}']);
await as('service_role',()=>db.query(`update api_access_requests set status='reviewed',updated_at='2000-01-01' where id=$1`,[saved.id]));
const updated=(await as('service_role',()=>db.query('select status,updated_at from api_access_requests where id=$1',[saved.id]))).rows[0];
assert.equal(updated.status,'reviewed');assert.notEqual(new Date(updated.updated_at).getUTCFullYear(),2000);
const tableState=(await db.query(`select relname,relrowsecurity,relforcerowsecurity from pg_class where relname in ('api_access_requests','api_usage_events')`)).rows;
assert.equal(tableState.length,2);assert.ok(tableState.every(row=>row.relrowsecurity&&row.relforcerowsecurity));
assert.equal((await db.query(`select count(*)::int n from pg_policies where tablename in ('api_access_requests','api_usage_events')`)).rows[0].n,0);
const unlaunched=(await db.query(`select to_regclass('public.api_keys') as keys,to_regclass('public.data_exports') as exports,to_regclass('public.feature_flags') as flags`)).rows[0];
assert.ok(Object.values(unlaunched).every(value=>value===null));
assert.equal((await db.query(`select count(*)::int n from api_access_requests`)).rows[0].n,2);
await db.close();
console.log(`Private data-request intake migration passed ${denials} rejection cases, exact insert shapes, pending defaults, admin update timestamp, private RLS and repeat application checks.`);
