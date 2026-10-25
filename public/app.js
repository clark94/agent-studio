'use strict';
const $=id=>document.getElementById(id);
let last=null, busy=false;
async function api(url,options={}){
 let response;try{response=await fetch(url,{...options,signal:AbortSignal.timeout(90000)});}catch(e){throw new Error(e.name==='TimeoutError'?'Délai dépassé. Le serveur peut encore traiter la demande.':'Connexion impossible. Vérifiez que le serveur reste démarré.');}
 let data;try{data=JSON.parse(await response.text());}catch{throw new Error('Réponse serveur non JSON.');}
 if(!response.ok)throw new Error(data.error||'Erreur serveur.');return data;
}
async function connect(){
 $('retry').disabled=true;$('submit').disabled=true;$('agent').disabled=true;$('error').textContent='';
 try{
  const [health,agents]=await Promise.all([api('/health'),api('/agents')]);
  if(!Array.isArray(agents)||!agents.length)throw new Error('Aucun agent disponible.');
  $('agent').replaceChildren();
  for(const a of agents){const option=document.createElement('option');option.value=a.name;option.textContent=a.name;$('agent').append(option);}
  $('connection').textContent='● Connecté · '+health.llm;
  $('mode').textContent=health.llm==='mock'?'MODE SIMULÉ · Calculs et comptage de mots uniquement. Aucun appel payant.':'MODÈLE CONNECTÉ · Les réponses peuvent contenir des erreurs.';
  $('submit').disabled=false;$('agent').disabled=false;
 }catch(e){$('connection').textContent='○ Déconnecté';$('error').textContent=e.message;}finally{$('retry').disabled=false;}
}
$('retry').addEventListener('click',connect);
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{$('question').value=b.dataset.query;$('question').focus();}));
$('form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;const question=$('question').value.trim();if(!question){$('error').textContent='Saisissez une question.';return;}
 busy=true;last=null;$('download').disabled=true;$('submit').disabled=true;$('retry').disabled=true;$('agent').disabled=true;$('error').textContent='';$('submit').textContent='Exécution en cours…';$('duration').textContent='EN COURS';$('answer').textContent='L’agent traite votre question…';$('trace').textContent='';$('metadata').textContent='';
 const started=performance.now();
 try{const data=await api('/agents/'+encodeURIComponent($('agent').value)+'/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
 last={question,...data};$('answer').textContent=data.answer;$('trace').textContent=JSON.stringify(data.steps,null,2);$('duration').textContent=((performance.now()-started)/1000).toFixed(2)+' s';$('metadata').textContent='Modèle : '+data.model+' · '+data.steps.length+' appel(s) aux outils';$('download').disabled=false;
 }catch(err){$('error').textContent=err.message;$('answer').textContent='Aucun résultat disponible.';$('duration').textContent='ÉCHEC';}
 finally{busy=false;$('submit').disabled=false;$('retry').disabled=false;$('agent').disabled=false;$('submit').textContent='Exécuter l’agent ↗';}
});
$('download').addEventListener('click',()=>{if(!last)return;const url=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='agent-resultat.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
connect();
