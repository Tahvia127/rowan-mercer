/* Rowan Mercer — static build. Gallery markup comes from the image manifest. No dependencies. */
import { readFileSync, writeFileSync } from 'node:fs';

const site = JSON.parse(readFileSync('data/site.json','utf8'));
const man  = JSON.parse(readFileSync('data/images.json','utf8'));
const gal  = JSON.parse(readFileSync('data/gallery.json','utf8'));

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const byId = Object.fromEntries(man.images.map(i=>[i.id,i]));
const telRaw = site.phone.replace(/[^\d+]/g,'');
const kb = n => Math.round(n/1024);

const photos = gal.photos.filter(p=>byId[p.id]);
const cols = [...new Set(photos.map(p=>p.collection))];

const srcset = im => im.sizes.map(s=>`assets/img/${im.id}-${s.w}.webp ${s.w}w`).join(', ');

/* grid: browser picks 480 or 900 depending on column width; 1600 is only for the lightbox */
const SHOTS = photos.map((p,i)=>{
  const im = byId[p.id];
  const grid = im.sizes.filter(s=>s.w<=900);
  return `
        <button class="shot" type="button" data-i="${i}" data-col="${esc(p.collection)}"
          aria-label="Open ${esc(p.caption)}">
          <img class="ph" src="${im.lqip}" alt="" width="${im.w}" height="${im.h}" aria-hidden="true">
          <img class="real" alt="${esc(p.caption)}" loading="lazy" decoding="async"
            width="${im.w}" height="${im.h}"
            sizes="(max-width:900px) 46vw, 22vw"
            srcset="${grid.map(s=>`assets/img/${im.id}-${s.w}.webp ${s.w}w`).join(', ')}"
            src="assets/img/${im.id}-${grid[grid.length-1].w}.webp">
          <span class="cap">${esc(p.caption)}</span>
        </button>`;
}).join('');

const FILTERS = ['All',...cols].map((c,i)=>
  `<button class="fbtn" type="button" data-f="${c==='All'?'':esc(c)}" aria-pressed="${i===0}">${esc(c)}</button>`).join('');

const PKS = site.packages.map(p=>`
      <article class="pk rv${p.featured?' f':''}">
        ${p.featured?'<span class="flag">Most booked</span>':''}
        <h3>${esc(p.name)}</h3><p class="hrs">${esc(p.hours)}</p>
        <p class="pr">$${p.price.toLocaleString('en-US')}</p>
        <p>${esc(p.note)}</p>
      </article>`).join('');

/* real numbers from the manifest, not claims */
const gridBytes = photos.reduce((n,p)=>{
  const s=byId[p.id].sizes.filter(x=>x.w<=900); return n + s[s.length-1].bytes; },0);
const allBytes = man.outputBytes;
const biggest = Math.max(...man.images.flatMap(i=>i.sizes.map(s=>s.bytes)));

const d = site.demo||{};
const DEMOBAR = d.show?`<div class="demo-bar" role="note"><p>${esc(d.text)}</p><span class="sep">&middot;</span>
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>`:'';
const DEMOFOOT = d.show?`<div class="demo-foot">${esc(d.text)}
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>`:'';

const JSONLD = JSON.stringify({'@context':'https://schema.org','@type':'ProfessionalService',
  name:site.name, description:site.intro, telephone:site.phone, email:site.email, areaServed:site.city});

