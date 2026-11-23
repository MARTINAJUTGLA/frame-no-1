/* FRAME No. 1: one validated local journal shared by every section. No network requests. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const films = window.FRAME_FILMS;
  const collections = window.FRAME_COLLECTIONS;
  const base = document.body.dataset.base || './';
  const KEY = 'frame-no-1:journal:v1';
  const validIds = new Set(films.map(f => f.id));
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const emptyEntry = () => ({watched:false, watchlist:false, favorite:false, rating:0, notes:''});
  // Ignore unknown fields and film IDs, constrain all imported values, never render notes as HTML.
  function sanitize(raw) {
    const clean = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid journal');
    for (const [id, item] of Object.entries(raw)) {
      if (!validIds.has(id) || !item || typeof item !== 'object') continue;
      clean[id] = {watched:item.watched === true, watchlist:item.watchlist === true,
        favorite:item.favorite === true, rating:Number.isInteger(item.rating) && item.rating >= 0 && item.rating <= 5 ? item.rating : 0,
        notes:typeof item.notes === 'string' ? item.notes.slice(0,2000) : ''};
    }
    return clean;
  }
  let journal = {}, storageWarning = '';
  try { const raw = localStorage.getItem(KEY); if (raw) journal = sanitize(JSON.parse(raw)); }
  catch { storageWarning = 'Saved data could not be read. Changes may only last for this page session. Export a backup before leaving.'; }
  const get = id => journal[id] || emptyEntry();
  let toastTimer;
  function announce(message, persistent = false) {
    const el = document.getElementById('status');
    clearTimeout(toastTimer); el.textContent = message;
    if (!persistent) toastTimer = setTimeout(() => {el.textContent = '';}, 4000);
  }
  function save() {
    try {localStorage.setItem(KEY, JSON.stringify(journal));}
    catch {storageWarning = 'Browser storage is unavailable or full. Export your journal before leaving this page.'; announce(storageWarning,true);}
  }
  function update(id, field, value) {
    journal[id] = {...get(id), [field]: value}; save(); sync();
  }
  function coverCard(f, withJournal = false) {
    const entry = get(f.id);
    return `<article class="film-card"><a class="poster-link" href="${base}films/${f.id}.html"><img src="${base}${f.poster}" width="${f.imageWidth || 480}" height="${f.imageHeight || 680}" loading="lazy" alt="${escapeHTML(f.imageAlt || f.title)}"><span class="poster-open">Explore film ↗</span></a><div class="card-meta"><span>${f.year} · ${escapeHTML(f.genre)}</span><button class="save-small" data-action="favorite" data-film="${f.id}" aria-label="Favourite ${escapeHTML(f.title)}" aria-pressed="${entry.favorite}">${entry.favorite?'♥':'♡'}</button></div><h3><a href="${base}films/${f.id}.html">${escapeHTML(f.title)}</a></h3><p>${escapeHTML(f.director)}</p>${withJournal ? `<p class="journal-note">${entry.rating ? '★'.repeat(entry.rating)+' · ' : ''}${entry.watched?'Watched':'Not watched'}</p>${entry.notes ? `<p class="journal-note">${escapeHTML(entry.notes)}</p>`:''}<a class="small" href="${base}films/${f.id}.html">Edit your frame ↗</a>` : ''}</article>`;
  }
  let journalView = 'watched';
  function renderJournal() {
    const grid = document.getElementById('journal-grid'); if (!grid) return;
    const matched = films.filter(f => journalView === 'rated' ? get(f.id).rating > 0 : journalView === 'notes' ? Boolean(get(f.id).notes) : get(f.id)[journalView]);
    // Keep the current focused control stable when cards are refreshed.
    const active = document.activeElement;
    const focusedId = active?.dataset?.film, focusedAction = active?.dataset?.action;
    grid.innerHTML = matched.map(f => coverCard(f,true)).join('');
    document.getElementById('journal-empty').hidden = matched.length > 0;
    document.getElementById('journal-stats').innerHTML = [['watched','Archive watched'],['watchlist','On the list'],['favorite','Favourites'],['rated','Rated']].map(([key,label]) => `<div class="stat"><strong>${films.filter(f => key === 'rated' ? get(f.id).rating > 0 : get(f.id)[key]).length}</strong><span>${label}</span></div>`).join('');
    if (focusedId && focusedAction) {
      const replacement = grid.querySelector(`[data-film="${focusedId}"][data-action="${focusedAction}"]`);
      if (replacement) replacement.focus(); else document.querySelector(`[data-view="${journalView}"]`)?.focus();
    }
  }
  function sync() {
    document.querySelectorAll('[data-action]').forEach(el => {
      const on = Boolean(get(el.dataset.film)[el.dataset.action]);
      el.setAttribute('aria-pressed', String(on));
      if (el.classList.contains('save-small')) el.textContent = on ? '♥' : '♡';
    });
    document.querySelectorAll('[data-check]').forEach(el => {el.checked = get(el.dataset.check).watched;});
    document.querySelectorAll('[data-rating]').forEach(el => {el.value = get(el.dataset.rating).rating;});
    document.querySelectorAll('[data-notes]').forEach(el => {if (document.activeElement !== el) el.value = get(el.dataset.notes).notes;});
    document.querySelectorAll('[data-progress]').forEach(el => {
      const c = collections.find(c => c.id === el.dataset.progress);
      const count = c.ids.filter(id => get(id).watched).length;
      const percent = Math.round(count / c.ids.length * 100);
      el.querySelector('label').textContent = `${count} / ${c.ids.length} watched · ${percent}%`;
      const progress = el.querySelector('progress'); progress.value = count; progress.textContent = `${percent}%`;
    });
    renderJournal();
    document.dispatchEvent?.(new Event('frame:journal-change'));
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button && validIds.has(button.dataset.film)) {
      const {film:id,action} = button.dataset; const on = !get(id)[action];
      update(id,action,on); if (!storageWarning) announce(`${films.find(f => f.id === id).title}: ${action === 'favorite' ? 'favourite' : action} ${on ? 'added' : 'removed'}.`);
    }
    const tab = event.target.closest('[data-view]');
    if (tab) {journalView = tab.dataset.view; document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed',String(b === tab))); renderJournal();}
  });
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.dataset.check) {update(el.dataset.check,'watched',el.checked); if(!storageWarning) announce('Watched status and collection progress updated.');}
    if (el.dataset.rating) {update(el.dataset.rating,'rating',Number(el.value)); if(!storageWarning) announce('Rating saved.');}
  });
  // Notes save on every input so navigating away cannot discard an unsaved timer.
  document.addEventListener('input', event => {if (event.target.dataset.notes) update(event.target.dataset.notes,'notes',event.target.value);});
  const menu = document.querySelector('.menu-toggle');
  menu.addEventListener('click', () => {const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); document.getElementById('navigation').classList.toggle('open',open);});
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {menu.click(); menu.focus();}});
  const filters = document.getElementById('filters');
  const fold = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function filterArchive() {
    if (!filters) return;
    const query = fold(document.getElementById('search').value.trim());
    const genre = document.getElementById('genre').value, decade = document.getElementById('decade').value;
    const collection = collections.find(c => c.id === document.getElementById('collection').value);
    let matched = films.filter(f => fold(`${f.title} ${f.director} ${f.country} ${f.year} ${f.genre}`).includes(query) && (!genre || genre === f.genre) && (!decade || f.year >= +decade && f.year < +decade + 10) && (!collection || collection.ids.includes(f.id)));
    const order = document.getElementById('sort').value;
    if (order === 'title') matched.sort((a,b) => a.title.localeCompare(b.title));
    if (order === 'oldest') matched.sort((a,b) => a.year-b.year);
    if (order === 'newest') matched.sort((a,b) => b.year-a.year);
    document.getElementById('archive-grid').innerHTML = matched.map(f => coverCard(f)).join('');
    document.getElementById('results-count').textContent = `${matched.length} ${matched.length === 1 ? 'film' : 'films'} in the archive`;
    document.getElementById('archive-empty').hidden = matched.length > 0;
  }
  if (filters) {filters.addEventListener('submit', e => e.preventDefault()); filters.addEventListener('input',filterArchive); filters.addEventListener('change',filterArchive); filters.addEventListener('reset',() => setTimeout(filterArchive,0));}
  if (filters) {
    const requestedCollection = new URLSearchParams(window.location.search).get('collection');
    if (collections.some(c => c.id === requestedCollection)) {document.getElementById('collection').value = requestedCollection; filterArchive();}
  }
  const directorSearch = document.getElementById('director-search');
  function filterDirectors() {
    if (!directorSearch) return;
    const query = fold(directorSearch.value.trim());
    let count = 0;
    document.querySelectorAll('.director-card').forEach(card => {
      card.hidden = !fold(card.textContent).includes(query);
      if (!card.hidden) count++;
    });
    document.getElementById('director-results').textContent = count ? `${count} director ${count === 1 ? 'profile' : 'profiles'}` : 'No directors found. Try another name.';
  }
  directorSearch?.addEventListener('input', filterDirectors);
  document.getElementById('director-filters')?.addEventListener('submit', event => event.preventDefault());
  document.getElementById('director-filters')?.addEventListener('reset', () => setTimeout(filterDirectors, 0));
  document.getElementById('export')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),journal,customLists:window.FRAME_CUSTOM_LISTS?.export() || []},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'frame-no-1-journal.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000); announce('Journal backup downloaded.');
  });
  document.getElementById('import')?.addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1000000) throw new Error('File too large');
      const data = JSON.parse(await file.text());
      if (data.version !== 1 || !data.journal || typeof data.journal !== 'object' || Array.isArray(data.journal)) throw new Error('Unsupported backup');
      const imported = sanitize(data.journal);
      const importedLists = data.customLists === undefined ? [] : window.FRAME_CUSTOM_LISTS.validate(data.customLists);
      if (!Object.keys(imported).length && !importedLists.length) throw new Error('No recognised films or lists');
      if (confirm('Merge this backup into your journal? Entries in the backup replace matching films.')) {journal = {...journal,...imported}; window.FRAME_CUSTOM_LISTS?.mergeValidated(importedLists); save(); sync(); if(!storageWarning) announce('Journal imported.');}
    } catch {announce('Could not import this file. Choose a FRAME No. 1 version 1 JSON backup.');}
    event.target.value = '';
  });
  document.getElementById('clear-journal')?.addEventListener('click', () => {
    if (confirm('Clear your archive journal and personal checklists in this browser? Export a backup first if you want to keep them.')) {journal = {}; window.FRAME_CUSTOM_LISTS?.clear(); save(); sync(); if(!storageWarning) announce('Journal cleared.');}
  });
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) {try {journal = event.newValue ? sanitize(JSON.parse(event.newValue)) : {}; sync();} catch {announce('Another tab wrote unreadable journal data. Current entries have been kept.');}}
  });
  window.FRAME_JOURNAL = {isWatched:id => Boolean(get(id).watched),setWatched:(id,on) => {if(validIds.has(id)) update(id,'watched',Boolean(on));}};
  sync(); if (storageWarning) announce(storageWarning,true);
})();
