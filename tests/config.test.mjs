import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeConfig, parseAccess, initializeJson, authorize, statusSummary } from '../docker/core.mjs';

test('new installs deny all chats and use only the explicit OneBot endpoint', () => {
  const c = makeConfig({slang:{enabled:true,autoResearch:true},socialV2:{tools:{},wake:{},send:{},proactive:{}}}, 'a'.repeat(64), 'b'.repeat(64));
  assert.equal(c.allowAllWhenEmpty, false);
  assert.deepEqual(c.allow, {private:[],groups:[]});
  assert.equal(c.snowluma.followDiscoveredEndpoint, false);
  assert.equal(c.snowluma.wsUrl, 'ws://qq:3001');
  assert.equal(c.dsh.reasoningEffort, 'low');
  assert.equal(c.socialV2.tools.getSelfImage, false);
  assert.equal(c.slang.autoResearch, false);
});
test('access input validates QQ numbers and deduplicates groups', () => {
  assert.deepEqual(parseAccess({owner:'123456',groups:'765432,765432 987654'}), {ownerQQ:'123456',allow:{private:['123456'],groups:['765432','987654']}});
  for (const data of [{owner:''},{owner:'abc'},{owner:'123456',groups:'x'}]) assert.throws(()=>parseAccess(data));
});
test('retrying initialization preserves existing settings', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-kit-test-'));
  try {
    const file=path.join(dir,'config.json');
    initializeJson(file,{a:1});
    initializeJson(file,{a:2});
    assert.deepEqual(JSON.parse(fs.readFileSync(file)),{a:1});
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
test('authentication checks exact token and rejects empty/missing input', () => {
  assert.equal(authorize('secret','secret'),true);
  for(const token of [null,undefined,'','Secret','secret-extra']) assert.equal(authorize(token,'secret'),false);
  assert.equal(authorize('',''),false);
});
test('status uses the pinned bridge dshReady field',()=>{
  assert.deepEqual(statusSummary({dshReady:true,snowluma:{connected:true}},{allow:{private:['123456'],groups:[]}},false),{qqOnline:false,onebot:true,dsh:true,privateCount:1,groupCount:0});
});
