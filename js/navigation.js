/* One menu definition for every page, including older cached page shells. */
(() => {
 const menu=document.getElementById('navigation');if(!menu)return;
 const base=document.body.dataset.base || './';
 const items=[['index.html','Home'],['archive.html','The Archive'],['directors.html','Directors'],['checklist.html','Checklists'],['my-frames.html','My Frames'],['editorial.html','Articles'],['news.html','Film News'],['about.html','About']];
 const page=location.pathname.split('/').pop() || 'index.html';
 menu.replaceChildren(...items.map(([file,label])=>{const a=document.createElement('a');a.href=base+file+'?v=menu3';a.textContent=label;if(file===page)a.setAttribute('aria-current','page');return a;}));
})();