const SCRIPT = `<script>
var PHOTOS = ${JSON.stringify(photos.map(p=>({c:p.caption,col:p.collection,
  full:'assets/img/'+p.id+'-'+byId[p.id].sizes[byId[p.id].sizes.length-1].w+'.webp'})))};
document.getElementById('yr').textContent=new Date().getFullYear();
var nav=document.getElementById('nav');
addEventListener('scroll',function(){nav.classList.toggle('stuck',scrollY>12)},{passive:true});
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.05});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
}else{document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')})}

/* fade each photo in over its blurred placeholder */
document.querySelectorAll('.shot img.real').forEach(function(img){
  if(img.complete && img.naturalWidth) img.classList.add('loaded');
  else img.addEventListener('load',function(){ img.classList.add('loaded') });
});

/* collection filter */
var shots=[].slice.call(document.querySelectorAll('.shot')), fbtns=document.querySelectorAll('.fbtn');
fbtns.forEach(function(b){ b.addEventListener('click',function(){
  fbtns.forEach(function(o){o.setAttribute('aria-pressed',String(o===b))});
  var f=b.dataset.f;
  shots.forEach(function(s){ s.hidden = !!f && s.dataset.col!==f });
})});

/* lightbox */
var lb=document.getElementById('lb'), lbImg=document.getElementById('lbImg'),
    lbMeta=document.getElementById('lbMeta'), cur=0, lastFocus=null;
function visible(){ return shots.filter(function(s){return !s.hidden}) }
function show(i){
  var list=visible(); if(!list.length) return;
  cur=(i+list.length)%list.length;
  var idx=+list[cur].dataset.i, p=PHOTOS[idx];
  lbImg.src=p.full; lbImg.alt=p.c;
  lbMeta.textContent=p.c+' \\u00b7 '+p.col+' \\u00b7 '+(cur+1)+' of '+list.length;
  var nxt=PHOTOS[+list[(cur+1)%list.length].dataset.i]; if(nxt){ new Image().src=nxt.full }
}
function open(i){ lastFocus=document.activeElement; lb.classList.add('open');
  lb.setAttribute('aria-hidden','false'); show(i); document.getElementById('lbClose').focus();
  document.body.style.overflow='hidden' }
function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true');
  document.body.style.overflow=''; if(lastFocus) lastFocus.focus() }
shots.forEach(function(s){ s.addEventListener('click',function(){ open(visible().indexOf(s)) }) });
document.getElementById('lbClose').addEventListener('click',close);
document.getElementById('lbPrev').addEventListener('click',function(){show(cur-1)});
document.getElementById('lbNext').addEventListener('click',function(){show(cur+1)});
lb.addEventListener('click',function(e){ if(e.target===lb) close() });
addEventListener('keydown',function(e){
  if(!lb.classList.contains('open')) return;
  if(e.key==='Escape') close();
  if(e.key==='ArrowRight') show(cur+1);
  if(e.key==='ArrowLeft') show(cur-1);
});

/* measured, not claimed */
addEventListener('load',function(){
  setTimeout(function(){
    var r=performance.getEntriesByType('resource');
    var imgs=r.filter(function(e){return /\\.webp$/.test(e.name)});
    var bytes=r.reduce(function(n,e){return n+(e.transferSize||0)},0);
    var el=document.getElementById('measured');
    if(el) el.textContent='On this load your browser fetched '+imgs.length+
      ' image files and '+Math.round(bytes/1024)+' KB in total.';
  },900);
});
</script>`;

const vars = {
  NAME:esc(site.name), TAGLINE:esc(site.tagline), CITY:esc(site.city),
  INTRO:esc(site.intro), INTRO_SHORT:esc(site.intro.split('. ')[0]+'.'),
  PHONE:esc(site.phone), PHONE_RAW:telRaw, EMAIL:esc(site.email), IG:esc(site.instagram),
  SHOTS, FILTERS, PKS, DEMOBAR, DEMOFOOT, SCRIPT, JSONLD,
  HERO_ID: photos[0].id, HERO_SRCSET: srcset(byId[photos[0].id]),
  N_PHOTOS: photos.length, N_RENDITIONS: man.images.reduce((n,m)=>n+m.sizes.length,0),
  SRC_MB: (man.sourceBytes/1048576).toFixed(1),
  GRID_KB: kb(gridBytes), ALL_MB: (allBytes/1048576).toFixed(1), BIGGEST_KB: kb(biggest),
  AVG_KB: kb(gridBytes/photos.length)
};
const out = readFileSync('src/index.template.html','utf8')
  .replace(/\{\{(\w+)\}\}/g,(m,k)=> k in vars ? vars[k] : (console.warn('  ! unknown token',k),m));
writeFileSync('index.html', out);
console.log(`  built index.html`);
console.log(`  ${photos.length} photos, ${vars.N_RENDITIONS} renditions, grid payload ${vars.GRID_KB} KB if every photo loads`);
