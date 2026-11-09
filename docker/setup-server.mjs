import http from 'node:http';
import fs from 'node:fs';
import { authorize, parseAccess } from './core.mjs';

export function createSetupServer({tokens, readStatus, saveAccess, getDshLink, isReady, guideFile}) {
  const page=fs.readFileSync(new URL('./setup.html',import.meta.url),'utf8');
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const url=new URL(req.url,'http://127.0.0.1:18670');
    if(req.method==='GET'&&url.pathname==='/ping') {
      res.writeHead(isReady()?200:503); return res.end('setup');
    }
    if(!authorize(url.searchParams.get('token')||req.headers['x-setup-token'],tokens.setup)) {
      res.writeHead(403); return res.end('Open the private setup URL printed by the installer.');
    }
    try {
      if(req.method==='GET'&&url.pathname==='/') {
        res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(page);
      }
      if(req.method==='GET'&&url.pathname==='/guide') {
        res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(fs.readFileSync(guideFile));
      }
      if(req.method==='GET'&&url.pathname==='/links') {
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify({qq:'http://127.0.0.1:18699/webui',webuiToken:tokens.webui,consoleToken:tokens.console,onebotToken:tokens.onebot,dsh:getDshLink()}));
      }
      if(req.method==='GET'&&url.pathname==='/status') {
        res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify(await readStatus()));
      }
      if(req.method==='POST'&&url.pathname==='/access') {
        if(req.headers.origin!=='http://127.0.0.1:18670') {res.writeHead(403);return res.end('Origin rejected');}
        let body='';
        for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096){res.writeHead(413);return res.end('Request too large');}}
        const access=parseAccess(JSON.parse(body));
        await saveAccess(access);
        res.setHeader('Content-Type','application/json');return res.end('{"ok":true}');
      }
      res.writeHead(404);res.end('Not found');
    }catch(error){
      res.writeHead(400,{'Content-Type':'application/json'});
      const validation=error.message==='请填写正确的管理 QQ 号和群号';
      res.end(JSON.stringify({error:validation?error.message:'操作未完成。请确认桥接已启动，再查看运行日志。'}));
    }
  });
}
