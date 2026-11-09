import fs from 'node:fs';
import { initializeJson } from './core.mjs';
process.umask(0o077);
for(const key of ['ONEBOT_TOKEN','WEBUI_TOKEN','SETUP_TOKEN','CONSOLE_TOKEN']) {
  if(!/^[a-f0-9]{64}$/.test(process.env[key]||'')) throw Error('Missing or invalid '+key);
}
for(const dir of ['/data','/qq-config']) {
  fs.mkdirSync(dir,{recursive:true});
  fs.chownSync(dir,1000,1000);
}
initializeJson('/qq-config/webui.json',{host:'0.0.0.0',port:6099,token:process.env.WEBUI_TOKEN,loginRate:3});
initializeJson('/qq-config/onebot11.json',{
  network:{
    httpServers:[{name:'kit-http',enable:true,port:3000,host:'0.0.0.0',enableCors:false,enableWebsocket:false,messagePostFormat:'array',token:process.env.ONEBOT_TOKEN,debug:false}],
    websocketServers:[{name:'kit-ws',enable:true,port:3001,host:'0.0.0.0',messagePostFormat:'array',reportSelfMessage:false,enableForcePushEvent:true,token:process.env.ONEBOT_TOKEN,debug:false,heartInterval:30000}],
    httpSseServers:[],httpClients:[],websocketClients:[],plugins:[]
  },musicSignUrl:'',enableLocalFile2Url:false,parseMultMsg:false
});
for(const file of ['webui.json','onebot11.json']) fs.chownSync('/qq-config/'+file,1000,1000);
console.log('Persistent directories and default OneBot settings are ready. Existing files preserved.');
