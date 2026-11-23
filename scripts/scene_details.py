"""Small attributed film-image accents shared by the section pages."""
import re
SCENES={
 'archive':('the-shining','The Shining','1980','The Grady twins in the Overlook Hotel corridor','ACMI'),
 'directors':('pulp-fiction','Pulp Fiction','1994','Vincent and Mia dancing at Jack Rabbit Slim’s','Park Circus'),
 'my-frames':('forrest-gump','Forrest Gump','1994','Forrest sitting on a park bench with a box of chocolates','Park Circus'),
 'checklist':('the-shining','The Shining','1980','The Grady twins in the Overlook Hotel corridor','ACMI'),
 'news':('the-godfather','The Godfather','1972','Vito Corleone listening to a visitor in his office','Park Circus'),
def decorate(text,name):
 name=name.removeprefix('preview-')
 if name not in SCENES or 'class="scene-aside"' in text:return text
 image,title,year,alt,credit=SCENES[name]
 figure=f'<figure class="scene-aside"><a href="./films/{image}.html" aria-label="Explore {title}"><img src="./assets/home-stills/{image}.webp" width="400" height="230" alt="{alt}" loading="lazy"></a><figcaption>{title} · {year}<br><a href="./image-credits.html">Image: {credit}</a></figcaption></figure>'
 text=re.sub(r'(<section class="page-intro[^\"]*)"',r'\1 with-scene"',text,count=1)
 text=re.sub(r'(<section class="page-intro.*?)(</section>)',lambda m:m[1]+figure+m[2],text,count=1,flags=re.S)
 if 'css/scene-details.css' not in text:text=text.replace('</head>','<link rel="stylesheet" href="./css/scene-details.css"></head>')
 return text
