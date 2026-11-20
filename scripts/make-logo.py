"""Build Tenthlook logo SVGs: Newsreader Regular outlines + a real circle dot."""
# Usage: python scripts/make-logo.py <outdir>, run from a directory containing font/Newsreader.ttf
# (Newsreader[opsz,wght].ttf from github.com/google/fonts/tree/main/ofl/newsreader). Needs fonttools, uharfbuzz.
# Coordinates were then rounded to 0.1 units for file size.
import sys, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

SRC="font/Newsreader.ttf"; OUT=sys.argv[1]
TRACK=-0.015   # em; "slightly tightened"
DOT=1.12       # dot radius relative to Newsreader's period (enlarged 12%, 2026-11-17)

def instance(opsz):
    f=TTFont(SRC); return instantiateVariableFont(f,{"wght":400,"opsz":opsz})

def shape(text,opsz):
    blob=hb.Blob.from_file_path(SRC); face=hb.Face(blob); font=hb.Font(face)
    font.set_variations({"wght":400,"opsz":opsz})
    buf=hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font,buf,{"kern":True,"liga":False})
    return [(i.codepoint,p.x_advance,p.x_offset,p.y_offset) for i,p in zip(buf.glyph_infos,buf.glyph_positions)]

def build(text,opsz,dot_scale=1.0):
    tt=instance(opsz); gs=tt.getGlyphSet(); order=tt.getGlyphOrder(); upm=tt["head"].unitsPerEm
    pen=SVGPathPen(gs); x=0; track=TRACK*upm
    glyphs=shape(text,opsz)
    for n,(gid,adv,xo,yo) in enumerate(glyphs):
        # flip y: font units are y-up
        gs[order[gid]].draw(TransformPen(pen,(1,0,0,-1,x+xo,-yo)))
        x+=adv+(track if n<len(glyphs)-1 else 0)
    # size and place the dot like the font's own period after the last letter
    pg=gs[tt.getBestCmap()[ord('.')]]; bp=BoundsPen(gs); pg.draw(bp)
    xmin,ymin,xmax,ymax=bp.bounds
    r=(xmax-xmin)/2*dot_scale; cx=x+track+(xmin+xmax)/2+(r-(xmax-xmin)/2); cy=-(ymin+(ymax-ymin)/2)+(r-(ymax-ymin)/2)
    # text bounds
    bb=BoundsPen(gs); x2=0
    for n,(gid,adv,xo,yo) in enumerate(glyphs):
        gs[order[gid]].draw(TransformPen(bb,(1,0,0,1,x2+xo,yo))); x2+=adv+track
    txmin,tymin,txmax,tymax=bb.bounds
    return dict(path=pen.getCommands(),cx=cx,cy=cy,r=r,xmin=min(txmin,0),xmax=cx+r,top=-tymax,bottom=max(-tymin,cy+r),upm=upm)

def wordmark(fg,dot,title,path):
    d=build("tenthlook",72,DOT); pad=40
    x0=d["xmin"]-pad; y0=d["top"]-pad; w=d["xmax"]-d["xmin"]+2*pad; h=d["bottom"]-d["top"]+2*pad
    svg=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {w:.0f} {h:.0f}" role="img" aria-label="{title}">'
         f'<title>{title}</title><path fill="{fg}" d="{d["path"]}"/>'
         f'<circle fill="{dot}" cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="{d["r"]:.1f}"/></svg>\n')
    open(path,"w").write(svg); print(path,round(w),round(h),"dot r",round(d["r"]))

def icon(path,dot_scale=1.0,bg="#100e16",fg="#FAFAF7",dot="#9b8cff",radius=0.22):
    d=build("t",72,DOT*dot_scale)
    gw=d["xmax"]-d["xmin"]; gh=d["bottom"]-d["top"]
    size=max(gw,gh)/0.62     # glyph group fills ~62% of the tile
    cx=(d["xmin"]+d["xmax"])/2; cy=(d["top"]+d["bottom"])/2
    x0=cx-size/2; y0=cy-size/2; rr=size*radius
    svg=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.0f} {y0:.0f} {size:.0f} {size:.0f}" role="img" aria-label="Tenthlook">'
         f'<title>Tenthlook</title><rect x="{x0:.0f}" y="{y0:.0f}" width="{size:.0f}" height="{size:.0f}" rx="{rr:.0f}" fill="{bg}"/>'
         f'<path fill="{fg}" d="{d["path"]}"/><circle fill="{dot}" cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="{d["r"]:.1f}"/></svg>\n')
    open(path,"w").write(svg); print(path,"dot r",round(d["r"]))

wordmark("#FAFAF7","#9b8cff","Tenthlook",f"{OUT}/tenthlook-dark.svg")
wordmark("#1A1A1A","#4169e1","Tenthlook",f"{OUT}/tenthlook-light.svg")
icon(f"{OUT}/icon.svg")
icon(f"{OUT}/icon-small.svg",dot_scale=1.45)          # 16/32px only
icon(f"{OUT}/icon-touch.svg",radius=0)                 # full-bleed for apple-touch-icon (iOS rounds it)
