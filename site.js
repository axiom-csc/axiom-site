import Lenis from './vendor/lenis.mjs';
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let smooth;
function syncMotion(){smooth?.destroy();smooth=null;window.lenis=null;if(!preference.matches){smooth=new Lenis({autoRaf:true,lerp:.085,smoothWheel:true,anchors:true});window.lenis=smooth;}}
syncMotion();preference.addEventListener('change',syncMotion);
const toggle=document.querySelector('.menu-toggle');const navigation=document.querySelector('#navigation');
toggle?.addEventListener('click',()=>{const open=navigation.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
navigation?.querySelectorAll('a').forEach(link=>{if(location.pathname.startsWith(link.pathname))link.setAttribute('aria-current','page');link.addEventListener('click',()=>{navigation.classList.remove('open');toggle.setAttribute('aria-expanded','false');});});
addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation?.classList.contains('open')&&!document.querySelector('.research-menu[open]')){navigation.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});

const filterButtons=[...document.querySelectorAll('[data-filter]')];
const entries=[...document.querySelectorAll('.research-entry')];
const search=document.querySelector('.library-search input');
let category='all';
function filterResearch(){
 const query=(search?.value||'').trim().toLowerCase();let count=0;
 entries.forEach(entry=>{const show=(category==='all'||entry.dataset.category===category)&&(!query||entry.textContent.toLowerCase().includes(query));entry.hidden=!show;if(show)count++;});
 const countLabel=document.querySelector('.library-count');if(countLabel)countLabel.textContent=count+' '+(count===1?'project or research note':'projects & research notes');
 const empty=document.querySelector('.empty-results');if(empty)empty.hidden=count!==0;
 smooth?.resize();
}
filterButtons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filterResearch();}));
search?.addEventListener('input',filterResearch);
const researchMenu=document.querySelector('.research-menu');
addEventListener('click',event=>{if(researchMenu?.open&&!researchMenu.contains(event.target))researchMenu.open=false;});
addEventListener('keydown',event=>{if(event.key==='Escape'&&researchMenu?.open){researchMenu.open=false;researchMenu.querySelector('summary').focus();}});
