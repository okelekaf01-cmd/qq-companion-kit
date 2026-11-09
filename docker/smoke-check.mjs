import fs from 'node:fs';
const token=process.env.SETUP_TOKEN;
const r=await fetch('http://127.0.0.1:8080/status?token='+token);
if(!r.ok) throw Error('Setup status failed');
const data=await r.json();
if(!data.dsh||data.privateCount||data.groupCount) throw Error('Unexpected initial state');
const cfg=JSON.parse(fs.readFileSync('/data/qq-bridge/config.json','utf8'));
if(cfg.allowAllWhenEmpty!==false)throw Error('Unsafe allowlist default');
console.log('Setup authentication, DSH connection and deny-all configuration verified. QQ login was not attempted.');
