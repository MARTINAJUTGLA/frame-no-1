"""Check imported images and CSS asset paths without external dependencies beyond Pillow."""
from pathlib import Path
import json,re
from PIL import Image
R=Path(__file__).resolve().parents[1]
films=json.loads((R/'data/films.json').read_text());credits=json.loads((R/'data/media-credits.json').read_text());people=json.loads((R/'data/directors.json').read_text());byfile={m['local']:m for m in credits}
assert len(films)==129 and len(people)==75
for film in films:
 assert film['poster'] in byfile,film['title']+' has no sourced poster'
for record in credits:
 p=R/record['local'];assert p.exists(),str(p)
 with Image.open(p) as im:
  im.verify()
 with Image.open(p) as im:assert im.size==(record['width'],record['height']),record['name']
 assert record.get('filePage') and record.get('license'),record['name']+' missing source/rights'
for person in people:
 assert any(m['kind']=='director' and m['id']==person['id'] for m in credits),person['name']+' has no photograph'
css_refs=0
for file in (R/'css').glob('*.css'):
 for match in re.findall(r"""url\(\s*(?:"([^"]*)"|'([^']*)'|([^\)\s]+))\s*\)""",file.read_text()):
  ref=next(v for v in match if v)
  if ref.startswith(('data:','http:','https:')):continue
  assert (file.parent/ref).resolve().exists(),str(file)+': '+ref
  css_refs+=1
print(f'PASS: {len(films)} sourced posters; {len(people)} photographed director profiles; {len(credits)} image records decode with matching dimensions and credits; {css_refs} CSS asset references.')
