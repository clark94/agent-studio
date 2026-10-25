import { createServer, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { runAgent } from './agent.js';
import type { AgentSpec, LLMProvider, Tool } from './types.js';

export function startServer(agents: Map<string, AgentSpec>, tools: Record<string, Tool>, llm: LLMProvider, port = Number(process.env.PORT ?? 3000), host = process.env.HOST ?? '127.0.0.1') {
  const send = (res: ServerResponse, code: number, body: unknown) => {
    res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(JSON.stringify(body));
  };
  const assets: Record<string, [string,string]> = {
    '/':['index.html','text/html; charset=utf-8'],
    '/app.js':['app.js','text/javascript; charset=utf-8'],
    '/style.css':['style.css','text/css; charset=utf-8'],
  };
  let active = 0;
  const server = createServer(async (req,res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost').pathname;
      if(req.method==='GET' && assets[url]) {
        const [file,type]=assets[url];
        const body=await readFile(new URL('../public/'+file,import.meta.url));
        res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",'Cache-Control':'no-cache'});
        res.end(body);return;
      }
      if(req.method==='GET' && url==='/health')return send(res,200,{ok:true,llm:llm.name});
      if(req.method==='GET' && url==='/agents')return send(res,200,[...agents.values()].map(a=>({name:a.name,tools:a.tools})));
      const match=url.match(/^\/agents\/([\w-]+)\/run$/);
      if(req.method==='POST' && match) {
        const spec=agents.get(match[1]);if(!spec)return send(res,404,{error:'Agent inconnu.'});
        if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'Content-Type application/json requis.'});
        if(active>=4)return send(res,429,{error:'Serveur occupé. Réessayez dans un instant.'});
        active++;
        try {
          let size=0;const chunks:Buffer[]=[];
          for await(const chunk of req){size+=chunk.length;if(size>16384){send(res,413,{error:'Requête trop volumineuse.'});return;}chunks.push(Buffer.from(chunk));}
          let body: unknown;
          try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(res,400,{error:'JSON invalide.'});}
          const q=(body && typeof body==='object' && 'question' in body) ? body.question : undefined;
          if(typeof q!=='string'||!q.trim()||q.length>2000)return send(res,400,{error:'Question requise : 1 à 2000 caractères.'});
          const started=performance.now();
          try{const result=await runAgent(spec,tools,llm,q.trim());return send(res,200,{...result,model:llm.name,latencyMs:Math.round(performance.now()-started)});}
          catch{console.error('Échec du traitement agent');return send(res,502,{error:'Le fournisseur ou un outil est indisponible.'});}
        }finally{active--;}
      }
      send(res,404,{error:'Route inconnue.'});
    }catch{if(!res.headersSent)send(res,500,{error:'Erreur interne du serveur.'});else res.end();}
  });
  server.requestTimeout=30000;
  server.listen(port,host,()=>console.log(`Agent Studio : http://${host}:${(server.address() as import('node:net').AddressInfo).port}`));
  return server;
}
