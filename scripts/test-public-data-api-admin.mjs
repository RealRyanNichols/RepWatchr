// Execute the real TypeScript admin loader with a mocked database and launch
// gate. Never reads environment credentials or accesses the network.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as crypto from 'node:crypto';

const state={enabled:false,configured:true,queries:[],errors:{}};
const client={
  from(table) {
    state.queries.push(table);
    let head=false;
    const filters={};
    const query={
      select(_fields,options) {head=Boolean(options?.head);return query;},
      order() {return query;},
      limit() {return query;},
      eq(key,value) {filters[key]=value;return query;},
      then(resolve,reject) {
        const error=state.errors[table] ? {message:state.errors[table]} : null;
        const count=error ? null : table==='api_access_requests' ? (filters.status==='new'?3:10) : table==='api_usage_events'?12 : table==='api_keys'?2:4;
        return Promise.resolve({data:head||error?null:[{id:`test-${table}`}],count,error}).then(resolve,reject);
      },
    };
    return query;
  },
};
const dependencies={
  crypto,
  '@/lib/feature-flags':{isFeatureEnabled:async key=>{assert.equal(key,'ENABLE_PUBLIC_API');return state.enabled;}},
  '@/lib/public-data-api-config':{PUBLIC_API_ENDPOINTS:[],PUBLIC_API_SCOPES:[],API_ACCESS_STATUSES:[]},
  '@/lib/source-submissions':{},
  '@/lib/supabase-admin':{getSupabaseAdminClient:()=>state.configured?client:null},
};
const source=fs.readFileSync(new URL('../src/lib/public-data-api.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const testModule={exports:{}};
new Function('module','exports','require',compiled)(testModule,testModule.exports,id=>{
  assert.ok(Object.hasOwn(dependencies,id),`Unexpected import: ${id}`);return dependencies[id];
});
const {getPublicDataApiAdminData}=testModule.exports;

state.errors={api_keys:'Unlaunched table absent',data_exports:'Unlaunched table absent'};
const disabled=await getPublicDataApiAdminData();
assert.equal(disabled.enabled,false);
assert.deepEqual([...new Set(state.queries)].sort(),['api_access_requests','api_usage_events']);
assert.deepEqual(disabled.apiKeys,[]);assert.deepEqual(disabled.dataExports,[]);
assert.deepEqual(disabled.errors,[]);
assert.deepEqual(disabled.stats,{accessRequests:10,newRequests:3,activeKeys:0,usageEvents:12,pendingExports:0});
assert.equal(disabled.accessRequests.length,1);assert.equal(disabled.usageEvents.length,1);

state.queries=[];
state.errors={api_access_requests:'Request storage failed',api_usage_events:'Usage storage failed'};
const failed=await getPublicDataApiAdminData();
assert.deepEqual(failed.errors,['api_access_requests: Request storage failed','api_usage_events: Usage storage failed']);
assert.deepEqual([...new Set(state.queries)].sort(),['api_access_requests','api_usage_events']);

state.enabled=true;state.queries=[];state.errors={};
const enabled=await getPublicDataApiAdminData();
assert.deepEqual([...new Set(state.queries)].sort(),['api_access_requests','api_keys','api_usage_events','data_exports']);
assert.equal(enabled.apiKeys.length,1);assert.equal(enabled.dataExports.length,1);
assert.equal(enabled.stats.activeKeys,2);assert.equal(enabled.stats.pendingExports,4);
state.errors={api_keys:'Key schema missing',data_exports:'Export schema missing'};
assert.deepEqual((await getPublicDataApiAdminData()).errors,['api_keys: Key schema missing','data_exports: Export schema missing']);

state.configured=false;state.queries=[];
const unavailable=await getPublicDataApiAdminData();
assert.deepEqual(unavailable.errors,['Supabase admin client is not configured.']);
assert.deepEqual(state.queries,[]);
console.log('Admin request queue passed launch gating, active-data counts, preserved errors and unavailable-connection tests.');
