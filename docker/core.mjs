import fs from 'node:fs';
import crypto from 'node:crypto';

export function initializeJson(file, value) {
  try { fs.writeFileSync(file, JSON.stringify(value,null,2)+'\n', {flag:'wx', mode:0o600}); }
  catch(error) { if(error.code!=='EEXIST') throw error; }
}

export function authorize(value, expected) {
  if(typeof value!=='string'||!value||!expected) return false;
  const a=Buffer.from(value), b=Buffer.from(expected);
  return a.length===b.length && crypto.timingSafeEqual(a,b);
}

export function parseAccess(data) {
  const owner=String(data.owner??'').trim();
  const groups=[...new Set(String(data.groups??'').split(/[,，\s]+/).filter(Boolean))];
  if(!/^\d{5,12}$/.test(owner)||groups.some(x=>!/^\d{5,12}$/.test(x))) throw Error('请填写正确的管理 QQ 号和群号');
  return {ownerQQ:owner,allow:{private:[owner],groups}};
}

export function statusSummary(status, access, qqOnline) {
  return {qqOnline,onebot:!!status.snowluma?.connected,dsh:!!status.dshReady,privateCount:access.allow?.private?.length||0,groupCount:access.allow?.groups?.length||0};
}

export function makeConfig(template, onebotToken, consoleToken) {
  const c=structuredClone(template);
  c.dsh={...c.dsh,baseUrl:'http://127.0.0.1:18680',provider:'deepseek-official',model:'deepseek-flash',reasoningEffort:'low',authToken:'',allowRemote:false};
  c.snowluma={wsUrl:'ws://qq:3001',httpUrl:'http://qq:3000',accessToken:onebotToken,followDiscoveredEndpoint:false,homeDir:'',silenceWarnMs:600000};
  c.consolePort=18610;
  c.consoleToken=consoleToken;
  c.sessionCwd='/data/workspace';
  c.ownerQQ=null;
  c.allow={private:[],groups:[]};
  c.allowAllWhenEmpty=false;
  c.slang={...c.slang,enabled:false,autoResearch:false};
  c.socialV2.tools.getSelfImage=false;
  c.socialV2.tools.sendVoice=false;
  c.socialV2.wake.maxWakePerHour=6;
  c.socialV2.send.maxSendPerHour=30;
  c.socialV2.proactive.probability=0.15;
  return c;
}
