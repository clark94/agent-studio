import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {startServer} from '../dist/server.js';
import {MockLLM} from '../dist/llm.js';
import {builtinTools} from '../dist/tools.js';
test('Interface, API, outils et validation HTTP',async()=>{
 const agents=new Map([['assistant-calcul',{name:'assistant-calcul',systemPrompt:'Assistant',tools:['calculator','word_count'],maxSteps:4}]]);
 const server=startServer(agents,builtinTools,new MockLLM(),0,'127.0.0.1');
 await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 try{
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/Agent Studio/);assert.match(home.headers.get('content-security-policy'),/script-src 'self'/);
  for(const path of ['/app.js','/style.css','/health','/agents'])assert.equal((await fetch(base+path)).status,200);
  const post=body=>fetch(base+'/agents/assistant-calcul/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const response=await post({question:'Combien font 7*6 ?'});assert.equal(response.status,200);const result=await response.json();assert.equal(result.answer,'42');assert.equal(result.model,'mock');assert.equal(result.steps[0].tool,'calculator');
  for(const body of [{question:1},{question:''},{question:'x'.repeat(2001)},null])assert.equal((await post(body)).status,400);
  assert.equal((await fetch(base+'/agents/assistant-calcul/run',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
  assert.equal((await post({question:'x'.repeat(17000)})).status,413);
  assert.equal((await fetch(base+'/missing')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
