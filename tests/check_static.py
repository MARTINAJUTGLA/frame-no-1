"""Dependency-free checks: run python3 tests/check_static.py from project root."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__(); self.h1=0; self.ids=set(); self.refs=[]; self.title=False; self.description=False; self.lang=False; self.images=[]; self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1': self.h1+=1
  if tag=='html': self.lang=a.get('lang')=='en'
  if tag=='title': self.title=True
  if tag=='meta' and a.get('name')=='description': self.description=bool(a.get('content'))
  if 'id' in a: self.ids.add(a['id'])
  if tag in ('a','link','script','img'):
   key='href' if tag in ('a','link') else 'src'
   if key in a: self.refs.append(a[key])
  if tag=='img': self.images.append(a)
pages={p:Page(p.read_text()) for p in ROOT.rglob('*.html')}
errors=[]; refs=0
for p,page in pages.items():
 if page.h1!=1: errors.append(f'{p.name}: expected one H1')
 if not page.title or not page.lang: errors.append(f'{p.name}: title/lang missing')
 if p.name!='404.html' and not page.description: errors.append(f'{p.name}: no description')
 for image in page.images:
  if not all(k in image for k in ('alt','width','height')): errors.append(f'{p.name}: missing image attributes')
 for ref in page.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc: continue
  refs+=1
  if u.path.startswith('/'): errors.append(f'{p.name}: absolute path {ref}')
  target=(p.parent/unquote(u.path)).resolve() if u.path else p
  if target.is_dir(): target=target/'index.html'
  if not target.exists(): errors.append(f'{p.name}: missing {ref}')
  elif u.fragment and target in pages and u.fragment not in pages[target].ids: errors.append(f'{p.name}: bad fragment {ref}')
films=json.loads((ROOT/'data/films.json').read_text())
assert len(films)==129 and len({f['id'] for f in films})==129
for f in films:
 assert (ROOT/'films'/f"{f['id']}.html").exists()
 assert (ROOT/'directors'/f"{f['directorId']}.html").exists()
 assert (ROOT/f['poster']).exists()
titles=[re.search(r'<title>(.*?)</title>',p.read_text()).group(1) for p in pages]
assert len(set(titles))==len(titles),'Duplicate titles'
assert not errors,'\n'.join(errors)
print(f'PASS: {len(pages)} HTML pages; {refs} local references; 129 film records; unique titles; H1s; metadata; image dimensions and alt text.')
