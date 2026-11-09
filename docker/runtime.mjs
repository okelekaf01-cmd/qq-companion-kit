import fs from 'node:fs';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import {makeConfig,initializeJson,statusSummary} from './core.mjs';
import {createSetupServer} from './setup-server.mjs';

process.umask(0o077);
const root='/data/qq-bridge', logs='/data/logs';
const tokens={setup:process.env.SETUP_TOKEN,console:process.env.CONSOLE_TOKEN,onebot:process.env.ONEBOT_TOKEN,webui:process.env.WEBUI_TOKEN};
for(const value of Object.values(tokens)) if(!/^[a-f0-9]{64}$/.test(value||'')) throw Error('Run the installer to create credentials');
fs.mkdirSync(logs,{recursive:true});
if(!fs.existsSync(root)) {
  const staging=root+'.installing';
  fs.cpSync('/opt/qq-bridge',staging,{recursive:true,filter:p=>!p.split('/').includes('node_modules')});
  if(!fs.existsSync(staging+'/node_modules')) fs.symlinkSync('/opt/qq-bridge/node_modules',staging+'/node_modules','dir');
  fs.renameSync(staging,root);
}
fs.mkdirSync(root+'/state',{recursive:true});
fs.mkdirSync('/data/workspace',{recursive:true});
initializeJson(root+'/config.json',makeConfig(JSON.parse(fs.readFileSync(root+'/config.example.json','utf8')),tokens.onebot,tokens.console));
initializeJson(root+'/state/current-role.json',{role:'默认朋友',mode:'active'});
const roleFile=root+'/roles/默认朋友.md';
if(!fs.existsSync(roleFile)) fs.writeFileSync(roleFile,'# 性格与相处\n你温和、好奇、有自己的判断，珍惜平等、自愿的相处。兴趣和表达方式可以随着共同经历慢慢形成。认真求助时准确回答，闲聊时回应眼前的话题和情绪。昵称由双方商量，不根据昵称编造生活经历。\n',{flag:'wx'});

// The web profile needs its standard bundles as well as QQBridge's two bundles.
const {PROFILE_TEMPLATES}=await import('/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js');
const profile='/data/dsh/profiles/web';
fs.mkdirSync(profile,{recursive:true});
const manifestFile=profile+'/package.json';
const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{name:'qq-kit-profile',private:true};
manifest.dsh??={};manifest.dsh.profile??={};
manifest.dsh.profile.bundles=[...new Set([...PROFILE_TEMPLATES.web.bundles,...(manifest.dsh.profile.bundles||[])])];
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
function checked(name,command,args,timeout) {
  const r=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout,env:{...process.env,QQ_BRIDGE_SKIP_DSH_INSTALL:'1'}});
  fs.writeFileSync(logs+'/'+name+'.log',(r.stdout||'')+'\n'+(r.stderr||''));
  if(r.status!==0) throw Error(name+' failed; inspect private log in /data/logs');
}
checked('preset-setup','node',['scripts/setup-dsh.mjs'],120000);
if(!fs.existsSync('/data/.bundles-ready')) {
  checked('bundle-install','dsh',['plugin','--profile','web','install'],600000);
  fs.writeFileSync('/data/.bundles-ready','0.1.0\n');
}
let stopping=false,ready=false,dshStarted=false;
const children=[];
function stop(code=0) {
  if(stopping)return;
  stopping=true;
  for(const p of children)p.kill('SIGTERM');
  setTimeout(()=>process.exit(code),1500).unref();
}
function start(name,command,args,cwd) {
  const fd=fs.openSync(logs+'/'+name+'.log','a');
  const p=spawn(command,args,{cwd,stdio:['ignore',fd,fd],env:process.env});
  fs.closeSync(fd);children.push(p);
  p.on('error',()=>stop(1));
  p.on('exit',()=>{if(!stopping){console.error(name+' stopped; container will restart');stop(1);}});
}
start('dsh','dsh',['web','--no-open','--port','18680'],'/data/workspace');
for(let i=0;i<180;i++) {
  try {const r=await fetch('http://127.0.0.1:18680/',{signal:AbortSignal.timeout(1000)});if([200,401].includes(r.status)&&fs.existsSync('/data/dsh/.credentials.yaml')){dshStarted=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,1000));
}
if(!dshStarted)throw Error('DSH startup timeout');
start('bridge','node',['src/bridge.js'],root);
for(let i=0;i<120;i++) {
  try {if((await bridgeRequest('/api/status')).dshReady){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,1000));
}
if(!ready)throw Error('Bridge did not connect to DSH before timeout');
for(const [listen,target] of [[18080,18680],[13100,18610]]) {
  net.createServer(socket=>{
    const upstream=net.connect(target,'127.0.0.1');socket.pipe(upstream).pipe(socket);
    socket.on('error',()=>upstream.destroy());upstream.on('error',()=>socket.destroy());
  }).listen(listen,'0.0.0.0');
}
async function bridgeRequest(route,method='GET',body) {
  const response=await fetch('http://127.0.0.1:18610'+route,{method,headers:{'x-console-token':tokens.console,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Bridge request failed');return response.json();
}
function getDshLink() {
  const log=fs.readFileSync(logs+'/dsh.log','utf8').slice(-150000).replace(/\u001b\[[0-9;]*m/g,'');
  const urls=[...log.matchAll(/https?:\/\/(?:127\.0\.0\.1|localhost):18680\/[^\s\u001b<>]*/g)];
  return urls.at(-1)?.[0]||'http://127.0.0.1:18680/';
}
createSetupServer({tokens,getDshLink,isReady:()=>ready,guideFile:'/opt/kit/docs/index.html',
  readStatus:async()=>{
    let qqOnline=false;
    try{const r=await fetch('http://qq:3000/get_login_info',{method:'POST',headers:{Authorization:'Bearer '+tokens.onebot,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(3000)});const x=await r.json();qqOnline=x.status==='ok'&&x.retcode===0;}catch{}
    const status=await bridgeRequest('/api/status');
    const access=await bridgeRequest('/api/whitelist');
    return statusSummary(status,access,qqOnline);
  },
  saveAccess:async access=>{
    const saved=await bridgeRequest('/api/whitelist','POST',access);
    if(saved.ok!==true)throw Error('Save failed');
    const current=await bridgeRequest('/api/whitelist');
    if(String(current.ownerQQ)!==access.ownerQQ||JSON.stringify(current.allow?.private?.map(String))!==JSON.stringify(access.allow.private)||JSON.stringify(current.allow?.groups?.map(String).sort())!==JSON.stringify(access.allow.groups.toSorted()))throw Error('Readback mismatch');
  }
}).listen(8080,'0.0.0.0');
setInterval(()=>{
  for(const name of ['dsh','bridge']) {
    const file=logs+'/'+name+'.log';
    try{if(fs.statSync(file).size>5*1024*1024){const b=fs.readFileSync(file);fs.writeFileSync(file,b.subarray(-2*1024*1024));}}catch{}
  }
},60000).unref();
process.on('SIGTERM',()=>stop());process.on('SIGINT',()=>stop());
console.log('Setup ready on container port 8080. No QQ accounts are allowed until configured.');
