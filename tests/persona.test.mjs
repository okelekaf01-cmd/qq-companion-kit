import {test} from 'node:test';
import assert from 'node:assert/strict';
import {patchPrefix, originalIdentity, kitIdentity} from '../docker/prepare-bridge.mjs';
test('generic character overrides fixed species without removing neighboring protocol rules',()=>{
  const prefix='tool protocol\n'+originalIdentity+'\nprivacy rules';
  const patched=patchPrefix(prefix);
  assert.ok(patched.includes(kitIdentity));
  assert.ok(patched.startsWith('tool protocol\n'));
  assert.ok(patched.endsWith('\nprivacy rules'));
  assert.equal(patchPrefix(patched),patched);
  assert.throws(()=>patchPrefix('unexpected upstream'),/changed/);
});
