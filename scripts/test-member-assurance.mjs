import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function moduleAt(path) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const testModule = { exports: {} }; new Function('module','exports',code)(testModule,testModule.exports); return testModule.exports;
}
const { getMemberAssurance } = moduleAt('src/lib/member-assurance.ts');
const { getCommunityPollResults } = moduleAt('src/lib/community-poll-results.ts');
const now = Date.parse('2026-09-08T12:00:00Z');
const dates = { person_verified_at: '2026-09-01T00:00:00Z', person_expires_at: '2027-09-01T00:00:00Z', residence_verified_at: '2026-09-01T00:00:00Z', residence_expires_at: '2027-03-01T00:00:00Z' };
assert.equal(getMemberAssurance(null,now).verified,false);
assert.equal(getMemberAssurance({ verified:true, county:'Marion' },now).verified,false);
const paid = getMemberAssurance({account_fee_status:'paid'},now);
assert.equal(paid.paidAccount,true); assert.equal(paid.personVerified,false); assert.equal(paid.residenceVerified,false); assert.equal(paid.county,null);
assert.equal(getMemberAssurance({person_status:'verified', ...dates},now).personVerified,true);
assert.equal(getMemberAssurance({residence_status:'verified', ...dates},now).residenceVerified,false);
const resident = {person_status:'verified', residence_status:'verified', county:'Marion', district:'TX-HD9', ...dates};
assert.equal(getMemberAssurance(resident,now).residenceVerified,true);
assert.equal(getMemberAssurance({...resident,person_expires_at:new Date(now).toISOString()},now).residenceVerified,false);
assert.equal(getMemberAssurance({...resident,person_verified_at:'2028-01-01'},now).personVerified,false);
assert.equal(getMemberAssurance({...resident,residence_expires_at:'invalid'},now).verified,false);
const options=[{option_id:'a',label:'A',display_order:1},{option_id:'b',label:'B',display_order:2}];
for(const total of [0,1,24]) {
  const result=getCommunityPollResults(options,[{option_id:'a',votes:total,as_of:'2026-09-08'}],25);
  assert.equal(result.resultsVisible,false); assert.equal(result.asOf,null); assert.equal(result.responseCount,total);
  assert.ok(result.options.every(option=>option.votes===null&&option.percent===null));
}
const visible=getCommunityPollResults(options,[{option_id:'a',votes:15,as_of:'2026-09-08'},{option_id:'b',votes:10,as_of:null}],25);
assert.equal(visible.resultsVisible,true); assert.deepEqual(visible.options.map(v=>v.percent),[60,40]);
assert.throws(()=>getCommunityPollResults(options,[],0));
assert.throws(()=>getCommunityPollResults(options,[{option_id:'a',votes:-1,as_of:null}],25));
assert.throws(()=>getCommunityPollResults(options,[{option_id:'a',votes:1,as_of:null},{option_id:'a',votes:2,as_of:null}],25));
assert.equal(getCommunityPollResults(options,[{option_id:'other',votes:100,as_of:null}],25).responseCount,0);
console.log('Member assurance expiry/payment isolation and poll privacy tests passed.');
