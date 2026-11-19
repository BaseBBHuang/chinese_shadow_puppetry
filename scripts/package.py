"""Validate references and build an allowlisted offline minitool ZIP."""
import re, zipfile, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'app'
OUT=ROOT/'dist'
ALLOWED={'.html','.js','.css','.webp','.png','.jpg','.jpeg','.svg','.woff','.woff2','.json','.gif'}
files=sorted(p for p in APP.rglob('*') if p.is_file())
assert (APP/'index.html').is_file()
assert len(list(APP.rglob('*.html')))==1
for p in files:
    assert p.suffix in ALLOWED, 'Unsupported package file: '+str(p)
    if p.suffix in {'.html','.js','.css'}:
        text=p.read_text()
        for pattern in [r'\beval\s*\(',r'new\s+Function\s*\(',r'\bfetch\s*\(',r'\bXMLHttpRequest\b',r'type=[\"\x27]module',r'\bon\w+\s*=',r'<iframe\b',r'<object\b',r'\bnew Worker\(',r'navigator\.clipboard',r'sk-[A-Za-z0-9]{15}']:
            # Event property assignments are allowed JS; inline event handlers are not.
            if pattern==r'\bon\w+\s*=' and p.suffix!='.html':continue
            assert not re.search(pattern,text), (p.name,pattern)
        if p.suffix=='.html':
            assert not re.search(r'<script(?![^>]*\bsrc=)[^>]*>\s*\S',text)
            refs=re.findall(r'(?:src|href|xlink:href)=[\"\x27](\./[^\"\x27]+)',text)
        elif p.suffix=='.css':refs=re.findall(r'url\([\"\x27]?(\./[^\"\x27)]+)',text)
        else:refs=[]
        for ref in refs:assert (p.parent/ref).is_file(),str(p)+': '+ref
OUT.mkdir(exist_ok=True)
archive=OUT/'zhangzhongyingxi-level01-v0.2.0.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,p.relative_to(APP))
assert archive.stat().st_size<10*1024*1024
with zipfile.ZipFile(archive) as z:
    assert 'index.html' in z.namelist()
    assert z.testzip() is None
manifest={'package':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':[{ 'path':str(p.relative_to(APP)),'bytes':p.stat().st_size} for p in files]}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
