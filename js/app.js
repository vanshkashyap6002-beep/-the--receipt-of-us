(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const main = $('#main'), editor = $('#editor'), form = $('#personalise-form');
  const base = structuredClone(window.RECEIPT_CONFIG);
  const giftMode = window.RECEIPT_GIFT === true;
  const key = 'chermo.receipt-of-us.draft.v1';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fields = ['sender','recipient','occasion','date','opening','support','total','paid','status','celebration','message','letter','closing'];
  const listFields = ['little','built','statement'];
  const safeImage = src => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src || '');
  function normalise(value) {
    const result = structuredClone(base);
    if (!value || typeof value !== 'object') return result;
    fields.forEach(k => { if (typeof value[k] === 'string') result[k] = value[k].slice(0, k === 'letter' ? 5000 : 1200); });
    listFields.forEach(k => { if (Array.isArray(value[k])) result[k] = value[k].slice(0,10).filter(row => Array.isArray(row) && row.length >= 2).map(row => row.slice(0,2).map(v => String(v).slice(0,160))); });
    result.photos = Array.isArray(value.photos) ? value.photos.slice(0,10).filter(p => p && safeImage(p.src)).map(p => ({src:p.src,caption:String(p.caption || '').slice(0,180),date:String(p.date || '').slice(0,20),alt:String(p.alt || p.caption || 'A photograph from our story').slice(0,200)})) : [];
    result.reviewed = value.reviewed === true;
    result.demo = value.demo !== false;
    return result;
  }
  let data = normalise(base), draftPhotos = [], timers = [], stage = 'opening', unlocked = 0, tokenReady = false, working = false, printDone = false, filmIndex = 0, storageWarning = '';
  if (!giftMode) {
    try { const stored = localStorage.getItem(key); if (stored) data = normalise(JSON.parse(stored)); } catch { storageWarning = 'Browser storage is unavailable. You can still preview and download your gift.'; }
  }
  document.body.classList.toggle('gift-mode', giftMode);
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const later = (fn, ms) => { const id = setTimeout(fn, reduced() ? 0 : ms); timers.push(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const announce = text => { $('#announcement').textContent = text; };
  const shortName = name => name.length > 13 ? name.split(/\s+/).filter(Boolean).slice(0,2).map(n => Array.from(n)[0]).join('.') : name;
  const pair = () => `${escape(data.sender)} <span aria-hidden="true">&</span> ${escape(data.recipient)}`;
  const dateText = value => /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : value;
  let svgCount = 0;
  function heart(names = false) {
    const id = `heart-${++svgCount}`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#ffe4e5"/><stop offset=".35" stop-color="#ee9bab"/><stop offset=".72" stop-color="#dd768e"/><stop offset="1" stop-color="#aa465f"/></linearGradient></defs><path d="M50 88C40 78 8 57 8 33C8 9 37 4 50 24C64 4 92 9 92 33C92 57 60 79 50 88Z" fill="url(#${id})" stroke="#bf667c" stroke-width="1.4"/><path d="M16 31C18 16 35 16 38 22C40 27 22 23 20 38Z" fill="#fff" opacity=".75"/><path d="M60 23Q74 13 82 24" fill="none" stroke="#fff" stroke-width="5" opacity=".58" stroke-linecap="round"/><path d="M18 51Q31 72 49 82" fill="none" stroke="#fdb8c7" stroke-width="2" opacity=".7"/>${names ? `<text x="50" y="45" text-anchor="middle">${escape(shortName(data.sender))}</text><text x="50" y="54" text-anchor="middle">♥</text><text x="50" y="63" text-anchor="middle">${escape(shortName(data.recipient))}</text>` : ''}</svg>`;
  }
  function machine() {
    const compartment = n => `<div class="compartment">${Array.from({length:4},(_,i)=>`<button class="heart-shell" data-take-token aria-label="Take the love token for ${escape(data.sender)} and ${escape(data.recipient)}"${working || tokenReady ? ' disabled' : ''} style="transform:rotate(${i%2 ? 6 : -5}deg)">${heart(true)}</button>`).join('')}</div>`;
    return `<div class="machine ${working?'is-working':''}" aria-label="Mint-green vintage heart-token machine"><div class="machine-top"></div><div class="machine-brand">chermo<small>TINY THINGS. INFINITE FEELINGS.</small></div><div class="chrome-line"></div><div class="display">${compartment(0)}${compartment(1)}</div><div class="chrome-line lower"></div><div class="control-panel"><div class="keypad" aria-hidden="true">${'<i></i>'.repeat(9)}</div><div class="machine-label">THE RECEIPT<br>OF US</div><div class="coin-slot" aria-hidden="true"></div></div><div class="bottom-panel"></div><div class="release-heart">${heart()}</div><div class="print-slot"></div><div class="machine-base"></div><div class="foot left"></div><div class="foot right"></div></div>`;
  }
  function demoBadge() { return !giftMode ? `<span class="demo-label">${data.reviewed ? 'YOUR GIFT · LOCAL PREVIEW' : 'DEMO EDITION · MAKE IT YOURS'}</span>` : ''; }
  function opening() {
    const defaultHeadline = data.opening === base.opening;
    main.innerHTML = `<section class="opening"><div class="intro-copy">${demoBadge()}<h1>${defaultHeadline?'Some things are<br>too precious to<br><em>put a price on.</em>':escape(data.opening)}</h1><p class="support">${escape(data.support)}</p><div class="dedication"><span class="mini-heart" aria-hidden="true">♡</span><div><small>A LITTLE SOMETHING FOR</small><strong>${pair()}</strong></div></div></div><div class="machine-stage"><div class="stage-label"><span>THE RECEIPT OF US</span><span>ONE TOKEN. ALL OF US.</span></div>${machine()}<div class="machine-action"><button class="primary" id="take-token">Take a token of love <span aria-hidden="true">↗</span></button><p>A SMALL GESTURE. A FEELING THAT STAYS.</p></div></div></section>`;
    main.querySelectorAll('[data-take-token],#take-token').forEach(button => button.addEventListener('click', takeToken));
  }
  function takeToken(event) {
    if (tokenReady || working) return;
    tokenReady = true;
    if (event?.currentTarget.matches('[data-take-token]')) event.currentTarget.classList.add('selected');
    main.querySelectorAll('[data-take-token]').forEach(b => b.disabled = true);
    const holder = document.createElement('div'); holder.className = 'loose-token'; holder.innerHTML = `${heart()}<div class="token-names"><span>${escape(shortName(data.sender))}</span><b>♥</b><span>${escape(shortName(data.recipient))}</span></div>`;
    $('.machine-stage').append(holder);
    $('.machine-action').innerHTML = `<button class="primary" id="insert-token">Insert your token <span aria-hidden="true">↓</span></button><p class="insert-info">One little token, made for<br><strong>${pair()}</strong>.</p>`;
    $('#insert-token').addEventListener('click', insertToken);
    $('#insert-token').focus({preventScroll:true});
    announce(`Your personalised token is ready. Insert your token to begin.`);
  }
  function insertToken() {
    if (working) return;
    working = true; $('.loose-token').classList.add('inserting'); $('.machine').classList.add('is-working');
    $('.machine-action').innerHTML = '<p role="status">A LITTLE MAGIC IN THE MAKING…</p><button class="skip-print" id="skip-activation">Skip animation →</button>';
    $('#skip-activation').addEventListener('click', () => go('little'));
    later(() => go('little'),1600);
  }
  const stageLevels = {opening:0,little:1,built:2,film:3,final:4};
  function nav() {
    return `<nav class="story-nav" aria-label="Revisit your keepsakes">${[['little','01 / Little things'],['built','02 / What we built'],['film','03 / Our film'],['final','04 / Always']].filter(([s])=>stageLevels[s]<=unlocked).map(([s,title])=>`<button data-stage="${s}"${stage===s?' aria-current="step"':''}>${title}</button>`).join('')}</nav>`;
  }
  function wireNav() { main.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.stage,true))); }
  function go(next, revisit=false) {
    clearTimers(); stage = next; working = false; printDone = false; unlocked = Math.max(unlocked,stageLevels[next]);
    if (next === 'opening') { tokenReady=false; unlocked=0;filmIndex=0;opening(); }
    else if (next === 'film') film();
    else receipts(next,revisit);
    wireNav(); main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'});
    announce(next==='film'?'The moments behind the receipt. Swipe or use the arrows to explore.':next==='opening'?'The experience has restarted.':`Receipt ${next==='little'?'one':next==='built'?'two':'final'} is ${printDone?'ready to read':'printing'}.`);
  }
  function paperHeader(number,title) {
    return `<div class="receipt-brand">chermo</div><div class="receipt-title">THE RECEIPT OF US<br>RECEIPT NO. ${number}<span>${title}</span></div><p class="receipt-meta">${pair()}<br>${escape(data.occasion)}${data.date?' · '+escape(dateText(data.date)):''}${!giftMode&&!data.reviewed?'<br>DEMO COPY · PERSONALISE BEFORE GIFTING':''}</p><hr class="receipt-rule">`;
  }
  function listRows(rows) { return rows.map(([item,value])=>`<div class="receipt-row"><span class="item">${escape(item)}</span><span class="value">${escape(value)}</span></div>`).join(''); }
  function receipts(which,revisit) {
    const isFinal=which==='final', isTwo=which==='built';
    let paper, title, sub, action, next;
    if (isFinal) {
      title='And the total is…'; sub='Some things were never meant to be measured.';
      paper=`${paperHeader('003','FINAL STATEMENT')}${listRows(data.statement)}<hr class="receipt-rule"><p class="final-total"><small>TOTAL</small>${escape(data.total)}</p><p class="final-paid">${escape(data.paid)}</p><hr class="receipt-rule"><p class="final-status">STATUS: ${escape(data.status)}</p><div class="stamp">WITH ALL MY HEART</div>`;
    } else if (isTwo) {
      title='The things that matter.'; sub='A different kind of wealth. A little more us.';action='The moments behind it';next='film';
      paper=`${paperHeader('002','WHAT WE BUILT')}<div class="milestones">${data.built.map(([item,value])=>`<div class="built-entry"><span class="item">${escape(item)}</span><span class="value">${escape(value)}</span></div>`).join('')}</div><hr class="receipt-rule"><p class="receipt-end">Some things don't have a price. They have a place in your heart.</p><div class="stamp">BUILT TOGETHER</div>`;
    } else {
      title='It was always the little things.'; sub='A very unofficial record of something very real.';action="There's another part of our story.";next='built';
      paper=`${paperHeader('001','THE LITTLE THINGS')}${listRows(data.little)}<hr class="receipt-rule"><div class="stamp">VALUE: IMMEASURABLE</div><p class="receipt-end">FUNNY HOW THE LITTLE THINGS BECAME EVERYTHING.</p><div class="barcode" aria-hidden="true"></div><p class="receipt-serial">NO RETURNS. ONLY MORE MEMORIES.</p>`;
    }
    main.innerHTML=`${nav()}<section class="story-section ${isFinal?'final-section':''}"><span class="eyebrow">${isFinal?'THE PART THAT LASTS':isTwo?'ONE TOKEN. ANOTHER LITTLE SURPRISE.':'YOUR FIRST LITTLE KEEPSAKE'}</span><h1>${title}</h1><p class="story-subtitle">${sub}</p><div class="receipt-layout"><p class="side-annotation">${isTwo?'Not just what happened.<br>What we became.':'The ordinary days<br>were the good stuff.'}<small>KEEP THIS ONE CLOSE ↗</small></p><div class="paper-holder"><div class="printer-lip" aria-hidden="true"></div><article aria-label="${isFinal?'Final statement':isTwo?'Receipt two — What we built':'Receipt one — The little things'}" class="receipt ${isTwo?'two':''} ${revisit||reduced()?'':'printing'}">${paper}</article></div><p class="side-annotation right">${isTwo?'Still growing.<br>Still choosing.':'No price tag<br>could do it justice.'}<small>♥ ${isFinal?'FOREVER IN PROGRESS':'ISSUED WITH LOVE'}</small></p></div><div class="story-actions"><button id="skip-print" class="skip-print">Skip printing →</button>${!isFinal?`<button class="primary" id="continue-story" hidden>${action} <span aria-hidden="true">→</span></button>`:''}</div>${isFinal?'<div id="ending" hidden></div>':''}</section>`;
    $('#skip-print').addEventListener('click',finishPrint);
    if (!isFinal) $('#continue-story').addEventListener('click',()=>go(next));
    if (revisit || reduced()) finishPrint(); else later(finishPrint,2700);
  }
  function finishPrint() {
    if (printDone) return;printDone=true;clearTimers();$('.receipt')?.classList.remove('printing');
    const focused = document.activeElement?.id === 'skip-print'; $('#skip-print').hidden=true;
    if (stage==='final') revealEnding();else { $('#continue-story').hidden=false;if(focused)$('#continue-story').focus({preventScroll:true}); }
    announce('Printing complete. Your keepsake is ready.');
  }
  function revealEnding() {
    const ending=$('#ending');ending.hidden=false;
    ending.innerHTML=`<div class="ending-message"><h2>${escape(data.celebration)}</h2><p class="emotional-line">${escape(data.message)}</p>${data.letter?`<div class="personal-letter">${escape(data.letter)}</div>`:''}<p class="signoff">With love, ${escape(data.sender)}</p><div class="ending-heart">${heart()}</div><p class="ending-closing">${escape(data.closing)}</p><div class="signature"><span class="wordmark">chermo</span><p>Cherish Every Moment.</p><button class="secondary" id="replay">Keep the feeling. Play it again. <span aria-hidden="true">↺</span></button></div></div>`;
    $('#replay').addEventListener('click',()=>go('opening'));
  }
  function film() {
    const photos=data.photos;
    const frames=photos.length?photos.map((p,i)=>`<button class="film-frame" data-photo="${i}" aria-label="Open photograph ${i+1}: ${escape(p.caption || p.alt)}"><img class="film-image" src="${p.src}" alt="${escape(p.alt)}" loading="lazy"><span class="film-caption"><span>${escape(p.caption || 'A moment of us')}</span><b>${String(i+1).padStart(2,'0')} A</b></span></button>`).join(''):Array.from({length:3},(_,i)=>`<div class="film-frame"><div class="photo-placeholder">Your moment<br>belongs here.<small>DEMO FRAME ${String(i+1).padStart(2,'0')}<br>ADD YOUR OWN PHOTOGRAPH</small></div><div class="film-caption"><span>A story only you can tell</span><b>${i+1} A</b></div></div>`).join('');
    main.innerHTML=`${nav()}<section class="story-section film-section"><span class="eyebrow">THE MOMENTS BEHIND THE RECEIPT</span><h1>And here is what it all looked like.</h1><p class="story-subtitle">Not perfect pictures. Just perfectly ours.</p><div class="film-window" tabindex="0" role="region" aria-label="Memory film strip; swipe, scroll, or use arrow keys"><div class="film-strip">${frames}</div></div><div class="film-controls"><button class="round-button" id="film-prev" aria-label="Previous film frame">←</button><output id="film-position" aria-live="polite"></output><button class="round-button" id="film-next" aria-label="Next film frame">→</button></div>${!photos.length?'<p class="film-note">PREVIEW ONLY · These empty frames are waiting for your photos.</p>':'<p class="film-note">SWIPE TO WANDER · TAP A FRAME TO STAY A LITTLE LONGER</p>'}<button class="primary" id="to-final">One last thing, just for you <span aria-hidden="true">→</span></button></section>`;
    const strip=$('.film-window'), count=photos.length||3;
    filmIndex=Math.min(filmIndex,count-1);
    function update() { $('#film-position').textContent=`${String(filmIndex+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;$('#film-prev').disabled=filmIndex===0;$('#film-next').disabled=filmIndex===count-1; }
    const position=()=>{ const frames=main.querySelectorAll('.film-frame'); return frames[filmIndex].offsetLeft-frames[0].offsetLeft; };
    function move(delta) {filmIndex=Math.max(0,Math.min(count-1,filmIndex+delta));strip.scrollTo({left:position(),behavior:reduced()?'instant':'smooth'});update();}
    $('#film-prev').addEventListener('click',()=>move(-1));$('#film-next').addEventListener('click',()=>move(1));
    strip.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
    strip.addEventListener('scroll',()=>{const frames=[...main.querySelectorAll('.film-frame')];let best=0,dist=Infinity;frames.forEach((f,i)=>{const d=Math.abs(f.offsetLeft-frames[0].offsetLeft-strip.scrollLeft);if(d<dist){dist=d;best=i;}});filmIndex=best;update();},{passive:true});
    main.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>openPhoto(Number(button.dataset.photo))));
    $('#to-final').addEventListener('click',()=>go('final'));update();strip.scrollLeft=position();imageErrors(main);
  }
  function openPhoto(index) {
    const p=data.photos[index];if(!p)return;
    $('#photo-large').innerHTML=`<img src="${p.src}" alt="${escape(p.alt)}">`;$('#photo-title').textContent=p.caption||'A moment of us';$('#photo-date').textContent=p.date?dateText(p.date):'';
    $('#lightbox').showModal();imageErrors($('#lightbox'));
  }
  function imageErrors(container) { container.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{const note=document.createElement('span');note.className='image-error';note.textContent='This photograph could not be opened. Its place in your story is still here.';img.replaceWith(note);},{once:true})); }
  $('#close-photo').addEventListener('click',()=>$('#lightbox').close());
  $('.wordmark').addEventListener('click',e=>{e.preventDefault();go('opening');});
  $('#edit-button').addEventListener('click',()=>{
    fields.forEach(k=>form.elements[k].value=data[k]);listFields.forEach(k=>form.elements[k].value=data[k].map(row=>row.join(' | ')).join('\n'));
    form.elements.reviewed.checked=data.reviewed;draftPhotos=structuredClone(data.photos);renderPhotoEditor();$('#save-status').textContent=storageWarning;$('#upload-status').textContent='';editor.showModal();
  });
  $('#close-editor').addEventListener('click',()=>{if(!processingPhotos)editor.close();});
  editor.addEventListener('cancel',e=>{if(processingPhotos)e.preventDefault();});
  function renderPhotoEditor() {
    $('#photo-editor').innerHTML=draftPhotos.map((p,i)=>`<div class="photo-edit-row"><img src="${p.src}" alt="Photo ${i+1} preview"><div><label>Caption / photo ${i+1}<input data-caption="${i}" maxlength="180" value="${escape(p.caption)}"></label><label>Photo description for screen readers<input data-alt="${i}" maxlength="200" value="${escape(p.alt)}"></label><label>Date <span class="optional">optional</span><input type="date" data-date="${i}" value="${escape(p.date)}"></label><div class="photo-edit-buttons"><button type="button" data-up="${i}" aria-label="Move photo ${i+1} earlier"${i===0?' disabled':''}>↑</button><button type="button" data-down="${i}" aria-label="Move photo ${i+1} later"${i===draftPhotos.length-1?' disabled':''}>↓</button><button type="button" data-replace="${i}">Replace</button><button type="button" data-remove="${i}">Remove</button></div></div></div>`).join('');
    $('#photo-editor').querySelectorAll('[data-caption],[data-date],[data-alt]').forEach(input=>input.addEventListener('input',()=>{const field=Object.keys(input.dataset)[0];draftPhotos[Number(input.dataset[field])][field]=input.value;}));
    $('#photo-editor').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
      const action=Object.keys(button.dataset)[0],i=Number(button.dataset[action]);
      if(action==='remove')draftPhotos.splice(i,1);
      if(action==='up'&&i>0)[draftPhotos[i],draftPhotos[i-1]]=[draftPhotos[i-1],draftPhotos[i]];
      if(action==='down'&&i<draftPhotos.length-1)[draftPhotos[i],draftPhotos[i+1]]=[draftPhotos[i+1],draftPhotos[i]];
      if(action==='replace'){const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.addEventListener('change',()=>processFiles(input.files,i));input.click();return;}
      renderPhotoEditor();
    }));
  }
  function readPhoto(file) {
    return new Promise((resolve,reject)=>{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)){reject(new Error('Please choose JPEG, PNG or WebP photographs.'));return;}
      if(file.size>15*1024*1024){reject(new Error('Each photograph must be smaller than 15 MB.'));return;}
      const url=URL.createObjectURL(file),img=new Image();
      const timeout=setTimeout(()=>{img.onload=null;img.onerror=null;URL.revokeObjectURL(url);reject(new Error('This photograph took too long to decode. Please try a smaller image.'));},15000);
      img.onload=()=>{clearTimeout(timeout);try {const scale=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f2ea';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.84));}catch{reject(new Error('This photograph could not be processed. Try a smaller image.'));}finally{URL.revokeObjectURL(url);}};
      img.onerror=()=>{clearTimeout(timeout);URL.revokeObjectURL(url);reject(new Error('This file could not be read as a photograph. Please choose another.'));};img.src=url;
    });
  }
  let processingPhotos=false;
  async function processFiles(files,replaceIndex=null) {
    if(processingPhotos)return;processingPhotos=true;const status=$('#upload-status');status.textContent='Preparing your photographs on this device…';
    $('#download-gift').disabled=true;form.querySelector('[type=submit]').disabled=true;$('#photo-input').disabled=true;
    const errors=[];let added=0;
    try{for(const file of Array.from(files||[])){
      if(replaceIndex===null&&draftPhotos.length>=10){errors.push('Your film holds up to 10 photographs.');break;}
      try{const src=await readPhoto(file);if(replaceIndex!==null){draftPhotos[replaceIndex]={...draftPhotos[replaceIndex],src};added++;break;}draftPhotos.push({src,caption:'',date:'',alt:`Personal photograph ${draftPhotos.length+1}`});added++;}catch(e){errors.push(e.message);}
    }}finally{processingPhotos=false;$('#download-gift').disabled=false;form.querySelector('[type=submit]').disabled=false;$('#photo-input').disabled=false;$('#photo-input').value='';renderPhotoEditor();status.textContent=[`${added} photograph${added===1?'':'s'} prepared. ${draftPhotos.length}/10 frames.`,...errors].join(' ');}
  }
  $('#photo-input').addEventListener('change',e=>processFiles(e.target.files));
  function formData() {
    const value=structuredClone(data);fields.forEach(k=>value[k]=form.elements[k].value.trim());
    listFields.forEach(k=>value[k]=form.elements[k].value.split('\n').map(line=>line.split('|').map(s=>s.trim())).filter(row=>row.length===2&&row[0]&&row[1]).slice(0,10));
    value.photos=structuredClone(draftPhotos);value.reviewed=form.elements.reviewed.checked;value.demo=!value.reviewed;return value;
  }
  function validate(value,forGift) {
    if(!value.sender||!value.recipient)return 'Add both names to personalise your token.';
    if(!value.opening||!value.celebration||!value.message||!value.total)return 'Add an opening, celebration heading, personal message and final total.';
    for(const k of listFields){const lines=form.elements[k].value.split('\n').filter(line=>line.trim());if(lines.length>10||lines.some(line=>{const p=line.split('|');return p.length!==2||!p[0].trim()||!p[1].trim();})||!value[k].length)return `Please use 1–10 lines with “memory | value” in ${k==='little'?'The little things':k==='built'?'What we built':'Final statement'}.`;}
    if(forGift&&(!value.reviewed||value.sender===base.sender||value.recipient===base.recipient))return 'Use your real names and confirm that you have reviewed all sample copy before gifting.';
    if(forGift&&(value.photos.length<3||value.photos.length>10))return 'Add 3–10 real photographs before downloading your gift. Empty demo frames are never included in a gift.';
    return '';
  }
  function save(value) {data=normalise(value);try{localStorage.setItem(key,JSON.stringify(data));storageWarning='';}catch{storageWarning='This draft could not be saved in browser storage. It remains available in this session; download your gift to keep it.';}}
  form.addEventListener('submit',e=>{e.preventDefault();if(processingPhotos)return;const value=formData(),error=validate(value,false);if(error){$('#save-status').textContent=error;return;}save(value);go('opening');if(storageWarning){$('#save-status').textContent=storageWarning;return;}editor.close();announce('Your personalised preview is ready.');});
  $('#download-gift').addEventListener('click',async()=>{
    if(processingPhotos)return;const value=formData(),error=validate(value,true);if(error){$('#save-status').textContent=error;return;}
    const button=$('#download-gift');button.disabled=true;$('#save-status').textContent='Packing your words and photographs into one little gift…';
    try {
      const responses=await Promise.all(['index.html','css/styles.css','js/app.js'].map(path=>fetch(path)));
      if(responses.some(r=>!r.ok))throw new Error('Could not read the gift files. Run this product through its local preview server, then try again.');
      const [template,css,js]=await Promise.all(responses.map(r=>r.text()));
      const config=JSON.stringify({...value,demo:false}).replace(/</g,'\\u003c');
      let html=template.replace('<link rel="stylesheet" href="css/styles.css">',()=>`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`).replace('<script defer src="js/config.js"></script>',()=>`<script>window.RECEIPT_GIFT=true;window.RECEIPT_CONFIG=${config};<\/script>`).replace('<script defer src="js/app.js"></script>','');
      html=html.replace('</body>',()=>`<script>${js.replace(/<\/script/gi,'<\\/script')}<\/script></body>`);
      const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='The Receipt of Us.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);save(value);$('#save-status').textContent='Your gift file is ready. It contains your real photos and words. Share the downloaded HTML file; the recipient can open it in a modern browser.'+(storageWarning?' '+storageWarning:'');
    }catch(error){$('#save-status').textContent=error.message||'The gift could not be exported. Your draft is still here.';}finally{button.disabled=false;}
  });
  go('opening');
})();
