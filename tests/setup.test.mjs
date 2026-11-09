import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSetupServer} from '../docker/setup-server.mjs';
test('setup requires token, rejects cross-origin writes and validates before applying', async()=>{
  let saved=null;
  const server=createSetupServer({tokens:{setup:'test',webui:'w',console:'c',onebot:'o'},isReady:()=>true,readStatus:async()=>({qqOnline:false}),getDshLink:()=>'',saveAccess:async x=>{saved=x;}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    assert.equal((await fetch(base+'/links')).status,403);
    assert.equal((await fetch(base+'/links?token=wrong')).status,403);
    assert.equal((await fetch(base+'/links?token=test')).status,200);
    const post=(origin,body)=>fetch(base+'/access?token=test',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await post('https://evil.invalid',{owner:'123456'})).status,403);
    assert.equal(saved,null);
    assert.equal((await post('http://127.0.0.1:18670',{owner:'bad'})).status,400);
    assert.equal(saved,null);
    assert.equal((await post('http://127.0.0.1:18670',{owner:'123456'})).status,200);
    assert.deepEqual(saved.allow.private,['123456']);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
