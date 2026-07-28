import 'server-only'
import { createHash } from 'node:crypto'

/**
 * Script embutido da página inteligente. CONSTANTE FIXA, byte a byte igual em toda
 * resposta — nenhum dado de request é interpolado aqui. Os dados variáveis (a cadeia de
 * URLs a tentar) chegam por um <script type="application/json" id="oc"> separado, que
 * este script lê em runtime. Ver SPEC.md §6.
 *
 * cfg.p: 'a' (Android) — dispara UMA VEZ, sem timer nenhum.
 * cfg.p: 'i' (iOS) — tenta cfg.chain em sequência, ~50ms entre tentativas.
 *
 * Três travas: (1) não dispara se a navegação for voltar/avançar; (2) não dispara se a
 * página não estiver visível no instante zero (pré-carregamento do Instagram); (3) o
 * cancelamento cobre TODOS os timers agendados, não só o último.
 */
export const OPEN_SCRIPT_SOURCE = `(function(){
try{
var cfgEl=document.getElementById('oc');
if(!cfgEl)return;
var cfg=JSON.parse(cfgEl.textContent);
var navEntries=performance.getEntriesByType('navigation');
var nav=navEntries&&navEntries[0];
if(nav&&nav.type==='back_forward')return;
if(document.visibilityState!=='visible')return;
var cancelled=false;
var timers=[];
function cancelAll(){
cancelled=true;
for(var i=0;i<timers.length;i++)clearTimeout(timers[i]);
timers=[];
}
document.addEventListener('visibilitychange',function(){
if(document.visibilityState==='hidden')cancelAll();
});
window.addEventListener('pagehide',cancelAll);
window.addEventListener('blur',cancelAll);
window.addEventListener('pageshow',function(e){
if(e.persisted)cancelAll();
});
if(cfg.p==='a'){
if(!cancelled&&cfg.chain&&cfg.chain[0])location.href=cfg.chain[0];
return;
}
if(cfg.p==='i'&&cfg.chain){
for(var j=0;j<cfg.chain.length;j++){
(function(url,delay){
timers.push(setTimeout(function(){
if(!cancelled)location.href=url;
},delay));
})(cfg.chain[j],j*50);
}
}
}catch(e){}
})();`

export const OPEN_SCRIPT_SHA256 = createHash('sha256').update(OPEN_SCRIPT_SOURCE, 'utf8').digest('base64')

export interface OpenConfig {
  p: 'a' | 'i'
  chain: string[]
}
