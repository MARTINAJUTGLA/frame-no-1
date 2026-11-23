/* Director/genre collections and browser-local personal lists. No account or network service. */
(() => {
  'use strict';
  const films = window.FRAME_FILMS, curated = window.FRAME_COLLECTIONS;
  const key = 'frame-no-1:lists:v1', base = document.body.dataset.base || './';
  const byId = new Map(films.map(f => [f.id,f]));
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const uid = prefix => prefix + '-' + (window.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
  const safeId = (id,prefix) => typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id) ? id : uid(prefix);
  const say = message => {const status=document.getElementById('status');if(status) status.textContent=message;};
  function validate(raw) {
    if (!Array.isArray(raw) || raw.length > 20) throw Error('Invalid personal lists');
    const used = new Set();
    return raw.map(list => {
      if (!list || typeof list.name !== 'string' || !list.name.trim() || !Array.isArray(list.entries) || list.entries.length > 100) throw Error('Invalid list');
      let id=safeId(list.id,'list');if(used.has(id)) id=uid('list');used.add(id);
      const entryIds = new Set();
      return {id,name:list.name.trim().replace(/\s+/g,' ').slice(0,60),entries:list.entries.map(entry=>{
        if (!entry || typeof entry.title !== 'string' || !entry.title.trim()) throw Error('Invalid title');
        let eid=safeId(entry.id,'entry');if(entryIds.has(eid)) eid=uid('entry');entryIds.add(eid);
        const film=byId.get(entry.filmId);
        return {id:eid,title:film?.title || entry.title.trim().replace(/\s+/g,' ').slice(0,140),year:film?.year || (Number.isInteger(+entry.year) && +entry.year>=1888 && +entry.year<=2200 ? +entry.year : ''),filmId:film?.id || '',watched:entry.watched===true};
      })};
    });
  }
  let lists=[];
  try {const saved=localStorage.getItem(key);if(saved) lists=validate(JSON.parse(saved));} catch {say('Personal lists could not be read. You can keep working, but export a backup before leaving.');}
  function save(){try{localStorage.setItem(key,JSON.stringify(lists));}catch{say('Personal lists could not be saved in this browser. Export a backup before leaving.');}}
  const watched = entry => entry.filmId ? window.FRAME_JOURNAL.isWatched(entry.filmId) : entry.watched;
  const groups = {
    curated:curated.map(c=>({...c,type:'Collection'})),
    directors:[...new Set(films.map(f=>f.director))].sort((a,b)=>a.localeCompare(b)).map(name=>({id:'director-'+films.find(f=>f.director===name).directorId,title:name,subtitle:'Selected films in this archive. Watched status is shared with My Frames.',type:'Director collection',ids:films.filter(f=>f.director===name).map(f=>f.id)})),
    genres:[...new Set(films.map(f=>f.genre))].sort().map(genre=>({id:'genre-'+fold(genre).replace(/\s+/g,'-'),title:genre,subtitle:'Explore this editorial genre selection, one film at a time.',type:'Genre collection',ids:films.filter(f=>f.genre===genre).map(f=>f.id)}))
  };
  const grid=document.getElementById('checklist-grid'), search=document.getElementById('checklist-search');
  let view='curated';
  function entryRow(entry,list){return `<li><label><input type="checkbox" data-personal-watch="${list.id}" data-entry="${entry.id}" ${watched(entry)?'checked':''} aria-label="Mark ${escape(entry.title)} watched"></label>${entry.filmId?`<a href="${base}films/${entry.filmId}.html">${escape(entry.title)}</a>`:`<span>${escape(entry.title)}</span>`}<span>${entry.year || 'Your entry'}</span><button type="button" class="remove-entry" data-remove-entry="${entry.id}" data-list="${list.id}" aria-label="Remove ${escape(entry.title)} from ${escape(list.name)}">×</button></li>`;}
  function progress(id,count,total){return `<div class="auto-progress"><label for="${id}">${count} / ${total} watched · ${total?Math.round(count/total*100):0}%</label><progress id="${id}" max="${total || 1}" value="${count}">${total?Math.round(count/total*100):0}%</progress></div>`;}
  function collectionCard(group){const count=group.ids.filter(id=>window.FRAME_JOURNAL.isWatched(id)).length;return `<article class="checklist" id="${group.id}" data-auto-group="${group.id}"><p class="eyebrow">${group.type}</p><h2>${escape(group.title)}</h2><p>${escape(group.subtitle)}</p>${group.source?`<p class="source-line"><a href="${escape(group.source)}">Source: BFI Sight and Sound 2022</a></p>`:''}${progress('auto-'+group.id,count,group.ids.length)}<ul>${group.ids.map(id=>{const film=byId.get(id);return `<li><label><input type="checkbox" data-auto-check="${id}" ${window.FRAME_JOURNAL.isWatched(id)?'checked':''} aria-label="Mark ${escape(film.title)} watched"></label><a href="${base}films/${id}.html">${escape(film.title)}</a><span>${film.year}</span></li>`;}).join('')}</ul></article>`;}
  function customCard(list){const count=list.entries.filter(watched).length;return `<article class="checklist custom-list" data-personal-list="${list.id}"><p class="eyebrow">YOUR OWN LIST</p><div class="custom-list-header"><h2>${escape(list.name)}</h2><button type="button" class="remove-list" data-remove-list="${list.id}" aria-label="Delete ${escape(list.name)}">Delete list</button></div><button type="button" class="print-list" data-print-list="${list.id}">Print checklist</button><p class="print-help">Print this list or choose Save as PDF in the print window.</p>${progress('personal-'+list.id,count,list.entries.length)}<ul>${list.entries.map(entry=>entryRow(entry,list)).join('')}</ul>${!list.entries.length?'<p class="custom-empty">An empty reel. Add your first film below.</p>':''}<form class="custom-add" data-add-film="${list.id}"><label for="title-${list.id}">Film title<input id="title-${list.id}" name="title" list="archive-titles" required maxlength="140" placeholder="From the archive or your own title"></label><label for="year-${list.id}">Year<input id="year-${list.id}" name="year" inputmode="numeric" type="number" min="1888" max="2200" placeholder="Optional"></label><label class="custom-watched"><input name="watched" type="checkbox" checked> I’ve watched this</label><button type="submit">Add film ↗</button></form></article>`;}
  function builder(){return `<section class="personal-builder"><p class="eyebrow">NO PERFECT LIST REQUIRED</p><h2>Create your own checklist.</h2><p>Name a list, then add archive films or type titles of your own. Tick what you’ve seen. Your lists stay in this browser and are included in journal backups. Each list has a Print checklist option to print it or save it as a PDF.</p><form id="new-personal-list"><label for="personal-list-name">List name<input id="personal-list-name" name="name" required maxlength="60" placeholder="Sunday screenings, films with friends…"></label><button type="submit">Create a checklist ↗</button></form></section>`;}
  function render(){if(!grid)return;const query=fold(search?.value || '');document.querySelectorAll('[data-checklist-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.checklistType===view)));let matched=[];
    if(view==='personal'){matched=lists.filter(l=>fold(l.name+' '+l.entries.map(e=>e.title).join(' ')).includes(query));grid.innerHTML=builder()+matched.map(customCard).join('');}
    else {matched=groups[view].filter(g=>fold(g.title+' '+g.ids.map(id=>byId.get(id).title).join(' ')).includes(query));grid.innerHTML=matched.map(collectionCard).join('');}
    document.getElementById('checklist-count').textContent=`${matched.length} ${view==='personal'?'personal lists':view==='directors'?'director collections':view==='genres'?'genre collections':'collections'}`;
    if(!matched.length && view!=='personal') grid.innerHTML='<p class="custom-empty">No collections match that search.</p>';
  }
  function refreshProgress(){if(!grid)return;document.querySelectorAll('[data-auto-check]').forEach(el=>{el.checked=window.FRAME_JOURNAL.isWatched(el.dataset.autoCheck);});document.querySelectorAll('[data-personal-watch]').forEach(el=>{const list=lists.find(l=>l.id===el.dataset.personalWatch),entry=list?.entries.find(e=>e.id===el.dataset.entry);if(entry)el.checked=watched(entry);});
    document.querySelectorAll('[data-auto-group]').forEach(card=>{const group=Object.values(groups).flat().find(g=>g.id===card.dataset.autoGroup);const n=group.ids.filter(id=>window.FRAME_JOURNAL.isWatched(id)).length;card.querySelector('.auto-progress').innerHTML=progress('auto-'+group.id,n,group.ids.length).replace(/^<div class="auto-progress">|<\/div>$/g,'');});
    document.querySelectorAll('[data-personal-list]').forEach(card=>{const list=lists.find(l=>l.id===card.dataset.personalList);if(list)card.querySelector('.auto-progress').innerHTML=progress('personal-'+list.id,list.entries.filter(watched).length,list.entries.length).replace(/^<div class="auto-progress">|<\/div>$/g,'');});
  }
  function renderManualJournal(){const section=document.getElementById('manual-journal');if(!section)return;const entries=[];for(const list of lists)for(const entry of list.entries)if(!entry.filmId)entries.push({list,entry});section.hidden=!entries.length;section.innerHTML=entries.length?`<div class="section-heading"><h2>Your own discoveries.</h2><a href="${base}checklist.html?view=personal">Manage your lists ↗</a></div><p>${entries.filter(({entry})=>entry.watched).length} watched of ${entries.length} personal entries. These titles were entered by you, outside the verified archive.</p><div class="personal-journal-grid">${entries.map(({list,entry})=>`<article><p class="eyebrow">${escape(list.name)}</p><h3>${escape(entry.title)}</h3><p>${entry.year || 'Year not recorded'}</p><label><input type="checkbox" data-personal-watch="${list.id}" data-entry="${entry.id}" ${entry.watched?'checked':''}> Watched</label></article>`).join('')}</div>`:'';}
  function printList(list) {
    const sheet=document.createElement('section');sheet.id='printable-checklist';
    const count=list.entries.filter(watched).length;
    sheet.innerHTML=`<p>FRAME No. 1 / PERSONAL CHECKLIST</p><h1>${escape(list.name)}</h1><p>${count} of ${list.entries.length} watched</p><ul>${list.entries.map(entry=>`<li><span class="print-box">${watched(entry)?'☑':'☐'}</span> <span>${escape(entry.title)}</span> <span>${escape(entry.year || '')}</span></li>`).join('')}</ul>${list.entries.length?'':'<p>No films added yet.</p>'}`;
    document.body.append(sheet);document.body.classList.add('printing-checklist');
    try { window.print(); } finally {document.body.classList.remove('printing-checklist');sheet.remove();}
  }
  document.addEventListener('click',event=>{
    const print=event.target.closest('[data-print-list]');if(print){const list=lists.find(l=>l.id===print.dataset.printList);if(list)printList(list);return;}

    const tab=event.target.closest('[data-checklist-type]');if(tab){view=tab.dataset.checklistType;if(search)search.value='';const url=new URL(window.location.href);url.searchParams.set('view',view);url.searchParams.delete('find');window.history.replaceState(null,'',url);render();}
    const remove=event.target.closest('[data-remove-list]');if(remove && confirm('Delete this personal checklist? The archive journal’s watched status will be kept.')){lists=lists.filter(l=>l.id!==remove.dataset.removeList);save();render();renderManualJournal();say('Personal checklist deleted.');}
    const entryButton=event.target.closest('[data-remove-entry]');if(entryButton){const list=lists.find(l=>l.id===entryButton.dataset.list),entry=list?.entries.find(e=>e.id===entryButton.dataset.removeEntry);if(entry&&confirm('Remove this entry from this list? Its archive watched status will be kept.')){list.entries=list.entries.filter(e=>e.id!==entry.id);save();render();renderManualJournal();say('Entry removed from this list.');}}
  });
  document.addEventListener('submit',event=>{
    const form=event.target;if(form.id==='new-personal-list'){event.preventDefault();if(lists.length>=20)return say('You can keep up to 20 personal lists. Export a backup before removing any.');const name=form.elements.name.value.trim();if(!name)return;lists.push({id:uid('list'),name:name.slice(0,60),entries:[]});save();render();say('Your new checklist is ready.');}
    if(form.dataset.addFilm){event.preventDefault();const list=lists.find(l=>l.id===form.dataset.addFilm);if(!list)return;if(list.entries.length>=100)return say('This list has reached its 100-film limit. Create another reel.');const title=form.elements.title.value.trim(),year=form.elements.year.value?+form.elements.year.value:'';if(!title)return;const film=films.find(f=>fold(f.title)===fold(title)&&(!year||f.year===year));if(list.entries.some(e=>film?e.filmId===film.id:!e.filmId&&fold(e.title)===fold(title)&&e.year===year))return say('That film is already in this list.');const on=form.elements.watched.checked;list.entries.push({id:uid('entry'),title:film?.title||title.slice(0,140),year:film?.year||year,filmId:film?.id||'',watched:on});save();if(film&&on)window.FRAME_JOURNAL.setWatched(film.id,true);render();renderManualJournal();say(film?'Archive film added; watched status is shared with My Frames.':'Your own film entry has been saved.');}
  });
  document.addEventListener('change',event=>{const el=event.target;if(el.dataset.autoCheck)window.FRAME_JOURNAL.setWatched(el.dataset.autoCheck,el.checked);if(el.dataset.personalWatch){const list=lists.find(l=>l.id===el.dataset.personalWatch),entry=list?.entries.find(e=>e.id===el.dataset.entry);if(!entry)return;if(entry.filmId)window.FRAME_JOURNAL.setWatched(entry.filmId,el.checked);else{entry.watched=el.checked;save();refreshProgress();if(!grid)renderManualJournal();}say('Watched status saved.');}});
  document.addEventListener('frame:journal-change',()=>{refreshProgress();renderManualJournal();});search?.addEventListener('input',render);
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){try{lists=event.newValue?validate(JSON.parse(event.newValue)):[];render();renderManualJournal();}catch{say('Another tab wrote unreadable personal-list data. Current entries were kept.');}}});
  window.FRAME_CUSTOM_LISTS={export:()=>JSON.parse(JSON.stringify(lists)),validate:raw=>{const clean=validate(raw);if(lists.length+clean.filter(l=>!lists.some(old=>old.id===l.id)).length>20)throw Error('Too many combined personal lists');return clean;},mergeValidated:incoming=>{for(const list of incoming){const index=lists.findIndex(l=>l.id===list.id);if(index<0)lists.push(list);else lists[index]=list;}save();render();renderManualJournal();},clear:()=>{lists=[];save();render();renderManualJournal();}};
  if(grid){const params=new URLSearchParams(window.location.search),requested=params.get('view');if(['curated','directors','genres','personal'].includes(requested))view=requested;if(search)search.value=params.get('find') || '';render();}
  renderManualJournal();
})();
