/* Tests real app.js in a minimal browser harness for storage-failure and import boundaries.
   Actual rendering and navigation were separately checked in the browser. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const code = fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const films = JSON.parse(fs.readFileSync(path.join(root,'data/films.json'),'utf8'));
function run({raw=null,blocked=false}={}) {
 const docEvents={}, winEvents={}, elementEvents={};
 const status={textContent:''}; const menu={addEventListener(){}};
 const importEl={addEventListener:(key,fn)=>{elementEvents[key]=fn;}};
 const button={dataset:{film:films[0].id,action:'watched'},setAttribute(k,v){this[k]=v;},classList:{contains(){return false;}}};
 let stored=raw;
 const document={body:{dataset:{base:'./'}},documentElement:{classList:{add(){}}},
  querySelector:selector=>selector==='.menu-toggle'?menu:null,
  querySelectorAll:selector=>selector==='[data-action]'?[button]:[],
  getElementById:id=>id==='status'?status:id==='import'?importEl:null,
  addEventListener:(key,fn)=>{docEvents[key]=fn;}};
 const context={document,window:{FRAME_FILMS:films,FRAME_COLLECTIONS:[],addEventListener:(key,fn)=>{winEvents[key]=fn;}},
  localStorage:{getItem(){if(blocked)throw Error('blocked'); return stored;},setItem(k,v){if(blocked)throw Error('full');stored=v;}},
  confirm:()=>true, setTimeout:()=>1, clearTimeout(){},console};
 vm.runInNewContext(code,context,{filename:'app.js'});
 return {status,docEvents,winEvents,elementEvents,button,get stored(){return stored;}};
}
(async()=>{
 let app=run({blocked:true});
 assert.match(app.status.textContent,/could not be read/);
 app.docEvents.click({target:{closest:s=>s==='[data-action]'?app.button:null}});
 assert.equal(app.button['aria-pressed'],'true');
 assert.match(app.status.textContent,/unavailable or full/);
 app=run({raw:'{broken-json'}); assert.match(app.status.textContent,/could not be read/);
 app=run();
 await app.elementEvents.change({target:{files:[{size:100,text:async()=>JSON.stringify({version:1,journal:{[films[0].id]:{watched:true,favorite:'true',rating:99,notes:'x'.repeat(2100)},unknown:{watched:true}}})}],value:'file'}});
 const saved=JSON.parse(app.stored); assert.deepEqual(Object.keys(saved),[films[0].id]);
 assert.equal(saved[films[0].id].watched,true); assert.equal(saved[films[0].id].favorite,false);
 assert.equal(saved[films[0].id].rating,0); assert.equal(saved[films[0].id].notes.length,2000);
 assert.equal(app.status.textContent,'Journal imported.');
 const before=app.stored;
 await app.elementEvents.change({target:{files:[{size:10,text:async()=>'{invalid'}],value:'file'}});
 assert.equal(app.stored,before); assert.match(app.status.textContent,/Could not import/);
 app.winEvents.storage({key:'frame-no-1:journal:v1',newValue:'bad'});
 assert.match(app.status.textContent,/unreadable journal/);
 console.log('PASS: blocked/full storage keeps working in memory; corrupt saved data warns; imports validate IDs, booleans, ratings and note lengths; malformed imports preserve data; corrupt cross-tab updates preserve entries.');
})().catch(error=>{console.error(error);process.exitCode=1;});
