"""Render attributed headline links from The Guardian's public Film RSS feed.
No article bodies, images, API keys or browser-to-feed requests are used.
"""
from pathlib import Path
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.request import Request, urlopen
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
import html, json, argparse
ROOT=Path(__file__).resolve().parents[1]
FEED='https://www.theguardian.com/film/rss'
def build(raw):
 tree=ET.fromstring(raw); items=[]
 for node in tree.findall('./channel/item'):
  title=node.findtext('title','').strip(); link=node.findtext('link','').strip()
  if not title or urlsplit(link).hostname not in ('www.theguardian.com','theguardian.com'): continue
  try: date=parsedate_to_datetime(node.findtext('pubDate','')).astimezone(timezone.utc)
  except (ValueError, TypeError):continue
  items.append({'title':title,'url':link,'published':date.isoformat(),'date':date.strftime('%d %b %Y')})
 if not items:raise ValueError('Feed contains no valid articles; retaining previous page.')
 items=sorted(items,key=lambda i:i['published'],reverse=True)[:12]
 stamp=datetime.now(timezone.utc).strftime('%d %b %Y, %H:%M UTC')
 template=(ROOT/'editorial.html').read_text()
 head=template[:template.index('<main id="main">')]
 import re
 head=re.sub(r'<title>.*?</title>','<title>Film News — FRAME No. 1</title>',head)
 head=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="Recent film headlines from The Guardian, with dates and links to the original reporting.">',head)
 head=re.sub(r'<script.*?</script>','',head)
 head=head.replace('</head>','<script defer src="./js/navigation.js?v=menu3"></script></head>')
 head=re.sub(r'<meta property="og:[^"]*"[^>]*>','',head)
 head=re.sub(r'<a href="./news.html"[^>]*>Film News</a>','',head)
 head=head.replace('aria-current="page"','').replace('class="section-preview preview-editorial"','class="section-preview news-page"')
 head=head.replace('</nav>','<a href="./news.html" aria-current="page">Film News</a></nav>')
 cards=''.join(f'<article class="news-item"><p class="eyebrow">THE GUARDIAN / <time datetime="{i["published"]}">{i["date"]}</time></p><h2><a href="{html.escape(i["url"],quote=True)}">{html.escape(i["title"])}</a></h2><a class="news-read" href="{html.escape(i["url"],quote=True)}">Read at The Guardian ↗</a></article>' for i in items)
 body=f'''<main id="main"><section class="page-intro"><p class="eyebrow">FILM INDUSTRY / REPORTING &amp; REVIEWS</p><h1>Film N<em class="accent-letter">e</em>ws.</h1><p class="lede">Recent film headlines from The Guardian. Open a headline to read the original article.</p></section><div class="news-source"><p>Source: <a href="https://www.theguardian.com/film">The Guardian · Film</a><br>Feed checked: {stamp}</p><p>Latest saved headlines, not a live feed.<br>Articles may require registration or a subscription.</p></div><section class="news-grid" aria-label="Recent film headlines">{cards}</section><p class="small">Headlines supplied by <a href="{FEED}">The Guardian Film RSS feed</a>. Reporting remains with the original publisher. FRAME No. 1 is not affiliated with The Guardian.</p></main><footer><a class="wordmark" href="./index.html">FRAME No. 1</a><a href="./sources.html">Sources &amp; credits</a></footer></body></html>'''
 from scene_details import decorate
 (ROOT/'news.html').write_text(decorate(head+body,'news'))
 (ROOT/'data/news.json').write_text(json.dumps({'source':FEED,'checked':stamp,'items':items},ensure_ascii=False,indent=2)+'\n')
 return len(items)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--feed-file',type=Path);args=parser.parse_args()
 raw=args.feed_file.read_bytes() if args.feed_file else urlopen(Request(FEED,headers={'User-Agent':'FRAME-No-1 educational film news reader'}),timeout=25).read(2_000_000)
 print(f'Updated {build(raw)} headline links.')
