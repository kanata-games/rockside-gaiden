#!/usr/bin/env python3
"""Procedural pixel art for the mansion (placeholder-quality art meant to be swapped by an artist later).

  python3 tools/make_art.py   -> assets/{tiles,bg,props,enemies,boss,items,title_bg}.png + matching .json rect maps
Every sprite is a named rect in an atlas; the game only uses names, so any atlas can be redrawn/replaced
as long as the .json keeps the same names (sizes may change; anchors are bottom-centre unless noted).
"""
import json, math, os, random
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
random.seed(7)

def hexc(h, a=255):
    if not isinstance(h, str): h = tuple(int(v) for v in h); return h if len(h) == 4 else h + (a,)
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

class Spr:
    def __init__(s, w, h): s.w, s.h = w, h; s.a = np.zeros((h, w, 4), np.uint8)
    def px(s, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < s.w and 0 <= y < s.h:
            c = hexc(c) if isinstance(c, str) else c
            if len(c) == 4 and c[3] < 255 and s.a[y, x, 3] > 0:
                al = c[3] / 255; s.a[y, x, :3] = (np.array(c[:3]) * al + s.a[y, x, :3] * (1 - al)).astype(np.uint8)
            else: s.a[y, x] = c
    def get(s, x, y): return s.a[y, x] if 0 <= x < s.w and 0 <= y < s.h else None
    def rect(s, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.px(xx, yy, c)
    def hline(s, x0, x1, y, c):
        for x in range(int(x0), int(x1) + 1): s.px(x, y, c)
    def vline(s, x, y0, y1, c):
        for y in range(int(y0), int(y1) + 1): s.px(x, y, c)
    def ellipse(s, cx, cy, rx, ry, c):
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((x + .5 - cx) / max(rx, .1)) ** 2 + ((y + .5 - cy) / max(ry, .1)) ** 2 <= 1: s.px(x, y, c)
    def line(s, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(n, 1); s.px(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), c)
    def outline(s, c, diag=False):
        al = s.a[..., 3] > 0; o = np.zeros_like(al)
        o[1:] |= al[:-1]; o[:-1] |= al[1:]; o[:, 1:] |= al[:, :-1]; o[:, :-1] |= al[:, 1:]
        if diag:
            o[1:, 1:] |= al[:-1, :-1]; o[:-1, :-1] |= al[1:, 1:]; o[1:, :-1] |= al[:-1, 1:]; o[:-1, 1:] |= al[1:, :-1]
        o &= ~al; s.a[o] = hexc(c)
    def blit(s, o, x, y, flip=False):
        src = o.a[:, ::-1] if flip else o.a
        for yy in range(o.h):
            for xx in range(o.w):
                c = src[yy, xx]
                if c[3]: s.px(x + xx, y + yy, tuple(int(v) for v in c))
    def shade_mask(s, fn):  # recolor existing pixels by fn(x,y,rgba)->rgba|None
        for y in range(s.h):
            for x in range(s.w):
                if s.a[y, x, 3]:
                    r = fn(x, y, s.a[y, x]);
                    if r is not None: s.a[y, x] = hexc(r) if isinstance(r, str) else r
    def img(s): return Image.fromarray(s.a, 'RGBA')

class Atlas:
    def __init__(s, name, width=512): s.name, s.width, s.items = name, width, []
    def add(s, key, spr, **meta): s.items.append((key, spr, meta)); return spr
    def save(s):
        x = y = rowh = 0; rects = {}; pad = 1
        for key, spr, meta in s.items:
            if x + spr.w > s.width: x = 0; y += rowh + pad; rowh = 0
            rects[key] = dict(x=x, y=y, w=spr.w, h=spr.h, **meta); x += spr.w + pad; rowh = max(rowh, spr.h)
        H = y + rowh
        im = Image.new('RGBA', (s.width, H), (0, 0, 0, 0))
        for key, spr, meta in s.items: r = rects[key]; im.alpha_composite(spr.img(), (r['x'], r['y']))
        im.save(os.path.join(A, s.name + '.png')); json.dump(rects, open(os.path.join(A, s.name + '.json'), 'w'), separators=(',', ':'))
        print(s.name, im.size, len(rects))

def lerp(c1, c2, t):
    a, b = hexc(c1), hexc(c2); return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))
def dith(x, y, t):  # ordered 4x4 dither threshold
    M = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]; return t * 16 > M[y & 3][x & 3] + .5

# =====================================================================
#  TILES 16x16
# =====================================================================
T = Atlas('tiles', 256)
def brick(variant, top=False, crack=False, theme='stone'):
    s = Spr(16, 16)
    base, hi, lo, mort = {'stone': ('#3f3757', '#564c74', '#2e2842', '#1d1829'),
                         'cellar': ('#3c3a40', '#55525a', '#2a282e', '#18171b'),
                         'laundry': ('#3a5058', '#557078', '#28383e', '#161f24'),
                         'garden': ('#3c4a3a', '#566a52', '#2a3428', '#161c15'),
                         'wood': ('#4a3426', '#6a4c36', '#33231a', '#1c130d'),
                         'crypt': ('#3a3e3a', '#565c54', '#282c28', '#121412'),
                         'bath': ('#7a98a0', '#b8d4da', '#56747c', '#26363c'),
                         'wine': ('#4a2a2e', '#6a3e42', '#321c20', '#1a0c10'),       # v0.5 vintage vaults
                         'armory': ('#4a5060', '#6a7488', '#323844', '#16181e'),
                         'servants': ('#5a5048', '#7a6e62', '#3e3630', '#1e1a16'),   # v0.5.1 servants' quarters
                         'lake': ('#2a3e40', '#3e5a5c', '#1a2a2c', '#0a1214'),
                         'slate': ('#3a4252', '#56627a', '#262c38', '#10141c'),   # v0.6 rooftop spires
                         'paint': ('#e8e0d0', '#fff8ec', '#c8bca8', '#8a7e6a'),   # v0.6 painted world (canvas)
                         'toys': ('#c8a070', '#e8c898', '#a07a4a', '#4a3420')}[theme]   # v0.6 toy nursery   # v0.5.1 underground lake   # v0.5 hall of knights
    s.rect(0, 0, 16, 16, mort)
    rows = [(0, 7), (8, 15)]
    for ri, (y0, y1) in enumerate(rows):
        off = (4 if (ri + variant) % 2 else 12)
        for bx in range(-16, 32, 16):
            x0 = bx + off - 8; x1 = x0 + 14
            for yy in range(y0, y1):
                for xx in range(max(0, x0), min(16, x1 + 1)):
                    c = base
                    if yy == y0: c = hi
                    elif yy == y1 - 1 or xx == x1: c = lo
                    elif random.random() < .08: c = lo
                    elif random.random() < .05: c = hi
                    s.px(xx, yy, c)
    if crack:
        pts = [(9, 2), (8, 4), (9, 6), (7, 9), (8, 11), (6, 13)]
        for (a, b), (c, d) in zip(pts, pts[1:]): s.line(a, b, c, d, '#151220')
    if theme == 'wood' and not top:  # planks instead of bricks
        s.rect(0, 0, 16, 16, mort)
        for k, x0 in enumerate((0, 8)):
            s.rect(x0, 0, 7, 16, base if (k + variant) % 2 else lo); s.vline(x0, 0, 15, hi)
            for yy in range(2, 16, 5): s.px(x0 + 3 + (yy + variant) % 3, yy, mort)
        s.hline(0, 15, (6 + variant * 5) % 16, mort)
    if top:
        if theme == 'garden':  # grass + moss over stone
            s.rect(0, 0, 16, 5, '#2e5a2a'); s.hline(0, 15, 0, '#6ab04a'); s.hline(0, 15, 1, '#4a8a3a')
            for xx in range(0, 16, 2): s.vline(xx, -1 + (xx * 7 + variant) % 3, 1, '#7ac85a')
            s.hline(0, 15, 5, '#1a2416'); s.hline(0, 15, 6, '#24301f')
        elif theme == 'laundry':  # tiled floor, wet shine
            s.rect(0, 0, 16, 5, '#7a9aa4'); s.hline(0, 15, 0, '#c8e4ec'); s.vline(7 + variant, 0, 4, '#4a6670'); s.hline(0, 15, 4, '#4a6670')
            s.px(3, 1, '#ffffff'); s.px(12, 2, '#e8f8ff'); s.hline(0, 15, 5, '#141c20')
        elif theme == 'crypt':  # worn flagstones with bone chips
            s.rect(0, 0, 16, 5, '#6a6e62'); s.hline(0, 15, 0, '#a8aa98'); s.hline(0, 15, 1, '#868a7a'); s.vline((5 + variant * 6) % 16, 0, 4, '#3a3e36')
            s.px((3 + variant * 5) % 16, 2, '#e8e4d0'); s.px((4 + variant * 5) % 16, 2, '#d8d4c0'); s.hline(0, 15, 5, '#121412'); s.hline(0, 15, 6, '#1e221e')
        elif theme == 'bath':  # white glazed tiles, aqua grout, water shine
            s.rect(0, 0, 16, 5, '#e8f4f4'); s.hline(0, 15, 0, '#ffffff'); s.vline(7 + variant, 0, 4, '#6ab8c0'); s.hline(0, 15, 4, '#6ab8c0')
            s.px(3, 1, '#c8f0ff'); s.px(12, 2, '#ffffff'); s.hline(0, 15, 5, '#1a2a30'); s.hline(0, 15, 6, '#26363c')
        elif theme == 'wine':  # dark red flagstones, a spill of wine
            s.rect(0, 0, 16, 5, '#5a3a34'); s.hline(0, 15, 0, '#9a6a5a'); s.hline(0, 15, 1, '#7a4e44'); s.vline((6 + variant * 5) % 16, 0, 4, '#2a1612')
            s.px((3 + variant * 7) % 16, 2, '#9a2a4a'); s.px((4 + variant * 7) % 16, 2, '#7a1a3a'); s.hline(0, 15, 5, '#1a0c10'); s.hline(0, 15, 6, '#2a161a')
        elif theme == 'armory':  # polished steel-grey slabs with rivets
            s.rect(0, 0, 16, 5, '#7a8294'); s.hline(0, 15, 0, '#c8d0e0'); s.hline(0, 15, 1, '#9aa2b4'); s.vline(7 + variant * 4, 0, 4, '#3a404c')
            s.px(2, 3, '#e8ecf4'); s.px(13, 3, '#e8ecf4'); s.hline(0, 15, 5, '#16181e'); s.hline(0, 15, 6, '#22262e')
        elif theme == 'servants':  # scrubbed pale floorboards
            s.rect(0, 0, 16, 5, '#a88a64'); s.hline(0, 15, 0, '#e0c89a'); s.hline(0, 15, 1, '#c0a478'); s.vline((5 + variant * 8) % 16, 0, 4, '#6a5238')
            s.hline(0, 15, 5, '#1e1a16'); s.hline(0, 15, 6, '#2e2620')
        elif theme == 'lake':  # wet rock with glowing moss
            s.rect(0, 0, 16, 5, '#3a5052'); s.hline(0, 15, 0, '#7affc0'); s.hline(0, 15, 1, '#3ac890'); s.px((4 + variant * 7) % 16, 2, '#7affc0'); s.px((11 + variant * 3) % 16, 3, '#6a8a8a')
            s.hline(0, 15, 5, '#0a1214'); s.hline(0, 15, 6, '#142022')
        elif theme == 'slate':  # moonlit slate roof edge
            s.rect(0, 0, 16, 5, '#4a5468'); s.hline(0, 15, 0, '#b8c8e8'); s.hline(0, 15, 1, '#7a88a8'); s.vline((3 + variant * 8) % 16, 0, 4, '#1a1e28')
            s.hline(0, 15, 5, '#10141c'); s.hline(0, 15, 6, '#1a1e28')
        elif theme == 'paint':  # a thick painted stripe on canvas
            s.rect(0, 0, 16, 5, ('#e84a4a', '#3a8ae8')[variant % 2]); s.hline(0, 15, 0, '#ffffff'); s.px((5 + variant * 6) % 16, 2, '#f0c030'); s.hline(0, 15, 5, '#8a7e6a')
        elif theme == 'toys':  # nursery floorboards with a painted edge
            s.rect(0, 0, 16, 5, '#e8c898'); s.hline(0, 15, 0, '#fff0d0'); s.hline(0, 15, 1, '#e84a4a' if variant % 2 else '#3a8ae8'); s.vline((6 + variant * 7) % 16, 2, 4, '#a07a4a')
            s.hline(0, 15, 5, '#4a3420')
        elif theme == 'wood':
            s.rect(0, 0, 16, 5, '#7a5238'); s.hline(0, 15, 0, '#c99a66'); s.hline(0, 15, 1, '#9a6a48'); s.px((5 + variant * 7) % 16, 2, '#4a2e1e')
            s.hline(0, 15, 5, '#1c130d'); s.hline(0, 15, 6, '#2a1c14')
        else:
            s.rect(0, 0, 16, 5, '#6e4a36'); s.hline(0, 15, 0, '#b88758'); s.hline(0, 15, 1, '#8c6044')
            for xx in range(0, 16, 6): s.vline((xx + variant * 3) % 16, 1, 4, '#4f3326')
            s.hline(0, 15, 5, '#1a1420'); s.hline(0, 15, 6, '#2a2236')
    return s
T.add('brick0', brick(0)); T.add('brick1', brick(1)); T.add('top0', brick(0, True)); T.add('top1', brick(1, True))
T.add('secret', brick(0, crack=True))
T.add('csecret', brick(0, crack=True, theme='cellar'))
for pre, th in (('t', 'laundry'), ('g', 'garden'), ('w', 'wood'), ('k', 'crypt'), ('b', 'bath'), ('r', 'wine'), ('a', 'armory'), ('v', 'servants'), ('l', 'lake'), ('x', 'slate'), ('p', 'paint'), ('o', 'toys')):
    T.add(pre + 'brick0', brick(0, theme=th)); T.add(pre + 'brick1', brick(1, theme=th)); T.add(pre + 'top0', brick(0, True, theme=th)); T.add(pre + 'top1', brick(1, True, theme=th))
    T.add(pre + 'secret', brick(0, crack=True, theme=th))
s = Spr(16, 16)  # iron bars (vertical gate)
s.rect(0, 0, 16, 16, (10, 8, 18, 200))
for x in (2, 7, 12): s.rect(x, 0, 3, 16, '#5a5a6a'); s.vline(x, 0, 15, '#9a9aae'); s.vline(x + 2, 0, 15, '#2a2a36')
s.rect(0, 6, 16, 2, '#4a4a58'); s.hline(0, 15, 6, '#8a8a9e')
T.add('bars', s)
s = Spr(16, 16)  # iron grate (floor / ceiling gate)
s.rect(0, 0, 16, 16, (10, 8, 18, 220))
for y in (1, 6, 11): s.rect(0, y, 16, 3, '#5a5a6a'); s.hline(0, 15, y, '#9a9aae'); s.hline(0, 15, y + 2, '#2a2a36')
for x in (3, 11): s.vline(x, 0, 15, '#3a3a48')
T.add('grate', s)
T.add('cbrick0', brick(0, theme='cellar')); T.add('cbrick1', brick(1, theme='cellar')); T.add('ctop0', brick(0, True, theme='cellar')); T.add('ctop1', brick(1, True, theme='cellar'))
def plat(kind):
    s = Spr(16, 16)
    s.rect(0, 0, 16, 4, '#7a5238'); s.hline(0, 15, 0, '#c99a66'); s.hline(0, 15, 3, '#3e271c'); s.hline(0, 15, 4, '#2a1a14')
    for x in (3, 11): # balusters
        s.rect(x, 5, 2, 8, '#5e3e2c'); s.px(x, 5, '#8a6044'); s.rect(x - 1, 8, 4, 2, '#6e4a36'); s.px(x - 1, 8, '#a37552')
    s.rect(0, 13, 16, 2, '#5e3e2c'); s.hline(0, 15, 13, '#8a6044')
    if kind == 'l': s.rect(0, 0, 1, 15, '#3e271c')
    if kind == 'r': s.rect(15, 0, 1, 15, '#3e271c')
    return s
T.add('platL', plat('l')); T.add('platM', plat('m')); T.add('platR', plat('r'))
s = Spr(16, 16)  # bookshelf platform
s.rect(0, 0, 16, 4, '#5a3a2a'); s.hline(0, 15, 0, '#9a6a48'); s.hline(0, 15, 4, '#24160f')
T.add('shelf', s)
T.save()

# =====================================================================
#  BACKGROUND parts per theme: wallpaper 32x32, wainscot 32x24, pillar 16x32, molding 32x8
# =====================================================================
B = Atlas('bg', 512)
THEMES = {
    'foyer':   dict(w1='#3a1828', w2='#4c2234', w3='#5e2c3e', pat='damask'),
    'gallery': dict(w1='#18262c', w2='#203440', w3='#2b4452', pat='stripe'),
    'library': dict(w1='#2a1c16', w2='#3a281e', w3='#4a3426', pat='panel'),
    'dining':  dict(w1='#24183a', w2='#30214c', w3='#3e2c60', pat='damask'),
    'cellar':  dict(w1='#1c1a20', w2='#26232c', w3='#302c36', pat='stone'),
    'vault':   dict(w1='#2a2210', w2='#3a3016', w3='#54461e', pat='diamond'),
    'ballroom':dict(w1='#141a34', w2='#1c2446', w3='#2a3460', pat='diamond'),
    'laundry': dict(w1='#1e3238', w2='#2a444c', w3='#3e5e68', pat='tile'),
    'kitchen': dict(w1='#2a2226', w2='#3a3036', w3='#4e4248', pat='checker'),
    'boiler':  dict(w1='#2a1c16', w2='#3a281e', w3='#5a3a26', pat='rivet'),
    'garden':  dict(w1='#0e2228', w2='#16343a', w3='#2a5458', pat='glass'),
    'courtyard': dict(w1='#142016', w2='#1e3020', w3='#2c4630', pat='hedge'),
    'thorn':   dict(w1='#160e18', w2='#24142a', w3='#3a1e3a', pat='bramble'),
    'shed':    dict(w1='#2a1e14', w2='#3a2a1c', w3='#4e3a26', pat='plank'),
    'attic':   dict(w1='#22180f', w2='#302216', w3='#44321f', pat='plank'),
    'gears':   dict(w1='#1a1814', w2='#28241c', w3='#4a3e28', pat='rivet'),
    'tower':   dict(w1='#1c1a2a', w2='#282438', w3='#3e3654', pat='stone'),
    'chapel':  dict(w1='#1a1428', w2='#261e3a', w3='#3c2e58', pat='gothic'),
    'crypt':   dict(w1='#141614', w2='#20241e', w3='#3a3e34', pat='niche'),
    'bath':    dict(w1='#1e4a52', w2='#2a6470', w3='#4a9aa4', pat='mosaic'),
    'cistern': dict(w1='#10202a', w2='#18303c', w3='#2a4a5a', pat='wetstone'),
    'theater': dict(w1='#2a0a14', w2='#3e1220', w3='#5e1e30', pat='damask'),     # v0.4 marionette theater
    'stage':   dict(w1='#1a0a10', w2='#2a121a', w3='#4a1e2a', pat='velvet'),
    'stars':   dict(w1='#080c1e', w2='#10183a', w3='#2a3a6a', pat='starfield'),  # v0.4 observatory
    'observatory': dict(w1='#141a2e', w2='#1c2440', w3='#2e3a62', pat='panel'),
    'heart':   dict(w1='#120e22', w2='#1c1632', w3='#3a2e5e', pat='gothic'),   # v0.4 clock heart (Chronoa)
    'vintage': dict(w1='#1e1012', w2='#2c181a', w3='#4a2a2a', pat='stone'),     # v0.5 old vintage vaults
    'casks':   dict(w1='#24140e', w2='#341e14', w3='#5a3420', pat='plank'),
    'armory':  dict(w1='#161a24', w2='#202634', w3='#384258', pat='rivet'),     # v0.5 hall of knights
    'knights': dict(w1='#1a1020', w2='#2a1830', w3='#5a1e2a', pat='gothic'),
    'servants': dict(w1='#2a2218', w2='#3a3020', w3='#5a4a34', pat='stripe'),   # v0.5.1 servants' quarters
    'linen':   dict(w1='#2e2a26', w2='#3e3832', w3='#5e564a', pat='plank'),
    'bellroom': dict(w1='#24160e', w2='#382214', w3='#5a3a1e', pat='damask'),
    'lake':    dict(w1='#08161a', w2='#10262c', w3='#1e4a50', pat='wetstone'),   # v0.5.1 underground lake
    'grotto':  dict(w1='#061210', w2='#0c201c', w3='#3ac890', pat='starfield'),
    'roof':    dict(w1='#060a1a', w2='#0e1630', w3='#c8d8ff', pat='starfield'),   # v0.6 rooftop spires (night sky)
    'spire':   dict(w1='#141824', w2='#1e2434', w3='#3a4460', pat='rivet'),
    'canvas':  dict(w1='#e8dcc4', w2='#d8c8a8', w3='#c84a6a', pat='damask'),     # v0.6 painted world
    'oils':    dict(w1='#1a3a6a', w2='#2a5a9a', w3='#f0c030', pat='stripe'),
    'nursery': dict(w1='#f0d8d8', w2='#e0c0c8', w3='#8ab0e8', pat='stripe'),    # v0.6 toy nursery
    'toybox':  dict(w1='#2a2440', w2='#3a3460', w3='#ffd84a', pat='starfield'),
}
for name, th in THEMES.items():
    s = Spr(32, 32); w1, w2, w3 = th['w1'], th['w2'], th['w3']
    s.rect(0, 0, 32, 32, w1)
    if th['pat'] == 'damask':
        for y in range(32):
            for x in range(32):
                dx, dy = (x % 16) - 8, (y % 32) - 16 if x < 16 else ((y + 16) % 32) - 16
                r = (dx * dx) / 30 + (dy * dy) / 120
                if r < 1 and (abs(dx) + abs(dy) / 2.2) % 4 < 2: s.px(x, y, w2)
                if r < .25: s.px(x, y, w3)
        for y in range(0, 32, 2): s.px(0, y, w2)
    elif th['pat'] == 'stripe':
        for x in range(32):
            c = w2 if (x // 4) % 2 else w1
            for y in range(32): s.px(x, y, c)
        for y in range(0, 32, 8):
            for x in range(2, 32, 8): s.px(x, y, w3); s.px(x + 1, y + 1, w3)
    elif th['pat'] == 'panel':
        s.rect(0, 0, 32, 32, w2)
        for x0 in (0, 16):
            s.rect(x0 + 2, 2, 12, 28, w1); s.hline(x0 + 2, x0 + 13, 2, '#1a100c'); s.vline(x0 + 2, 2, 29, '#1a100c')
            s.hline(x0 + 3, x0 + 13, 29, w3); s.vline(x0 + 13, 3, 29, w3)
            for y in range(4, 28, 3): s.px(x0 + 5 + (y % 5), y, w2)
    elif th['pat'] == 'stone':
        for y in range(32):
            for x in range(32):
                n = (math.sin(x * .7 + y * .3) + math.sin(x * .2 - y * .9) + random.random() * .8)
                s.px(x, y, w2 if n > .9 else w1)
        for y0 in (0, 10, 21):
            s.hline(0, 31, y0, '#141216')
            for x0 in range((y0 * 7) % 13, 32, 13): s.vline(x0, y0, min(31, y0 + 10), '#141216')
    elif th['pat'] == 'tile':
        for y in range(32):
            for x in range(32):
                c = w2 if ((x // 8) + (y // 8)) % 2 else w1
                if x % 8 == 0 or y % 8 == 0: c = '#122024'
                elif x % 8 == 1 or y % 8 == 1: c = w3
                s.px(x, y, c)
    elif th['pat'] == 'checker':
        for y in range(32):
            for x in range(32): s.px(x, y, w2 if ((x // 16) + (y // 16)) % 2 else w1)
        for k in range(0, 32, 16): s.hline(0, 31, k, w3); s.vline(k, 0, 31, w3)
    elif th['pat'] == 'rivet':
        s.rect(0, 0, 32, 32, w2)
        for y0 in (0, 16):
            s.hline(0, 31, y0, '#100c08'); s.hline(0, 31, y0 + 1, w3)
            for x0 in range(2, 32, 6): s.px(x0, y0 + 3, w3); s.px(x0, y0 + 12, w3); s.px(x0 + 1, y0 + 4, '#100c08')
        for y in range(32):
            for x in range(32):
                if random.random() < .06: s.px(x, y, w1)
    elif th['pat'] == 'glass':  # greenhouse panes with iron frames + moonlit sky behind
        for y in range(32):
            for x in range(32):
                c = lerp(w2, w1, y / 32)
                if dith(x, y, .25): c = lerp(w3, w2, y / 32)
                s.px(x, y, c)
        for k in (0, 16): s.vline(k, 0, 31, '#0a1214'); s.vline(k + 1, 0, 31, '#3a5a5c')
        s.hline(0, 31, 0, '#0a1214'); s.hline(0, 31, 1, '#3a5a5c')
        s.line(4, 28, 12, 20, (200, 240, 255, 50)); s.line(20, 30, 28, 22, (200, 240, 255, 40))
    elif th['pat'] == 'hedge':
        for y in range(32):
            for x in range(32):
                n = math.sin(x * 1.1 + y * .5) + math.sin(x * .4 - y * 1.3) + random.random()
                s.px(x, y, w3 if n > 1.4 else w2 if n > .3 else w1)
    elif th['pat'] == 'bramble':
        s.rect(0, 0, 32, 32, w1)
        for k in range(3):
            pts = [(0, 6 + k * 11)] + [(x, int(6 + k * 11 + 4 * math.sin(x * .4 + k))) for x in range(4, 33, 4)]
            for (a, b), (c, d) in zip(pts, pts[1:]): s.line(a, b, c, d, w3)
            for x in range(3, 32, 7): s.px(x, int(6 + k * 11 + 4 * math.sin(x * .4 + k)) - 2, w2)
    elif th['pat'] == 'plank':
        for x in range(32):
            c = (w1, w2, w1, w3)[(x // 8) % 4] if x % 8 else '#0e0a06'
            for y in range(32): s.px(x, y, c if not (y == (x * 13) % 32 and x % 8) else '#0e0a06')
        for x0 in range(0, 32, 8): s.px(x0 + 3, 5, '#0e0a06'); s.px(x0 + 3, 26, '#0e0a06')
    elif th['pat'] == 'gothic':  # pointed-arch panels
        s.rect(0, 0, 32, 32, w1)
        for x0 in (0, 16):
            for y in range(4, 32):
                hw = 5 if y > 10 else max(0, 5 - (10 - y) * 0.8)
                for x in range(int(x0 + 8 - hw), int(x0 + 8 + hw) + 1): s.px(x, y, w2)
            s.vline(x0 + 8, 6, 31, w3); s.hline(x0 + 3, x0 + 13, 18, w3)
        for y in range(0, 32, 2): s.px(15, y, w3); s.px(31, y, w3)
    elif th['pat'] == 'niche':  # stone wall with skull niches
        for y in range(32):
            for x in range(32):
                n = math.sin(x * .9 + y * .4) + math.sin(x * .3 - y * .8) + random.random() * .7
                s.px(x, y, w2 if n > .9 else w1)
        s.hline(0, 31, 0, '#0a0c0a'); s.hline(0, 31, 16, '#0a0c0a')
        for x0, y0 in ((4, 4), (20, 20)):
            s.rect(x0, y0, 8, 7, '#060806'); s.ellipse(x0 + 4, y0 + 4, 2.5, 2.5, '#c8c4b0'); s.px(x0 + 3, y0 + 4, '#060806'); s.px(x0 + 5, y0 + 4, '#060806')
    elif th['pat'] == 'mosaic':  # small square bath tiles with a wave band
        for y in range(32):
            for x in range(32):
                c = w2 if ((x // 4) + (y // 4)) % 2 else w1
                if x % 4 == 0 or y % 4 == 0: c = '#122a30'
                if 12 <= y <= 19 and (y - 15.5) ** 2 < 9 + 6 * math.sin(x * .4): c = w3 if x % 4 and y % 4 else '#1a3e46'
                s.px(x, y, c)
    elif th['pat'] == 'wetstone':  # dark wet stone with drip streaks
        for y in range(32):
            for x in range(32):
                n = math.sin(x * .6 + y * .2) + math.sin(x * .25 - y * .7) + random.random() * .6
                s.px(x, y, w2 if n > .8 else w1)
        for x0 in (5, 18, 27):
            for y in range(32):
                if (y + x0) % 9 < 6: s.px(x0, y, w3)
        s.hline(0, 31, 0, '#060c10')
    elif th['pat'] == 'velvet':  # heavy stage-curtain folds
        for y in range(32):
            for x in range(32):
                f = math.sin(x / 32 * 6.283 * 2) * .5 + .5; s.px(x, y, lerp(w1, w3, f * .9))
        for x in range(0, 32, 4): s.px(x, 31, w3)
    elif th['pat'] == 'starfield':  # night sky through the dome glass
        for y in range(32):
            for x in range(32): s.px(x, y, lerp(w1, w2, (math.sin(x * .2 + y * .1) + 1) / 2))
        for (x, y) in ((3, 5), (17, 2), (26, 13), (9, 21), (21, 27), (30, 30), (12, 11)): s.px(x, y, '#ffffff'); s.px(x + 1, y, w3)
        s.vline(0, 0, 31, w3); s.hline(0, 31, 0, w3)
    elif th['pat'] == 'diamond':
        for y in range(32):
            for x in range(32):
                d = abs((x % 16) - 8) + abs((y % 16) - 8)
                if d == 7: s.px(x, y, w3)
                elif d < 3: s.px(x, y, w2)
        s.px(8, 8, w3); s.px(24, 24, w3)
    B.add('wall_' + name, s)
    # wainscot (lower wall panelling)
    s = Spr(32, 24)
    wood = '#3a2418' if name != 'ballroom' else '#1a1e38'; woodh = '#5a3a26' if name != 'ballroom' else '#2c3460'; woodl = '#24160e' if name != 'ballroom' else '#10122a'
    if name == 'cellar': wood, woodh, woodl = '#2a2620', '#3a352c', '#18160f'
    if name in ('laundry', 'kitchen'): wood, woodh, woodl = '#c8d4dc', '#eef4f8', '#7a8a96'
    if name in ('boiler', 'gears'): wood, woodh, woodl = '#3a3a44', '#5a5a68', '#1e1e26'
    if name in ('garden', 'courtyard', 'thorn'): wood, woodh, woodl = '#2a3a2a', '#3e5a3a', '#162016'
    if name == 'tower': wood, woodh, woodl = '#2a2438', '#3e3654', '#16121e'
    if name in ('crypt', 'cistern'): wood, woodh, woodl = '#2e322c', '#4a5046', '#161a16'
    if name == 'bath': wood, woodh, woodl = '#d8ecee', '#ffffff', '#6ab0b8'
    if name == 'chapel': wood, woodh, woodl = '#2a1a2a', '#4a2e48', '#140a14'
    if name in ('vintage', 'casks'): wood, woodh, woodl = '#3a1e16', '#5a3020', '#1e0e0a'
    if name in ('armory', 'knights'): wood, woodh, woodl = '#3a3e4a', '#5a6070', '#1c1e26'
    if name in ('servants', 'linen', 'bellroom'): wood, woodh, woodl = '#5a4630', '#7a6244', '#2e2418'
    if name in ('lake', 'grotto'): wood, woodh, woodl = '#1e2e30', '#2e4648', '#0c1416'
    if name in ('roof', 'spire'): wood, woodh, woodl = '#2a3040', '#4a5468', '#141822'
    if name in ('canvas', 'oils'): wood, woodh, woodl = '#c9a24a', '#ffe08a', '#7a5a1a'
    if name in ('nursery', 'toybox'): wood, woodh, woodl = '#e8e0f0', '#ffffff', '#a8a0c0'
    s.rect(0, 0, 32, 24, wood); s.hline(0, 31, 0, woodh); s.hline(0, 31, 1, '#c9a24a' if name in ('ballroom', 'vault', 'foyer') else woodh); s.hline(0, 31, 3, woodl)
    for x0 in (2, 18):
        s.rect(x0, 6, 12, 14, woodl); s.rect(x0 + 1, 7, 10, 12, wood); s.hline(x0 + 1, x0 + 11, 7, woodh); s.vline(x0 + 1, 7, 18, woodh)
    s.hline(0, 31, 22, woodl); s.hline(0, 31, 23, '#0e0a10')
    B.add('wain_' + name, s)
    # pillar
    s = Spr(16, 32)
    pc, ph, pl = ('#4a4058', '#6a5e80', '#2c2638') if name not in ('library', 'cellar', 'attic', 'shed') else ('#4a3426', '#6a4c36', '#2a1c14')
    if name in ('garden', 'courtyard', 'thorn'): pc, ph, pl = '#3a4a46', '#5a6e68', '#202a28'
    s.rect(2, 0, 12, 32, pc); s.vline(3, 0, 31, ph); s.vline(4, 0, 31, ph); s.vline(12, 0, 31, pl); s.vline(13, 0, 31, pl)
    for x in (6, 9): s.vline(x, 0, 31, pl)
    B.add('pillar_' + name, s)
    s = Spr(32, 10)
    s.rect(0, 0, 32, 10, '#2a2236'); s.hline(0, 31, 1, '#5a4c74'); s.rect(0, 3, 32, 3, '#3a3050'); s.hline(0, 31, 6, '#1a1424')
    for x in range(0, 32, 4): s.rect(x, 7, 2, 2, '#4a3e60')
    if name in ('ballroom', 'vault', 'foyer'): s.hline(0, 31, 2, '#b8923e')
    B.add('mold_' + name, s)
B.save()

# =====================================================================
#  PROPS (anchor: bottom-centre unless noted)
# =====================================================================
P = Atlas('props', 512)
GOLD, GOLDH, GOLDL, GOLDD = '#c9a24a', '#f3d98a', '#8a6a2a', '#4a3612'
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_areas.py'), encoding='utf-8').read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_v05.py'), encoding='utf-8').read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_v051.py'), encoding='utf-8').read())   # v0.5.1 expansion
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_v06.py'), encoding='utf-8').read())   # v0.6 expansion   # v0.5 expansion (add_v05_*)   # v0.4 areas (add_area_* below)
def frame_rect(s, x, y, w, h, t=3):
    s.rect(x, y, w, h, GOLDL); s.rect(x + 1, y + 1, w - 2, h - 2, GOLD)
    s.hline(x + 1, x + w - 2, y + 1, GOLDH); s.vline(x + 1, y + 1, y + h - 2, GOLDH)
    s.rect(x + t, y + t, w - 2 * t, h - 2 * t, GOLDD)
    for k in range(0, w, 4): s.px(x + k, y, GOLDH)
def window(w=40, h=76):
    s = Spr(w, h)
    cx = w / 2
    for y in range(h):
        for x in range(w):
            inside = y >= w / 2 or (x + .5 - cx) ** 2 + (y + .5 - w / 2) ** 2 <= (w / 2) ** 2
            if inside: s.px(x, y, '#2a2238')
    for y in range(3, h - 6):
        for x in range(3, w - 3):
            inside = y >= w / 2 or (x + .5 - cx) ** 2 + (y + .5 - w / 2) ** 2 <= (w / 2 - 3) ** 2
            if inside:
                t = y / h; c = lerp('#3a5a9a', '#1a2448', t)
                if dith(x, y, .15 + .3 * (1 - t)) : c = lerp('#5a7cc0', '#2a3870', t)
                s.px(x, y, c)
    # moon + clouds
    s.ellipse(w * .66, h * .28, 6, 6, '#e8f0ff'); s.ellipse(w * .66 + 2, h * .28 - 1, 5, 5, '#c8d8ff' if False else '#e8f0ff')
    s.ellipse(w * .66 - 2, h * .28 + 1, 2, 1.5, '#b8c8ee')
    for x in range(4, w - 4):
        s.px(x, int(h * .45 + math.sin(x * .4) * 1.5), '#6a84c0')
    # mullions
    s.vline(int(cx), 3, h - 6, '#1a1424'); s.hline(3, w - 4, int(h * .55), '#1a1424')
    s.hline(3, w - 4, int(h * .3), '#1a1424')
    s.rect(0, h - 6, w, 6, '#4a3e60'); s.hline(0, w - 1, h - 6, '#7a6c96'); s.hline(0, w - 1, h - 1, '#1a1424')
    return s
P.add('window', window()); P.add('window_wide', window(56, 84))
def portrait(w, h, kind):
    s = Spr(w, h); frame_rect(s, 0, 0, w, h, 3)
    iw, ih = w - 8, h - 8
    for y in range(ih):
        for x in range(iw):
            s.px(4 + x, 4 + y, lerp('#2a3a2a', '#141c14', y / ih) if kind != 'lady' else lerp('#3a2a3a', '#1a141c', y / ih))
    cx = w // 2
    if kind == 'lord':
        s.ellipse(cx, h * .42, iw * .22, ih * .2, '#d8b8a0'); s.rect(cx - iw * .32, h * .62, iw * .64, ih * .4, '#2a2a3a')
        s.rect(cx - 2, h * .6, 4, 5, '#e8e8f0'); s.ellipse(cx, h * .3, iw * .26, ih * .1, '#3a3030')
        s.px(cx - 3, int(h * .42), '#ff4040'); s.px(cx + 2, int(h * .42), '#ff4040')  # glowing eyes
        s.hline(cx - 2, cx + 1, int(h * .5), '#7a4a3a')
    elif kind == 'lady':
        s.ellipse(cx, h * .4, iw * .3, ih * .26, '#4a3a2a'); s.ellipse(cx, h * .42, iw * .18, ih * .17, '#e8c8b0')
        s.ellipse(cx, h * .85, iw * .36, ih * .25, '#6a2a4a'); s.rect(cx - 1, h * .62, 2, 2, '#f0e0a0')
        s.px(cx - 2, int(h * .41), '#202020'); s.px(cx + 2, int(h * .41), '#202020')
    elif kind == 'land':
        for x in range(iw):
            hh = int(ih * .55 + math.sin(x * .25) * 3)
            for y in range(hh, ih): s.px(4 + x, 4 + y, '#1a2a1a' if y > hh + 2 else '#2a4a2a')
        s.ellipse(4 + iw * .7, 4 + ih * .25, 3, 3, '#e0e0b0')
        s.rect(4 + iw * .3, 4 + ih * .3, 6, ih * .3, '#141414'); s.px(4 + iw * .3 + 2, 4 + ih * .4, '#ffd060')
    return s
P.add('portrait_lord', portrait(28, 36, 'lord')); P.add('portrait_lady', portrait(28, 36, 'lady')); P.add('portrait_land', portrait(44, 32, 'land'))
P.add('portrait_big', portrait(44, 56, 'lord'))
def sconce():
    s = Spr(12, 22)
    s.rect(5, 8, 2, 10, GOLDL); s.vline(5, 8, 17, GOLD); s.rect(2, 17, 8, 2, GOLD); s.hline(2, 9, 17, GOLDH); s.rect(4, 19, 4, 3, GOLDL)
    s.rect(3, 4, 6, 4, '#f0e8d8'); s.vline(3, 4, 7, '#ffffff'); s.vline(8, 4, 7, '#b8a890'); s.rect(2, 8, 8, 1, GOLD)
    return s
P.add('sconce', sconce())
for i in range(4):
    s = Spr(6, 8); hgt = [7, 6, 8, 6][i]; sway = [0, 1, 0, -1][i]
    for y in range(8 - hgt, 8):
        t = (y - (8 - hgt)) / hgt; wdt = 1 + int(t * 2.2)
        for x in range(3 - wdt, 3 + wdt): s.px(x + (sway if t < .4 else 0), y, '#fff6c0' if abs(x - 2.5) < wdt * .4 and t > .3 else ('#ffb040' if t > .2 else '#ff7020'))
    P.add('flame%d' % i, s)
for i in range(4):
    s = Spr(8, 10)
    hgt = [8, 7, 9, 7][i]; sway = [0, 1, 0, -1][i]
    for y in range(10 - hgt, 10):
        t = (y - (10 - hgt)) / hgt; wdt = 1 + int(t * 2.6)
        for x in range(4 - wdt, 4 + wdt): s.px(x + (sway if t < .4 else 0), y, '#e8ffff' if abs(x - 3.5) < wdt * .4 and t > .3 else ('#70d0ff' if t > .2 else '#3a70ff'))
    P.add('bflame%d' % i, s)
def curtain(w=32, h=72):
    s = Spr(w, h)
    s.rect(0, 0, w, 4, GOLDL); s.hline(0, w - 1, 0, GOLDH); s.hline(0, w - 1, 1, GOLD)
    s.rect(-1, 0, 3, 5, GOLDH); s.rect(w - 2, 0, 3, 5, GOLDH)
    for y in range(4, h):
        t = (y - 4) / (h - 4)
        for x in range(w):
            k = (x / w) * math.pi * 6
            v = .5 + .5 * math.sin(k)
            c = lerp('#4a0e1c', '#a0283e', v); 
            if v > .85: c = lerp('#a0283e', '#d8506a', (v - .85) / .15)
            if y > h - 3: c = GOLD if (x + y) % 2 else GOLDL
            s.px(x, y, c)
    # tie-back gather
    s.rect(0, int(h * .55), w, 3, GOLD); s.hline(0, w - 1, int(h * .55), GOLDH)
    return s
P.add('curtain', curtain()); P.add('curtain_rod', (lambda: (lambda s: (s.rect(0, 0, 32, 4, GOLDL), s.hline(0, 31, 0, GOLDH), s.hline(0, 31, 1, GOLD), s)[-1])(Spr(32, 4)))())
def dust(stage):
    s = Spr(20, 10); r = [9, 7, 5][stage]
    for y in range(10):
        for x in range(20):
            d = ((x - 10) / r) ** 2 + ((y - 10) / (r * .8)) ** 2
            if d < 1: s.px(x, y, '#8a8494' if d < .5 else '#6a6474')
    for i in range(r * 2): s.px(10 - r + random.randrange(r * 2), 10 - random.randrange(max(1, int(r * .6))), '#b0a8b8')
    return s
for i in range(3): P.add('dust%d' % i, dust(i))
def cobweb():
    s = Spr(20, 20)
    for k in range(5): s.line(0, 0, [19, 19, 14, 8, 2][k], [2, 8, 14, 19, 19][k], (200, 200, 220, 90))
    for r in (5, 10, 15):
        pts = [(r, 0), (int(r * .9), int(r * .4)), (int(r * .7), int(r * .7)), (int(r * .4), int(r * .9)), (0, r)]
        for (a, b), (c, d) in zip(pts, pts[1:]): s.line(a, b, c, d, (200, 200, 220, 80))
    return s
P.add('cobweb', cobweb())
def vase():
    s = Spr(14, 22)
    for y in range(22):
        t = y / 21; wdt = 2 + 4.5 * math.sin(min(1, t * 1.25) * math.pi) if t > .15 else 3
        for x in range(14):
            if abs(x + .5 - 7) < wdt: 
                c = '#e8ecf8' if abs(x + .5 - 7 + 2) < 1.2 else '#c8d4f0'
                if 9 < y < 15 and (x + y) % 4 == 0: c = '#3a5ab8'
                if y in (10, 15): c = '#2a4aa0'
                s.px(x, y, c)
    s.outline('#1a1830'); return s
P.add('vase', vase())
def table():
    s = Spr(80, 30)
    s.rect(0, 0, 80, 6, '#f0ece4'); s.hline(0, 79, 0, '#ffffff'); 
    for x in range(0, 80, 6): s.rect(x, 6, 3, 4, '#e0dcd4')
    s.rect(2, 6, 76, 4, '#d8d0c4'); s.hline(2, 77, 9, '#a89c8c')
    for x in (6, 70): s.rect(x, 10, 4, 20, '#4a2a1c'); s.vline(x, 10, 29, '#6a4030')
    s.rect(30, 10, 20, 3, '#3a2014')
    s.rect(36, -2 + 2, 8, 0, '#000')
    return s
P.add('table', table())
def chair(flip=False):
    s = Spr(16, 30)
    s.rect(2, 0, 3, 30, '#4a2a1c'); s.vline(2, 0, 29, '#6a4030'); s.rect(1, 0, 5, 2, '#6a4030')
    s.rect(2, 2, 3, 12, '#7a1830'); 
    s.rect(2, 15, 13, 3, '#7a1830'); s.hline(2, 14, 15, '#a03048'); s.rect(12, 18, 3, 12, '#4a2a1c'); s.rect(3, 18, 2, 12, '#4a2a1c')
    return s
P.add('chair', chair())
def candelabra():
    s = Spr(24, 18)
    s.rect(11, 6, 2, 10, GOLD); s.rect(8, 16, 8, 2, GOLDL); s.hline(8, 15, 16, GOLD)
    s.hline(3, 20, 8, GOLD); s.vline(3, 4, 8, GOLD); s.vline(20, 4, 8, GOLD)
    for x in (2, 11, 19): s.rect(x, 0, 3, 5, '#f0e8d8'); s.vline(x, 0, 4, '#ffffff')
    return s
P.add('candelabra', candelabra())
def bookshelf():
    s = Spr(40, 72)
    s.rect(0, 0, 40, 72, '#3a2218'); s.rect(2, 2, 36, 68, '#1e120c'); s.hline(0, 39, 0, '#6a4030'); s.vline(0, 0, 71, '#5a3826')
    cols = ['#7a2030', '#2a4a7a', '#2a6a3a', '#8a6a2a', '#5a2a6a', '#6a3a1a', '#3a3a5a']
    for sh in range(4):
        y0 = 2 + sh * 17
        x = 3
        while x < 37:
            bw = random.choice([2, 3, 3, 4]); bh = random.randint(11, 15); c = random.choice(cols)
            if x + bw > 37: break
            if random.random() < .12: x += bw; continue
            s.rect(x, y0 + 15 - bh, bw, bh, c); s.vline(x, y0 + 15 - bh, y0 + 14, lerp(c, '#ffffff', .25)); s.px(x + bw - 1, y0 + 17 - bh, GOLD)
            x += bw
        s.rect(2, y0 + 15, 36, 2, '#5a3826'); s.hline(2, 37, y0 + 15, '#7a5038')
    return s
P.add('bookshelf', bookshelf())
def clock():
    s = Spr(22, 64)
    s.rect(3, 0, 16, 64, '#3a2218'); s.rect(1, 6, 20, 2, '#5a3826'); s.ellipse(11, 14, 7, 7, GOLD); s.ellipse(11, 14, 6, 6, '#f0e8d0')
    s.line(11, 14, 11, 9, '#202020'); s.line(11, 14, 14, 16, '#202020')
    s.rect(6, 25, 10, 26, '#140c08'); s.rect(10, 26, 2, 16, GOLDL); s.ellipse(11, 44, 3, 3, GOLD)
    s.rect(0, 58, 22, 6, '#4a2c1e'); s.hline(0, 21, 58, '#6a4030'); s.vline(3, 0, 57, '#5a3826')
    return s
P.add('clock', clock())
def barrel():
    s = Spr(26, 26)
    s.ellipse(13, 13, 12, 12, '#5a3a24')
    for y in range(26):
        for x in range(26):
            if ((x - 13) / 12.5) ** 2 + ((y - 13) / 12.5) ** 2 <= 1:
                c = '#5a3a24' if (int(math.hypot(x - 13, y - 13)) % 4) else '#3a2414'
                if math.hypot(x - 13, y - 13) > 10.5: c = '#6a6a74'
                s.px(x, y, c)
    s.rect(11, 11, 4, 4, '#2a1a10')
    return s
def save_altar():
    s = Spr(28, 40)
    s.rect(4, 26, 20, 14, '#3a3450'); s.hline(4, 23, 26, '#6a6090'); s.rect(2, 36, 24, 4, '#2a2440'); s.hline(2, 25, 36, '#5a5080')
    s.rect(8, 28, 12, 6, '#2a2440');
    for x in range(9, 19, 3): s.vline(x, 29, 32, '#7a70a8')
    # lantern
    s.rect(9, 6, 10, 18, '#1a1630'); s.rect(10, 8, 8, 14, '#2a5aa8'); s.rect(11, 9, 6, 12, '#4a8ae8')
    s.rect(8, 4, 12, 3, GOLD); s.hline(8, 19, 4, GOLDH); s.rect(8, 23, 12, 3, GOLD); s.rect(13, 0, 2, 4, GOLDL)
    s.vline(9, 6, 23, GOLDL); s.vline(18, 6, 23, GOLDL)
    return s
P.add('save', save_altar())
def door_frame():
    s = Spr(20, 64)
    s.rect(0, 0, 20, 64, '#2a2236'); s.rect(3, 6, 14, 58, '#0c0a14')
    s.rect(0, 0, 20, 6, '#4a3e60'); s.hline(0, 19, 0, '#7a6c96'); s.ellipse(10, 2, 4, 3, GOLD)
    s.vline(1, 6, 63, '#4a3e60'); s.vline(18, 6, 63, '#4a3e60'); s.vline(2, 6, 63, '#5a4c74')
    return s
P.add('doorframe', door_frame())
def door_panel():
    s = Spr(10, 48)
    s.rect(0, 0, 10, 48, '#4a2c1e'); s.vline(0, 0, 47, '#6a4030'); s.vline(9, 0, 47, '#24140c')
    for y0 in (4, 26): s.rect(2, y0, 6, 16, '#3a2216'); s.hline(2, 7, y0, '#24140c')
    s.ellipse(7, 25, 1.5, 1.5, GOLD)
    return s
P.add('door', door_panel())
def armor_stand():
    s = Spr(24, 52)
    s.rect(4, 48, 16, 4, '#2a2436')
    return s
def chandelier_small():
    s = Spr(48, 30)
    s.vline(24, 0, 10, GOLDL)
    s.ellipse(24, 14, 4, 4, GOLD)
    for x in range(4, 45):
        y = 16 + int(4 * math.sin((x - 4) / 40 * math.pi)); s.px(x, y, GOLD); s.px(x, y + 1, GOLDL)
    for x in (4, 14, 24, 34, 44):
        y = 16 + int(4 * math.sin((x - 4) / 40 * math.pi)); s.rect(x - 1, y - 6, 3, 6, '#f0e8d8'); s.rect(x - 2, y - 1, 5, 2, GOLD)
    for x in range(8, 42, 4):
        y = 18 + int(4 * math.sin((x - 4) / 40 * math.pi)); s.vline(x, y, y + 4, '#a8d8ff'); s.px(x, y + 5, '#ffffff')
    return s
P.add('chandelier_deco', chandelier_small())
def stairs_rail():  # decorative banister piece 16x24
    s = Spr(16, 24)
    s.rect(0, 0, 16, 3, '#6a4030'); s.hline(0, 15, 0, '#a07050')
    for x in (2, 7, 12): s.rect(x, 3, 2, 21, '#4a2a1c'); s.px(x, 3, '#7a5038')
    return s
P.add('rail', stairs_rail())
def rug(w=96):
    s = Spr(w, 4)
    s.rect(0, 0, w, 4, '#7a1830'); s.hline(0, w - 1, 0, '#b83a50'); s.hline(0, w - 1, 3, '#4a0c1c')
    for x in range(2, w - 2, 4): s.px(x, 1, GOLD)
    return s
P.add('rug', rug())
def wine_rack():
    s = Spr(40, 40)
    s.rect(0, 0, 40, 40, '#2a1a10'); 
    for y in range(4, 40, 8):
        for x in range(4, 40, 8): s.ellipse(x, y, 3, 3, '#1a3a1a'); s.px(x - 1, y - 1, '#4a8a4a')
    for k in range(0, 40, 8): s.vline(k, 0, 39, '#4a2c1c'); s.hline(0, 39, k, '#4a2c1c')
    return s
P.add('winerack', wine_rack())
def heart_container():
    s = Spr(28, 34)
    s.rect(6, 26, 16, 8, '#3a3450'); s.hline(6, 21, 26, '#6a6090'); s.rect(4, 31, 20, 3, '#2a2440')
    return s
P.add('pedestal', heart_container())
# ---------------- v0.2 props ----------------
WOOD, WOODH, WOODL, WOODD = '#6a4430', '#9a6a48', '#4a2e1e', '#2a1a10'
IRON, IRONH, IRONL = '#5a5a68', '#9a9aae', '#2a2a36'
def shelf_unit(w, h, rows, fill):
    s = Spr(w, h); s.rect(0, 0, w, h, WOODL); s.rect(2, 2, w - 4, h - 4, '#1e140c'); s.vline(0, 0, h - 1, WOOD); s.hline(0, w - 1, 0, WOODH)
    rh = (h - 4) // rows
    for r in range(rows):
        y0 = 2 + r * rh; fill(s, 3, y0, w - 6, rh - 2, r); s.rect(2, y0 + rh - 2, w - 4, 2, WOOD); s.hline(2, w - 3, y0 + rh - 2, WOODH)
    return s
def linens(s, x, y, w, h, r):
    xx = x
    cols = ['#e8eef8', '#c8d8f0', '#f0e0e8', '#d8f0e0', '#f8f0d8']
    while xx < x + w - 5:
        bw = random.randint(6, 10); c = random.choice(cols); hh = random.randint(h // 2, h - 1)
        for k in range(0, hh, 3): s.rect(xx, y + h - hh + k, min(bw, x + w - xx), 2, c); s.hline(xx, xx + min(bw, x + w - xx) - 1, y + h - hh + k + 2, lerp(c, '#000000', .3))
        xx += bw + 1
P.add('linenshelf', shelf_unit(36, 52, 3, linens))
def pipes():
    s = Spr(20, 80)
    for x0, c in ((3, '#7a6a5a'), (11, '#5a6a7a')):
        s.rect(x0, 0, 6, 80, c); s.vline(x0 + 1, 0, 79, lerp(c, '#ffffff', .35)); s.vline(x0 + 5, 0, 79, lerp(c, '#000000', .4))
        for y in (12, 40, 68): s.rect(x0 - 1, y, 8, 4, IRON); s.hline(x0 - 1, x0 + 6, y, IRONH)
    s.rect(1, 52, 18, 5, '#8a7a6a'); s.hline(1, 18, 52, '#b8a898'); s.ellipse(10, 54, 3, 3, '#c03030'); s.px(9, 53, '#ff8080')
    return s
P.add('pipes', pipes())
def lamp_wall():
    s = Spr(12, 18); s.rect(5, 0, 2, 6, IRON); s.rect(1, 6, 10, 2, IRONL); s.ellipse(6, 12, 4, 5, '#ffe8a0'); s.ellipse(6, 11, 2, 2, '#fffff0'); s.rect(2, 16, 8, 2, IRON)
    s.outline('#1a1424'); return s
P.add('lamp_wall', lamp_wall())
def sheetline():  # top anchored: rope with hanging sheets
    s = Spr(90, 40)
    for x in range(90): s.px(x, 2 + int(4 * math.sin(x / 89 * math.pi)), '#a89878')
    for x0, w, c in ((8, 22, '#e8eef8'), (36, 18, '#f0d8e0'), (60, 24, '#d8e8f0')):
        y0 = 3 + int(4 * math.sin((x0 + w / 2) / 89 * math.pi)); hgt = random.randint(26, 34)
        for x in range(x0, x0 + w):
            hh = hgt - int(3 * abs(math.sin((x - x0) * .5)))
            for y in range(y0, y0 + hh): s.px(x, y, c if (x - x0) % 6 else lerp(c, '#000000', .18))
        s.rect(x0 + 2, y0 - 1, 2, 3, '#b8a070'); s.rect(x0 + w - 4, y0 - 1, 2, 3, '#b8a070')
    return s
P.add('sheetline', sheetline())
def basket():
    s = Spr(24, 16)
    for y in range(4, 16):
        for x in range(1 + (16 - y) // 4, 23 - (16 - y) // 4): s.px(x, y, '#a07a48' if (x + y) % 3 else '#6a4a28')
    s.ellipse(12, 4, 11, 3, '#e8eef8'); s.ellipse(8, 3, 4, 2, '#f0d8e0'); s.hline(1, 22, 6, '#c89a5a'); s.outline('#2a1a10'); return s
P.add('basket', basket())
def washtub():
    s = Spr(32, 22)
    for y in range(6, 22):
        for x in range(2 + (y - 6) // 5, 30 - (y - 6) // 5): s.px(x, y, IRON if (x % 6) else IRONL)
    s.rect(1, 5, 30, 3, IRONH); s.ellipse(16, 5, 13, 2, '#bfe8f8'); s.ellipse(9, 3, 4, 3, '#ffffff'); s.ellipse(15, 2, 3, 2, '#e8f8ff'); s.ellipse(22, 3, 4, 3, '#ffffff')
    s.rect(6, 12, 20, 2, IRONL); s.outline('#14121e'); return s
P.add('washtub', washtub())
def boiler_prop():
    s = Spr(40, 64)
    s.rect(4, 6, 32, 54, '#6a4a3a'); s.ellipse(20, 8, 16, 6, '#8a6a52'); s.vline(6, 8, 58, '#9a7a62'); s.vline(33, 8, 58, '#3a2a20')
    for y in (16, 34, 52): s.rect(4, y, 32, 3, IRON); s.hline(4, 35, y, IRONH)
    s.ellipse(20, 26, 7, 7, '#2a1a10'); s.ellipse(20, 26, 5, 5, '#ff8030'); s.ellipse(20, 27, 3, 2, '#ffd080')
    s.ellipse(29, 42, 4, 4, '#e8e8f0'); s.line(29, 42, 31, 40, '#c03030'); s.rect(16, 0, 8, 6, IRON); s.rect(0, 58, 40, 6, '#2a2228')
    s.outline('#14101a'); return s
P.add('boiler', boiler_prop())
def stove():
    s = Spr(44, 34)
    s.rect(0, 6, 44, 28, '#2a2a32'); s.rect(0, 4, 44, 4, '#4a4a56'); s.hline(0, 43, 4, '#7a7a8a')
    s.rect(6, 14, 14, 12, '#141418'); s.rect(8, 16, 10, 8, '#ff6a20'); s.rect(9, 18, 8, 5, '#ffc060'); s.rect(26, 14, 12, 12, '#141418'); s.rect(28, 20, 8, 3, '#5a5a66')
    s.ellipse(12, 3, 7, 2, '#3a3a44'); s.ellipse(32, 3, 7, 2, '#3a3a44'); s.rect(40, -2, 4, 6, '#3a3a44')
    s.outline('#0c0c10'); return s
P.add('stove', stove())
def pots_fill(s, x, y, w, h, r):
    xx = x + 1
    while xx < x + w - 8:
        k = random.choice(['pot', 'jar', 'jar', 'pan'])
        if k == 'pot': s.rect(xx, y + h - 7, 9, 7, '#4a4a56'); s.hline(xx, xx + 8, y + h - 7, '#8a8a9a'); xx += 11
        elif k == 'jar': c = random.choice(['#c87a3a', '#7aa048', '#c84a4a', '#e8c86a']); s.rect(xx, y + h - 9, 6, 9, '#c8d8e0'); s.rect(xx + 1, y + h - 7, 4, 6, c); s.rect(xx, y + h - 10, 6, 2, '#8a6a4a'); xx += 8
        else: s.ellipse(xx + 5, y + h - 3, 5, 2, '#5a5a66'); xx += 11
P.add('potshelf', shelf_unit(40, 40, 3, pots_fill))
def hangpans():  # top anchored rack with hanging pans
    s = Spr(56, 30); s.rect(0, 0, 56, 3, IRONL); s.hline(0, 55, 0, IRONH)
    for k, x in enumerate((6, 18, 30, 44)):
        L = 8 + (k % 2) * 5; s.vline(x, 3, 3 + L, IRON)
        if k % 2: s.ellipse(x, 6 + L, 6, 6, '#3a3a44'); s.ellipse(x - 1, 5 + L, 4, 4, '#5a5a68')
        else: s.ellipse(x, 7 + L, 5, 4, '#b87a3a'); s.ellipse(x - 1, 6 + L, 3, 2, '#e0a060'); s.rect(x - 1, 2 + L, 2, 3, '#4a2a1a')
    return s
P.add('hangpans', hangpans())
def sack():
    s = Spr(22, 24)
    for y in range(24):
        hw = 6 + 4 * math.sin(min(1, (y + 2) / 20) * math.pi * .8) if y > 4 else 4
        for x in range(22):
            if abs(x + .5 - 11) < hw: s.px(x, y, '#c8a878' if (x * 3 + y) % 7 else '#a88a5a')
    s.rect(8, 3, 6, 2, '#6a4a28'); s.hline(4, 17, 14, '#a88a5a'); s.px(10, 12, '#6a4a28'); s.outline('#2a1a10'); return s
P.add('sack', sack())
# ---- side-view barrel (v0.1 drew it from above)
def barrel_side(w=26, h=30):
    s = Spr(w, h); cx = w / 2
    for y in range(h):
        t = y / (h - 1); bulge = (w / 2 - 3) + 3 * math.sin(t * math.pi)
        for x in range(w):
            dx = x + .5 - cx
            if abs(dx) < bulge:
                u = dx / bulge  # -1..1 across the stave curve
                stave = int((u + 1) * 3.2)
                c = lerp('#8a5a34', '#4a2e18', (u + 1) / 2 * .8)
                if stave % 2: c = lerp('#7a4e2c', '#40261a', (u + 1) / 2 * .8)
                if abs(u) > .88: c = '#2e1c10'
                if u < -.45 and u > -.65: c = lerp('#b07a4a', '#8a5a34', t)
                s.px(x, y, c)
    for hy in (3, 9, h - 10, h - 4):  # iron hoops
        t = hy / (h - 1); bulge = (w / 2 - 3) + 3 * math.sin(t * math.pi)
        for x in range(w):
            if abs(x + .5 - cx) < bulge: s.px(x, hy, '#5a5a68' if x + .5 - cx > 0 else '#9a9aae'); s.px(x, hy + 1, '#2a2a36')
    s.ellipse(cx, 1, w / 2 - 3, 1.5, '#6a4430'); s.px(int(cx) - 2, 15, '#2a1a10'); s.px(int(cx) - 2, 16, '#c9a24a')
    s.outline('#1a0e08'); return s
P.add('barrel', barrel_side())
def crate():
    s = Spr(24, 22); s.rect(0, 0, 24, 22, '#8a6038'); s.rect(1, 1, 22, 20, '#a07448')
    for y in (1, 8, 15): s.hline(1, 22, y, '#6a4428')
    s.line(2, 20, 21, 2, '#6a4428'); s.line(2, 19, 20, 2, '#c8945a'); s.rect(0, 0, 24, 2, '#5a3a20'); s.rect(0, 20, 24, 2, '#5a3a20')
    s.outline('#2a180c'); return s
P.add('crate', crate())
def trunk():
    s = Spr(34, 22); s.rect(0, 6, 34, 16, '#5a2e20'); s.ellipse(17, 7, 17, 6, '#6a3a26'); s.rect(0, 7, 34, 2, '#3a1a10')
    for x in (4, 29): s.rect(x, 2, 3, 20, '#c9a24a'); s.vline(x, 2, 21, '#f3d98a')
    s.rect(14, 10, 6, 6, '#c9a24a'); s.rect(16, 12, 2, 3, '#2a1a10'); s.outline('#1a0c08'); return s
P.add('trunk', trunk())
def dolls_fill(s, x, y, w, h, r):
    xx = x + 1
    while xx < x + w - 7:
        c = random.choice(['#c84a6a', '#4a6ac8', '#e8c86a', '#7a4ab8', '#4ab88a'])
        s.ellipse(xx + 3, y + h - 9, 3, 3, '#f0d8c0'); s.rect(xx + 1, y + h - 13, 5, 2, random.choice(['#4a2a1a', '#e8c86a', '#1a1a1a']))
        s.px(xx + 2, y + h - 9, '#000000'); s.px(xx + 4, y + h - 9, '#000000'); s.rect(xx, y + h - 6, 7, 6, c); xx += 9
P.add('dollshelf', shelf_unit(40, 48, 3, dolls_fill))
def gear_spr(R, teeth, col=('#8a6a2a', '#c9a24a', '#f3d98a')):
    S = int(R * 2 + 6); s = Spr(S, S); c = S / 2
    for y in range(S):
        for x in range(S):
            dx, dy = x + .5 - c, y + .5 - c; d = math.hypot(dx, dy); a = math.atan2(dy, dx)
            rr = R + (2.5 if math.cos(a * teeth) > .3 else 0)
            if d < rr and d > R * .32:
                cc = col[1] if (dx + dy) < 0 else col[0]
                if d < R * .5 and d > R * .38: cc = col[2]
                if R * .55 < d < R * .75 and (int(math.degrees(a) + 360) // 60) % 2 == 0 and teeth > 7: cc = (0, 0, 0, 0)
                s.px(x, y, cc)
    s.outline('#2a1a08'); return s
P.add('gear_big', gear_spr(22, 12)); P.add('gear_med', gear_spr(13, 9))
def clockface():
    s = Spr(46, 46); s.ellipse(23, 23, 22, 22, '#8a6a2a'); s.ellipse(23, 23, 20, 20, '#c9a24a'); s.ellipse(23, 23, 17, 17, '#f0e8d0')
    for k in range(12):
        a = k / 12 * 2 * math.pi; s.rect(23 + math.sin(a) * 14 - 1, 23 - math.cos(a) * 14 - 1, 2, 2, '#2a1a10')
    s.line(23, 23, 23, 11, '#2a1a10'); s.line(23, 23, 31, 27, '#2a1a10'); s.ellipse(23, 23, 2, 2, '#c03030'); s.outline('#1a1008'); return s
P.add('clockface', clockface())
def bell():  # top anchored
    s = Spr(40, 46); s.rect(18, 0, 4, 8, IRONL); s.rect(10, 6, 20, 3, WOOD)
    for y in range(9, 42):
        t = (y - 9) / 32; hw = 7 + 12 * t ** 1.6
        for x in range(40):
            dx = x + .5 - 20
            if abs(dx) < hw: s.px(x, y, '#e0b040' if dx < -hw * .3 else ('#c9a24a' if dx < hw * .5 else '#8a6a2a'))
    s.rect(1, 40, 38, 3, '#8a6a2a'); s.hline(1, 38, 40, '#f3d98a'); s.ellipse(20, 44, 3, 2, '#5a4a2a'); s.outline('#2a1a08'); return s
P.add('bell', bell())
def round_window():
    s = Spr(36, 36); c = 18
    for y in range(36):
        for x in range(36):
            d = math.hypot(x + .5 - c, y + .5 - c)
            if d < 18: s.px(x, y, '#4a3e60' if d > 15 else lerp('#3a5a9a', '#1a2448', y / 36))
    s.ellipse(23, 12, 4, 4, '#e8f0ff'); s.vline(18, 3, 32, '#1a1424'); s.hline(3, 32, 18, '#1a1424'); s.outline('#1a1424'); return s
P.add('round_window', round_window())
def glasspane():
    s = Spr(44, 72)
    for y in range(72):
        for x in range(44):
            c = lerp('#2a4a6a', '#0e1c2a', y / 72)
            if dith(x, y, .2): c = lerp('#3a5a7a', '#1a2a3a', y / 72)
            s.px(x, y, c)
    if True:
        s.ellipse(30, 14, 5, 5, '#e8f0ff')
        for k in range(30): s.px(random.randrange(44), random.randrange(40), (255, 255, 255, random.randint(80, 200)))
    for x in (0, 1, 21, 22, 42, 43): s.vline(x, 0, 71, '#2a3a3a')
    for y in (0, 1, 24, 48, 70, 71): s.hline(0, 43, y, '#2a3a3a')
    s.line(4, 40, 16, 28, (220, 250, 255, 70)); s.line(26, 64, 38, 52, (220, 250, 255, 50))
    for y in range(40, 72):  # leaves climbing the frame
        if y % 5 == 0: s.ellipse(2 + (y % 3), y, 3, 2, '#3a7a3a'); s.ellipse(41 - (y % 3), y + 2, 3, 2, '#2e6a2e')
    return s
P.add('glasspane', glasspane())
def fern():
    s = Spr(30, 26)
    for k in range(7):
        a = -1.3 + k * .43; L = 13 + 4 * math.cos(a)
        for t in range(int(L)):
            x = 15 + math.sin(a) * t; y = 25 - math.cos(a) * t + (t * t) * .02
            s.px(x, y, '#3a8a3a'); 
            if t % 2 == 0 and t > 2: s.px(x - 1, y + 1, '#5ab04a'); s.px(x + 1, y + 1, '#2a6a2a')
    s.rect(9, 21, 12, 5, '#8a4a2a'); s.hline(9, 20, 21, '#b06a3a'); s.outline('#0e1a0e'); return s
P.add('fern', fern())
def rosebush():
    s = Spr(36, 26)
    for y in range(26):
        for x in range(36):
            if ((x - 18) / 17) ** 2 + ((y - 16) / 11) ** 2 < 1: s.px(x, y, '#2a5a2a' if (x * 3 + y * 5) % 7 else '#3e7a36')
    for (x, y) in ((8, 10), (17, 6), (27, 11), (12, 17), (24, 18), (19, 13)):
        s.ellipse(x, y, 2.6, 2.3, '#c82a4a'); s.px(x - 1, y - 1, '#ff6a8a'); s.px(x, y, '#8a1a30')
    s.outline('#0e1a0e'); return s
P.add('rosebush', rosebush())
def hedge():
    s = Spr(40, 36)
    for y in range(36):
        for x in range(40):
            edge = 3 + 2 * math.sin(x * .7) if y < 8 else 0
            if y >= edge: s.px(x, y, '#1e4a22' if (x * 7 + y * 3) % 5 else '#2e6a30')
    for k in range(18): s.px(random.randrange(40), random.randrange(4, 36), '#4a8a40')
    s.outline('#0a160a'); return s
P.add('hedge', hedge())
def fountain():
    s = Spr(72, 52)
    s.rect(4, 36, 64, 16, '#6a6a7a'); s.hline(4, 67, 36, '#9a9aae'); s.ellipse(36, 37, 31, 4, '#3a6a9a'); s.ellipse(36, 37, 26, 2, '#5a8aba')
    s.rect(32, 14, 8, 22, '#7a7a8a'); s.vline(33, 14, 35, '#a8a8ba'); s.ellipse(36, 14, 14, 3, '#7a7a8a'); s.ellipse(36, 13, 12, 2, '#5a8aba')
    s.ellipse(36, 6, 4, 5, '#8a8a9a')
    for k in range(-1, 2, 2):
        for t in range(14): s.px(36 + k * (3 + t), 6 + t * t * .1 - 2, (180, 220, 255, 200))
        for t in range(10): s.px(36 + k * (14 + t * .6), 14 + t * 2, (180, 220, 255, 160))
    s.rect(8, 44, 56, 2, '#4a4a58'); s.outline('#14141e'); return s
P.add('fountain', fountain())
def statue():
    s = Spr(24, 56)
    s.rect(2, 44, 20, 12, '#5a5a6a'); s.hline(2, 21, 44, '#8a8a9e'); s.rect(4, 42, 16, 3, '#6a6a7a')
    s.ellipse(12, 10, 5, 6, '#9a9aae'); s.rect(7, 16, 10, 26, '#8a8a9e'); s.vline(8, 16, 41, '#b0b0c4'); s.rect(3, 18, 4, 14, '#8a8a9e'); s.rect(17, 18, 4, 10, '#7a7a8e')
    s.ellipse(12, 4, 7, 3, '#7a7a8e'); s.px(10, 10, '#4a4a58'); s.px(14, 10, '#4a4a58')
    for y in (24, 31, 38): s.hline(7, 16, y, '#6a6a7e')
    for k in range(6): s.ellipse(4 + k * 3, 52 - k, 2, 1.5, '#2e5a2e')
    s.outline('#14141e'); return s
P.add('statue', statue())
def vine_hang():  # top anchored
    s = Spr(20, 60)
    for k, x0 in enumerate((5, 13)):
        L = 40 + k * 16
        for y in range(L):
            x = x0 + 2 * math.sin(y * .2 + k); s.px(x, y, '#2a6a2a')
            if y % 6 == 0: s.ellipse(x + (2 if y % 12 else -2), y + 1, 2, 1.5, '#4a9a3a')
    return s
P.add('vine_hang', vine_hang())
def gardenlamp():
    s = Spr(14, 60); s.rect(6, 14, 2, 46, '#2a2a36'); s.rect(4, 56, 6, 4, '#3a3a48'); s.rect(3, 4, 8, 10, '#1a1a24')
    s.rect(4, 5, 6, 8, '#bfe8ff'); s.rect(5, 6, 4, 6, '#ffffff'); s.rect(2, 2, 10, 3, '#2a2a36'); s.rect(6, 0, 2, 2, '#2a2a36'); s.outline('#0c0c14'); return s
P.add('gardenlamp', gardenlamp())
# ---- gameplay props
def wardrobe():
    s = Spr(32, 66)
    s.rect(1, 4, 30, 60, '#5a3220'); s.rect(0, 0, 32, 6, '#7a4a30'); s.hline(0, 31, 0, '#b07a50'); s.rect(0, 62, 32, 4, '#3a2014')
    for x0 in (3, 17):
        s.rect(x0, 8, 12, 50, '#6a3e28'); s.rect(x0 + 2, 10, 8, 20, '#4a2a1a'); s.rect(x0 + 2, 34, 8, 20, '#4a2a1a'); s.vline(x0, 8, 57, '#8a5a3a')
    s.rect(14, 30, 2, 6, GOLD); s.rect(17, 30, 2, 6, GOLD); s.vline(16, 8, 57, '#2a160c')
    s.ellipse(16, -1, 6, 2, '#7a4a30'); s.outline('#1a0c06'); return s
P.add('wardrobe', wardrobe())
def lever(pos):
    s = Spr(18, 26); s.rect(2, 18, 14, 8, IRONL); s.rect(3, 19, 12, 6, IRON); s.hline(3, 14, 19, IRONH); s.px(5, 22, IRONH); s.px(12, 22, IRONH)
    a = {'up': -0.5, 'mid': 0.1, 'down': 0.75}[pos]
    for t in range(16): s.rect(9 + math.sin(a) * t - 1, 19 - math.cos(a) * t, 2, 1, '#8a8a9e')
    s.ellipse(9 + math.sin(a) * 16, 19 - math.cos(a) * 16, 3, 3, '#c03030'); s.px(8 + math.sin(a) * 16, 18 - math.cos(a) * 16, '#ff8080')
    s.outline('#14121e'); return s
for k in ('up', 'mid', 'down'): P.add('lever_' + k, lever(k))
def abil_pedestal():
    s = Spr(30, 30)
    s.rect(4, 22, 22, 8, '#3a3450'); s.hline(4, 25, 22, '#7a70b0'); s.rect(7, 8, 16, 14, '#2a2440'); s.vline(8, 8, 21, '#5a5080'); s.rect(5, 4, 20, 4, '#4a4070'); s.hline(5, 24, 4, '#9a90d0')
    for k in range(3): s.px(11 + k * 4, 14, '#8fe8ff')
    s.ellipse(15, 3, 8, 2, '#8fe8ff'); s.outline('#100c1c'); return s
P.add('abil_pedestal', abil_pedestal())
def hanging_sheet():  # curtain variant for the laundry (white sheet on a line)
    s = Spr(32, 72); s.hline(0, 31, 0, '#a89878')
    for y in range(1, 70):
        for x in range(1, 31):
            k = .5 + .5 * math.sin(x * .55); c = lerp('#b8c8d8', '#f4f8ff', k)
            if y > 64 and (x + y) % 3 == 0: continue
            s.px(x, y, c)
    s.rect(3, 0, 2, 4, '#c8a070'); s.rect(27, 0, 2, 4, '#c8a070'); return s
P.add('sheet', hanging_sheet())
def ivy():
    s = Spr(32, 72)
    for y in range(72):
        for x in range(32):
            n = math.sin(x * .9 + y * .3) + math.sin(x * .3 - y * .7)
            if n > -1.2: s.px(x, y, '#1e4a22' if n < .4 else '#2e6a2e' if n < 1.2 else '#4a8a3a')
    return s
P.add('ivy', ivy())
for k in range(2):
    s = Spr(16, 16)
    for y in range(16):
        for x in range(16):
            n = math.sin((x + k * 5) * .8 + y * .5) + math.sin(x * .3 - (y + k * 3) * .9)
            if n > -1.0: s.px(x, y, '#1e4a22' if n < .3 else '#2e6a2e' if n < 1.0 else '#4a8a3a')
    for i in range(4): s.px(random.randrange(16), random.randrange(16), '#8a3a4a')  # thorns
    s.line(0, 4 + k * 6, 15, 10 - k * 4, '#3a2a14')
    P.add('vine%d' % k, s)
s = Spr(26, 8)
for x in range(26):
    for y in range(8):
        d = abs(x - 12.5) / 13 + abs(y - 4) / 5
        if d < 1: s.px(x, y, (170, 235, 255, int(200 * (1 - d) + 40)))
s.hline(2, 23, 2, (255, 255, 255, 200)); P.add('floatpad', s)
def thornspike():
    s = Spr(16, 44)
    for y in range(44):
        hw = 1 + (y / 44) * 6
        for x in range(16):
            if abs(x + .5 - 8) < hw: s.px(x, y, '#3a6a2a' if x < 8 else '#24481c')
    for y in range(6, 44, 7): s.line(8, y, 2 if y % 14 else 14, y - 4, '#c8e0a0')
    s.ellipse(8, 2, 1.5, 2, '#e8f0c8'); s.outline('#0e1a0a'); return s
P.add('thornspike', thornspike())
# ---- v0.3 props: chapel / crypt / bath / warp
def stainedglass():
    s = Spr(36, 70); cols = ['#c83a5a', '#3a8ac8', '#e8c040', '#4ab86a', '#8a5ac8']
    for y in range(70):
        for x in range(36):
            dx = x + .5 - 18; top = 18 - math.sqrt(max(0, 18 * 18 - dx * dx)) if y < 18 else 0
            if y >= top + 0 and y < 68 and abs(dx) < 16:
                c = cols[(int(x // 6) + int(y // 9)) % 5]
                if x % 6 == 0 or y % 9 == 0: c = '#140c1a'
                s.px(x, y, c)
    s.ellipse(18, 22, 7, 7, '#f8e8a0'); s.ellipse(18, 22, 4, 4, '#ffffff'); s.vline(18, 30, 66, '#140c1a')
    s.outline('#2a2030'); return s
P.add('stainedglass', stainedglass())
s = Spr(44, 20); s.rect(2, 6, 40, 4, '#5a3424'); s.hline(2, 41, 6, '#8a5a3a'); s.rect(2, 0, 3, 20, '#4a2a1c'); s.rect(39, 0, 3, 20, '#4a2a1c'); s.rect(4, 10, 36, 3, '#3a2014'); s.rect(6, 13, 2, 7, '#3a2014'); s.rect(36, 13, 2, 7, '#3a2014'); s.outline('#140a06'); P.add('pew', s)
s = Spr(48, 30); s.rect(4, 8, 40, 22, '#d8d0c0'); s.rect(2, 6, 44, 4, '#f4ecdc'); s.rect(6, 12, 36, 14, '#7a1a2a'); s.rect(20, 12, 8, 14, GOLD); s.rect(23, 0, 2, 7, GOLD); s.rect(20, 2, 8, 2, GOLD)
for x in (9, 39): s.rect(x - 1, -1 + 3, 2, 4, '#f0e8d8'); s.px(x - 1, 1, '#ffb040')
s.outline('#1a1410'); P.add('altar', s)
def pipes_deco():
    s = Spr(64, 90)
    for k, x in enumerate(range(2, 62, 6)):
        h = 40 + int(46 * math.sin((k + .5) / 10 * math.pi)); y0 = 90 - h
        s.rect(x, y0, 5, h, '#b8a07a'); s.vline(x, y0, 89, '#e8d8b0'); s.vline(x + 4, y0, 89, '#7a6040'); s.rect(x + 1, y0 + h - 18, 3, 3, '#2a1a10'); s.hline(x, x + 4, y0, '#fff0c8')
    s.outline('#1a120a'); return s
P.add('organpipes', pipes_deco())
s = Spr(40, 16); s.rect(1, 3, 38, 12, '#4a3a2a'); s.rect(0, 1, 40, 4, '#6a5238'); s.hline(0, 39, 1, '#8a6e4a'); s.rect(16, 5, 8, 2, '#c9a24a'); s.vline(20, 2, 10, '#c9a24a'); s.hline(17, 23, 5, '#c9a24a'); s.outline('#140c06'); P.add('coffin', s)
s = Spr(30, 22)
for k, (x, y) in enumerate([(5, 16), (14, 17), (23, 16), (9, 9), (19, 9), (14, 3)]):
    s.ellipse(x, y, 4, 4, '#d8d4c0' if k % 2 else '#c8c4b0'); s.px(x - 2, y, '#1a1a14'); s.px(x + 1, y, '#1a1a14'); s.hline(x - 1, x + 1, y + 3, '#8a8676')
s.outline('#141410'); P.add('skullpile', s)
s = Spr(14, 20); s.ellipse(7, 12, 6, 7, '#6a7a6a'); s.ellipse(5, 10, 2, 4, '#8a9a8a'); s.rect(4, 2, 6, 4, '#5a6a5a'); s.rect(3, 1, 8, 2, '#7a8a7a'); s.hline(2, 11, 13, '#4a5a4a'); s.outline('#141a14'); P.add('urn', s)
s = Spr(28, 26); s.ellipse(14, 12, 11, 11, '#c9a24a'); s.ellipse(14, 12, 8, 8, '#e8c86a'); s.rect(10, 9, 2, 2, '#4a3612'); s.rect(16, 9, 2, 2, '#4a3612'); s.ellipse(14, 16, 4, 3, '#4a3612'); s.rect(12, 18, 4, 8, '#8ac8e0'); s.vline(13, 18, 25, '#ffffff')
for k in range(8): a = k / 8 * 6.28; s.ellipse(14 + math.cos(a) * 11, 12 + math.sin(a) * 11, 2.5, 2.5, '#8a6a2a')
s.outline('#2a1a08'); P.add('liontap', s)
s = Spr(16, 12); s.rect(1, 2, 14, 3, '#e8a050'); s.hline(1, 14, 2, '#ffc880'); s.rect(3, 5, 2, 7, '#a86a30'); s.rect(11, 5, 2, 7, '#a86a30'); s.outline('#2a1608'); P.add('bathstool', s)
s = Spr(26, 18)
for k, x in enumerate((6, 18, 12)):
    y = 12 if k < 2 else 5; s.rect(x - 5, y - 1, 10, 7, '#e8c070'); s.hline(x - 5, x + 4, y - 1, '#fff0b0'); s.hline(x - 5, x + 4, y + 2, '#a87a30')
s.outline('#2a1a08'); P.add('buckets', s)
s = Spr(16, 14); s.ellipse(8, 9, 7, 5, '#ffd83a'); s.ellipse(10, 4, 4, 4, '#ffd83a'); s.rect(13, 4, 3, 2, '#ff8a2a'); s.px(10, 3, '#000000'); s.ellipse(6, 8, 3, 2, '#ffe880'); s.outline('#5a4008'); P.add('duckprop', s)
s = Spr(48, 10)
for x in range(48):
    for y in range(10):
        d = ((x + .5 - 24) / 24) ** 2 + ((y + .5 - 5) / 5) ** 2
        if d < 1: s.px(x, y, '#2a1a48' if d > .8 else '#4a3a8a' if d > .5 else '#6a5ac8')
for k in range(12): a = k / 12 * 6.28; s.px(24 + math.cos(a) * 18, 5 + math.sin(a) * 3.2, '#c8f0ff')
s.ellipse(24, 5, 6, 2, '#a8e8ff'); s.outline('#140c28'); P.add('warp_pad', s)
s = Spr(14, 30); s.rect(6, 8, 2, 22, '#3a2a2a'); s.rect(3, 0, 8, 9, '#2a2a3a'); s.rect(4, 1, 6, 7, '#8ad0ff'); s.rect(5, 2, 4, 5, '#d8f4ff'); s.outline('#0a0a14'); P.add('spiritlamp', s)
add_area_props(P)
add_v05_props(P); add_v051_props(P); add_v06_props(P)
P.save()

# =====================================================================
#  ITEMS
# =====================================================================
I = Atlas('items', 256)
for f in range(4):
    s = Spr(10, 10); wdt = [4, 3, 1, 3][f]
    s.ellipse(5, 5, wdt + .5, 4.5, '#f0c040'); s.ellipse(5, 5, max(.5, wdt - .5), 3.5, '#ffe080')
    if wdt > 1: s.vline(5, 3, 6, '#c08a20')
    s.outline('#6a4010'); I.add('coin%d' % f, s)
s = Spr(11, 10)
for y in range(10):
    for x in range(11):
        xx, yy = x - 5, y - 3
        if (xx + 2.5) ** 2 + yy ** 2 < 7.5 or (xx - 2.5) ** 2 + yy ** 2 < 7.5 or (yy >= 0 and abs(xx) < 6 - yy * .9 and yy < 6): s.px(x, y, '#ff4a6a')
s.px(3, 2, '#ffc0d0'); s.px(2, 3, '#ffc0d0'); s.outline('#5a0a1a'); I.add('heart', s)
s = Spr(18, 16)
for y in range(16):
    for x in range(18):
        xx, yy = x - 8.5, y - 5
        if (xx + 4) ** 2 + yy ** 2 < 20 or (xx - 4) ** 2 + yy ** 2 < 20 or (yy >= 0 and abs(xx) < 9 - yy * .95 and yy < 10): s.px(x, y, '#ff4a6a' if (x + y) % 5 else '#ff6a8a')
s.rect(4, 2, 2, 3, '#ffd0e0'); s.outline('#ffffff'); s.outline('#5a0a1a'); I.add('heartbig', s)
s = Spr(14, 6); s.ellipse(7, 3, 6.5, 2.5, '#f4f4fc'); s.ellipse(7, 3, 4, 1.4, '#d8dcf0'); s.hline(3, 10, 3, '#6a8ad8'); s.outline('#3a3a5a'); I.add('plate', s)
s = Spr(12, 10); s.rect(1, 1, 10, 8, '#7a2030'); s.rect(2, 2, 8, 6, '#9a3040'); s.vline(1, 1, 8, '#4a1018'); s.hline(2, 10, 8, '#f0e8d0'); s.px(5, 4, GOLD); s.px(6, 4, GOLD); s.outline('#200810'); I.add('book', s)
s = Spr(6, 12); s.rect(1, 3, 4, 9, '#f0e8d8'); s.vline(1, 3, 11, '#ffffff'); s.vline(4, 3, 11, '#b8a890'); s.rect(2, 0, 2, 3, '#ffb040'); s.px(2, 0, '#fff0a0'); I.add('candle', s)
s = Spr(10, 8); s.ellipse(5, 4, 4.5, 3.5, '#8a8494'); s.ellipse(4, 3, 2, 1.5, '#b0a8b8'); s.outline('#3a3444'); I.add('dustball', s)
s = Spr(12, 12)  # crystal shard (boss drop)
for y in range(12):
    for x in range(12):
        if abs(x - 5.5) + abs(y - 5.5) * .6 < 4.5: s.px(x, y, '#a8e0ff' if x < 6 else '#6ab0f0')
s.px(4, 3, '#ffffff'); s.outline('#1a3a6a'); I.add('crystal', s)
s = Spr(10, 10); s.ellipse(5, 5, 4.5, 4.5, '#ffe080'); s.ellipse(5, 5, 2.5, 2.5, '#fffff0'); I.add('spark', s)
s = Spr(14, 10)  # ballroom key
s.ellipse(3.5, 5, 3.5, 3.5, GOLD); s.ellipse(3.5, 5, 1.5, 1.5, (0, 0, 0, 0)); s.a[4:7, 2:5] = 0
s.rect(6, 4, 8, 2, GOLD); s.hline(6, 13, 4, GOLDH); s.rect(10, 6, 2, 3, GOLD); s.rect(12, 6, 2, 2, GOLD); s.px(2, 3, GOLDH); s.outline('#4a3612'); I.add('key', s)
s = Spr(12, 12)  # fireball (ammo from a fire wisp)
for y in range(12):
    for x in range(12):
        d = math.hypot(x - 5.5, y - 6.5)
        if d < 5 or (y < 6 and abs(x - 5.5) < (6 - y) * 0.6 and y > 0): s.px(x, y, '#fff0a0' if d < 2.2 else ('#ffb040' if d < 3.8 else '#ff6a20'))
s.outline('#5a1a08'); I.add('fireball', s)
# ---- v0.2 items (ammo + misc); sizes match CONFIG.ammo
s = Spr(8, 14); s.rect(2, 0, 4, 4, '#3a6a3a'); s.rect(1, 4, 6, 10, '#2e8a4a'); s.vline(2, 5, 12, '#7ad08a'); s.rect(2, 7, 4, 4, '#f0e8d0'); s.px(2, 0, '#c8a070'); s.outline('#0e2a14'); I.add('bottle', s)
s = Spr(14, 16); s.rect(2, 0, 3, 16, '#7a4a30'); s.rect(2, 8, 11, 3, '#9a6a48'); s.hline(2, 12, 8, '#c08a5a'); s.rect(10, 11, 2, 5, '#6a3e28'); s.rect(3, 11, 2, 5, '#6a3e28'); s.rect(3, 1, 2, 6, '#c03a4a'); s.outline('#2a160c'); I.add('chair', s)
s = Spr(16, 8); s.ellipse(6, 4, 5.5, 3.5, '#3a3a44'); s.ellipse(5, 3, 3.5, 1.8, '#6a6a78'); s.rect(11, 3, 5, 2, '#5a3a20'); s.outline('#101016'); I.add('pan', s)
g12 = gear_spr(4, 8); s = Spr(12, 12); s.blit(g12, -1, -1); I.add('gear', s)
s = Spr(12, 12); s.rect(2, 6, 8, 6, '#b8603a'); s.rect(1, 5, 10, 2, '#d8804a'); s.ellipse(6, 3, 3, 2.5, '#3a8a3a'); s.px(6, 1, '#ff6a8a'); s.px(5, 2, '#ff6a8a'); s.outline('#3a1a0a'); I.add('flowerpot', s)
s = Spr(12, 12); s.rect(1, 3, 10, 7, '#f0a8d0'); s.hline(1, 10, 3, '#ffd8f0'); s.rect(3, 5, 5, 2, '#ffffff'); s.ellipse(9, 2, 2, 2, (220, 240, 255, 220)); s.ellipse(3, 1, 1.4, 1.4, (220, 240, 255, 200)); s.outline('#6a2a5a'); I.add('soap', s)
s = Spr(10, 10); s.ellipse(5, 5, 4, 4.5, '#c8a040'); s.ellipse(4, 4, 2, 2, '#f0d070'); s.line(5, 0, 7, 2, '#3a8a3a'); s.px(6, 6, '#8a6a20'); s.outline('#3a2a08'); I.add('seed', s)
s = Spr(16, 14); s.rect(1, 3, 14, 11, '#a85a3a'); s.ellipse(8, 3, 7, 2, '#c87a4a'); s.rect(3, 0, 10, 3, '#8a4a2a'); s.vline(3, 4, 12, '#d08a5a'); s.hline(1, 14, 8, '#7a3a20'); s.outline('#2a120a'); I.add('pot', s)
I.add('barrel', barrel_side(16, 18))
s = Spr(6, 6); s.line(0, 5, 5, 0, '#c8ecff'); s.line(1, 5, 5, 1, '#8ac8f0'); s.px(2, 3, '#ffffff'); I.add('shard', s)
s = Spr(16, 16)
for y in range(16):
    for x in range(16):
        d = math.hypot(x + .5 - 8, y + .5 - 8)
        if d < 7.5: s.px(x, y, (200, 240, 255, 230) if d > 6.3 else (170, 220, 250, 70 + int(d * 8)))
s.ellipse(5, 5, 2, 1.5, '#ffffff'); s.px(11, 11, (255, 200, 240, 220)); I.add('bubble', s)
s = Spr(12, 8); s.ellipse(6, 4, 5.5, 3, '#ff5a8a'); s.ellipse(5, 3, 3, 1.5, '#ffa0c0'); s.line(1, 4, 10, 4, '#c02a5a'); s.outline('#5a0a2a'); I.add('petal', s)
for k, (c1, c2, sym) in {'float': ('#8fe8ff', '#2a8ac8', 'f'), 'turbo': ('#ff9a5a', '#c84a1a', 't'), 'djump': ('#c8a0ff', '#6a3ac8', 'd'), 'phase': ('#e0b8ff', '#7a3ab8', 'p'), 'tank': ('#9affc8', '#2a9a6a', 'k')}.items():
    s = Spr(16, 16)
    for y in range(16):
        for x in range(16):
            d = math.hypot(x + .5 - 8, y + .5 - 8)
            if d < 7.5: s.px(x, y, lerp(c1, c2, min(1, math.hypot(x - 5, y - 5) / 9)))
    if sym == 'f': s.rect(4, 9, 8, 2, '#ffffff'); s.rect(6, 5, 4, 3, '#ffffff')  # pad + object
    elif sym == 't': s.line(4, 4, 11, 8, '#ffffff'); s.line(4, 8, 11, 8, '#ffffff'); s.line(4, 12, 11, 8, '#ffffff')
    elif sym == 'p':  # ghost silhouette
        s.ellipse(8, 7, 3.5, 3.5, (255, 255, 255, 200)); s.rect(5, 7, 7, 4, (255, 255, 255, 200)); s.px(5, 11, (255, 255, 255, 200)); s.px(8, 11, (255, 255, 255, 200)); s.px(11, 11, (255, 255, 255, 200)); s.px(7, 7, '#5a2a8a'); s.px(9, 7, '#5a2a8a')
    elif sym == 'k':  # tank with a plus
        s.rect(4, 5, 8, 7, '#ffffff'); s.rect(5, 6, 6, 5, '#2a9a6a'); s.hline(6, 9, 8, '#ffffff'); s.vline(8, 7, 10, '#ffffff'); s.rect(6, 3, 4, 2, '#ffffff')
    else: s.line(4, 8, 8, 4, '#ffffff'); s.line(8, 4, 12, 8, '#ffffff'); s.line(4, 12, 8, 8, '#ffffff'); s.line(8, 8, 12, 12, '#ffffff')
    s.px(5, 4, '#ffffff'); s.outline('#14102a'); I.add('orb_' + k, s)
s = Spr(16, 8); s.rect(3, 3, 10, 2, '#e8e4d0'); s.ellipse(2.5, 2.5, 2, 2, '#f0ecd8'); s.ellipse(2.5, 5.5, 2, 2, '#f0ecd8'); s.ellipse(13.5, 2.5, 2, 2, '#f0ecd8'); s.ellipse(13.5, 5.5, 2, 2, '#f0ecd8'); s.outline('#3a3628'); I.add('bone', s)
s = Spr(14, 13); s.ellipse(7, 8, 6, 4.5, '#ffd83a'); s.ellipse(9, 4, 3.5, 3.5, '#ffd83a'); s.rect(11, 4, 3, 2, '#ff8a2a'); s.px(9, 3, '#000000'); s.ellipse(5, 7, 2.5, 1.5, '#ffe880'); s.outline('#5a4008'); I.add('duck', s)
s = Spr(12, 12); s.ellipse(4, 9, 3.5, 2.5, '#d8b8ff'); s.vline(7, 1, 9, '#d8b8ff'); s.line(7, 1, 11, 4, '#d8b8ff'); s.ellipse(4, 8, 1.5, 1, '#ffffff'); s.outline('#3a1a6a'); I.add('note', s)
add_v05_items(I)
I.save()

# =====================================================================
#  ENEMIES
# =====================================================================
E = Atlas('enemies', 512)
def ghost(f, mood='normal', col=('#c8f0ff', '#88c8f0', '#4a7ac0'), size=26):
    s = Spr(size, size); c1, c2, c3 = col
    cx = size / 2; r = size * .36
    for y in range(size):
        for x in range(size):
            dx, dy = x + .5 - cx, y + .5 - (size * .42)
            body = dx * dx + dy * dy < r * r or (dy >= 0 and abs(dx) < r and y < size - 3 - (2 if ((x + f * 2) // 3) % 2 else 0))
            if body:
                t = (dx + dy) / (r * 2)
                c = c1 if t < -.25 else (c2 if t < .35 else c3)
                s.px(x, y, c)
    # tail flick
    ey = int(size * .4)
    if mood == 'normal':
        for ex in (-4, 3):
            s.rect(cx + ex, ey - 1, 2, 3, '#1a1440'); s.px(cx + ex, ey - 1, '#ffffff')
        s.rect(cx - 2, ey + 4, 4, 2, '#1a1440'); s.px(cx - 1, ey + 5, '#ff7090')
    elif mood == 'tug':  # straining, eyes shut, mouth open
        s.line(cx - 6, ey - 1, cx - 3, ey + 1, '#1a1440'); s.line(cx + 5, ey - 1, cx + 2, ey + 1, '#1a1440')
        s.ellipse(cx, ey + 6, 2.5, 3, '#1a1440'); s.px(cx, ey + 7, '#ff7090')
    elif mood == 'angry':
        s.line(cx - 6, ey - 3, cx - 3, ey - 1, '#1a1440'); s.line(cx + 5, ey - 3, cx + 2, ey - 1, '#1a1440')
        s.rect(cx - 5, ey, 2, 2, '#ff3050'); s.rect(cx + 3, ey, 2, 2, '#ff3050')
        for x in range(int(cx - 4), int(cx + 4)): s.px(x, ey + 5 + (x % 2), '#1a1440')
    s.outline('#1a2448'); return s
for f in range(4): E.add('puff%d' % f, ghost(f, size=32))
E.add('puff_tug', ghost(1, 'tug', size=32)); E.add('puff_angry', ghost(2, 'angry', size=32))
DCOL = ('#f0d0ff', '#c098e8', '#7a52b8')
for f in range(3): 
    s = ghost(f, 'normal', DCOL, 36)
    # butler ghost: bow tie
    s.rect(15, 25, 6, 2, '#2a1440'); s.px(17, 25, '#ff5a7a'); s.px(18, 25, '#ff5a7a')
    E.add('dish%d' % f, s)
E.add('dish_throw', ghost(1, 'angry', DCOL, 36)); E.add('dish_tug', ghost(1, 'tug', DCOL, 36))
def armor(f, broken=False):
    s = Spr(28, 52)
    steel, sh, sl, sd = '#8a92a8', '#c8d0e0', '#5a6278', '#2a3044'
    leg = [0, 2][f]
    # legs
    s.rect(9 - leg, 34, 4, 15, steel); s.rect(15 + leg, 34, 4, 15, steel); s.vline(9 - leg, 34, 48, sh); s.vline(15 + leg, 34, 48, sh)
    s.rect(8 - leg, 48, 6, 4, sd); s.rect(14 + leg, 48, 6, 4, sd)
    # torso
    s.rect(7, 18, 14, 17, steel); s.rect(8, 19, 4, 14, sh); s.rect(18, 19, 3, 15, sl); s.hline(7, 20, 26, sl); s.rect(6, 32, 16, 3, sd)
    # shoulders + arms
    s.ellipse(6, 20, 3.5, 3, sh); s.ellipse(22, 20, 3.5, 3, steel)
    s.rect(4, 22, 3, 11, steel); s.rect(21, 22, 3, 11, sl)
    # halberd
    s.vline(25, 2, 50, '#6a4030'); s.rect(24, 2, 3, 8, '#c8d0e0'); s.line(24, 4, 27, 9, sh); s.rect(22, 30, 5, 3, sl)
    if not broken:
        # helmet with visor slit glowing
        s.rect(8, 4, 12, 14, steel); s.rect(9, 3, 10, 2, sh); s.rect(9, 5, 3, 12, sh); s.hline(8, 19, 10, sd); s.rect(10, 10, 9, 2, '#1a1424')
        s.px(12, 10, '#ff5050'); s.px(16, 10, '#ff5050'); s.rect(13, 0, 2, 4, '#c03040'); s.rect(12, 0, 4, 2, '#e04a5a')
    s.outline('#14121e'); return s
E.add('armor0', armor(0)); E.add('armor1', armor(1)); E.add('armor_shell', armor(0, True))
s = Spr(12, 12)
s.rect(1, 1, 10, 10, '#8a92a8'); s.rect(2, 2, 3, 8, '#c8d0e0'); s.rect(3, 5, 7, 2, '#1a1424'); s.outline('#14121e')
E.add('helmet', s)
# little fire wisp (boss minion)
for f in range(3):
    s = Spr(16, 18); cx = 8
    for y in range(18):
        for x in range(16):
            dx, dy = x + .5 - cx, y + .5 - 11
            body = dx * dx + dy * dy < 30 or (dy < 0 and abs(dx) < (6 + dy * .9) - (1 if (x + f) % 3 == 0 else 0) and dy > -9)
            if body: s.px(x, y, '#fff0a0' if dx * dx + dy * dy < 8 else ('#ffb040' if dx * dx + dy * dy < 18 else '#ff6a20'))
    s.rect(5, 10, 2, 2, '#4a1400'); s.rect(9, 10, 2, 2, '#4a1400'); s.outline('#5a1a08')
    E.add('firewisp%d' % f, s)
# ---- v0.2 normal enemies (immune to suction) + sheet ghost
def bat(f):
    s = Spr(20, 12); body = '#4a2e5a'; wing = '#6a4a7a'
    s.ellipse(10, 6, 3.5, 3.5, body); s.px(8, 2, body); s.px(12, 2, body); s.px(9, 5, '#ff4a4a'); s.px(11, 5, '#ff4a4a')
    if f == 0:
        for x in range(0, 7): s.vline(x, 2 + x // 2, 6 + (x % 2), wing); s.vline(19 - x, 2 + x // 2, 6 + (x % 2), wing)
    else:
        for x in range(0, 7): s.vline(x, 6 + (6 - x) // 2, 9 - (x % 2), wing); s.vline(19 - x, 6 + (6 - x) // 2, 9 - (x % 2), wing)
    s.outline('#140a1a'); return s
E.add('bat0', bat(0)); E.add('bat1', bat(1))
s = Spr(12, 14); s.ellipse(6, 6, 4, 6, '#4a2e5a'); s.rect(1, 2, 10, 8, '#3a2048'); s.vline(6, 0, 1, '#2a2a2a'); s.px(4, 9, '#ff4a4a'); s.px(7, 9, '#ff4a4a'); s.outline('#140a1a'); E.add('bat_hang', s)
def rat(f):
    s = Spr(22, 12); s.ellipse(10, 7, 7, 4, '#7a6a7a'); s.ellipse(9, 6, 5, 2.5, '#9a8a9a'); s.ellipse(17, 7, 3.5, 3, '#8a7a8a'); s.ellipse(15, 3, 1.5, 1.5, '#d8a0b0')
    s.px(18, 6, '#ff3040'); s.px(21, 8, '#ff8090')
    for x in range(0, 4): s.px(x, 7 - (x if f else -x) // 2, '#d8a0b0')
    s.rect(6 + f * 2, 10, 2, 2, '#5a4a5a'); s.rect(13 - f * 2, 10, 2, 2, '#5a4a5a'); s.outline('#1a141a'); return s
E.add('rat0', rat(0)); E.add('rat1', rat(1))
def garg(mode, f=0):
    s = Spr(30, 28); st, sh, sl = ('#7a7a86', '#a8a8b8', '#4a4a56')
    if mode != 'stone': st, sh, sl = '#6a6a7e', '#9a9ab2', '#3a3a4e'
    # wings
    if mode == 'stone':
        for y in range(6, 20): s.hline(1 + (y - 6) // 3, 6, y, sl); s.hline(23, 28 - (y - 6) // 3, y, sl)
    elif mode == 'dive':
        for y in range(2, 12): s.hline(2, 9, y, sl); s.hline(20, 27, y, sl)
    else:
        wy = 2 if f == 0 else 10
        for k in range(8): s.line(14, 12, 1 + k, wy + k, sl); s.line(15, 12, 28 - k, wy + k, sl)
    s.ellipse(15, 16, 7, 8, st); s.ellipse(13, 13, 4, 4, sh); s.ellipse(15, 8, 5, 4.5, st); s.px(11, 3, sh); s.px(19, 3, sh); s.px(11, 4, st); s.px(19, 4, st)
    eye = '#3a3a44' if mode == 'stone' else '#ff4030'
    s.px(13, 8, eye); s.px(17, 8, eye); s.hline(13, 17, 11, sl); s.px(14, 12, '#e8e8f0'); s.px(16, 12, '#e8e8f0')
    s.rect(10, 23, 3, 4, sl); s.rect(17, 23, 3, 4, sl)
    if mode == 'stone':
        for k in range(10): s.px(random.randrange(9, 22), random.randrange(6, 24), '#5a5a66')
    s.outline('#16161e'); return s
E.add('garg_stone', garg('stone')); E.add('garg_fly0', garg('fly', 0)); E.add('garg_fly1', garg('fly', 1)); E.add('garg_dive', garg('dive'))
def puppet(f, throw=False):
    s = Spr(20, 34)
    for x in (4, 10, 16): s.vline(x, 0, 6 + (x % 3), (220, 220, 230, 140))
    s.ellipse(10, 9, 4.5, 4.5, '#f0d8c0'); s.rect(5, 4, 10, 3, '#8a2a3a'); s.px(8, 9, '#000000'); s.px(12, 9, '#000000'); s.ellipse(7, 11, 1, 1, '#ff8a9a'); s.ellipse(13, 11, 1, 1, '#ff8a9a')
    s.hline(9, 11, 12, '#7a2a2a')
    for y in range(14, 26):
        hw = 3 + (y - 14) * .45
        s.hline(10 - hw, 10 + hw, y, '#c03a5a' if y % 4 else '#8a1a3a')
    s.rect(5, 14, 10, 2, '#ffffff')
    if throw: s.line(14, 15, 19, 8, '#f0d8c0'); s.px(19, 7, '#c8c8d8'); s.line(6, 15, 2, 20, '#f0d8c0')
    else: s.line(5, 15, 2 + f, 21, '#f0d8c0'); s.line(15, 15, 18 - f, 21, '#f0d8c0')
    s.vline(8, 26, 31 + f, '#2a1a1a'); s.vline(12, 26, 32 - f, '#2a1a1a'); s.outline('#1a0c10'); return s
E.add('puppet0', puppet(0)); E.add('puppet1', puppet(1)); E.add('puppet_throw', puppet(0, True))
def skel(f, throw=False):
    s = Spr(24, 42); bone, bl = '#e8e4d8', '#a8a498'
    s.ellipse(12, 6, 5, 5.5, bone); s.rect(9, 5, 2, 3, '#1a1414'); s.rect(13, 5, 2, 3, '#1a1414'); s.px(10, 6, '#ff7a3a'); s.px(14, 6, '#ff7a3a'); s.hline(10, 14, 10, bl); s.hline(10, 14, 11, bone)
    s.rect(6, 13, 12, 13, '#2a2030'); s.rect(10, 13, 4, 10, '#f0f0f0'); s.px(11, 14, '#c03030'); s.px(12, 14, '#c03030')  # butler coat + bow
    s.rect(6, 25, 12, 2, '#1a1420'); s.vline(9, 27, 39 - f, bone); s.vline(15, 27, 38 + f, bone); s.rect(7, 39 - f, 4, 2, bl); s.rect(14, 38 + f, 4, 2, bl)
    if throw: s.line(17, 15, 22, 6, bone); s.ellipse(22, 5, 3, 1.5, '#f4f4fc')
    else: s.line(17, 15, 21, 18, bone); s.line(21, 18, 22, 16, bone); s.ellipse(22, 15, 4, 1.5, '#f4f4fc'); s.line(6, 15, 3, 24, bone)
    s.outline('#1a1418'); return s
E.add('skel0', skel(0)); E.add('skel1', skel(1)); E.add('skel_throw', skel(0, True))
def cbook(f, bite=False):
    s = Spr(22, 18)
    if bite:  # opened wide with teeth
        s.rect(1, 2, 20, 4, '#7a2030'); s.rect(1, 12, 20, 4, '#7a2030'); s.rect(2, 6, 18, 6, '#3a0a10')
        for x in range(3, 20, 3): s.px(x, 6, '#f0e8d0'); s.px(x + 1, 11, '#f0e8d0')
        s.px(15, 3, '#ffe040'); s.px(17, 3, '#ffe040')
    else:
        a = 2 + f * 2
        s.rect(2, 6, 18, 9, '#7a2030'); s.rect(3, 7, 16, 7, '#9a3040'); s.hline(3, 18, 14, '#f0e8d0'); s.rect(2, 6 - a, 18, 2, '#7a2030'); s.hline(4, 18, 7 - a + 1, '#f0e8d0')
        s.px(14, 9, '#ffe040'); s.px(17, 9, '#ffe040'); s.px(8, 10, GOLD); s.px(9, 10, GOLD)
    s.outline('#200810'); return s
E.add('cbook0', cbook(0)); E.add('cbook1', cbook(1)); E.add('cbook_bite', cbook(0, True))
SCOL = ('#ffffff', '#dce4f0', '#9aa8c0')
def sheetghost(f, mood):
    s = ghost(f, mood, SCOL, 34)
    for y in range(26, 34):  # ragged hem
        for x in range(34):
            if s.a[y, x, 3] and (x + f * 3) % 5 == 0 and y > 29: s.a[y, x] = 0
    return s
E.add('sheet0', sheetghost(0, 'normal')); E.add('sheet1', sheetghost(1, 'normal')); E.add('sheet_angry', sheetghost(2, 'angry')); E.add('sheet_tug', sheetghost(1, 'tug'))
def skullwisp(f):
    s = Spr(20, 22)
    for k in range(10):  # ghost flame tail
        y = 12 + k; w = max(0, 6 - k * .6 + (1 if (k + f) % 2 else 0)); s.hline(10 - w, 10 + w, y, '#7ae8ff' if k % 3 else '#c8f8ff')
    s.ellipse(10, 9, 7, 7, '#e8e4d8'); s.ellipse(8, 7, 3, 3, '#ffffff'); s.rect(6, 8, 3, 3, '#14181a'); s.rect(11, 8, 3, 3, '#14181a'); s.px(7, 9, '#7ae8ff'); s.px(12, 9, '#7ae8ff')
    s.px(10, 12, '#14181a'); s.hline(7, 13, 14, '#a8a498'); 
    for x in (8, 10, 12): s.px(x, 15, '#e8e4d8')
    s.outline('#0a1418'); return s
E.add('skullwisp0', skullwisp(0)); E.add('skullwisp1', skullwisp(1))
def crab(f, snap=False):
    s = Spr(24, 16); sh, shl, shd = '#e8603a', '#ff9a6a', '#a83a1a'
    s.ellipse(12, 10, 8, 5, sh); s.ellipse(10, 8, 4, 2, shl); s.hline(5, 19, 13, shd)
    for x in (9, 15): s.vline(x, 3, 6, shd); s.ellipse(x, 3, 1.5, 1.5, '#ffffff'); s.px(x, 3, '#000000')
    cy = 5 if snap else 7
    for side in (-1, 1):
        cx = 12 + side * 10; s.ellipse(cx, cy, 3, 3, sh); s.px(cx + side, cy - 2 - (1 if snap else 0), '#ffffff')
        if snap: s.line(cx, cy - 1, cx + side * 2, cy - 4, sh)
        for k in range(3): s.line(12 + side * (3 + k * 2), 13, 12 + side * (5 + k * 2), 15 - ((k + f) % 2), shd)
    s.outline('#3a0e04'); return s
E.add('crab0', crab(0)); E.add('crab1', crab(1)); E.add('crab_snap', crab(0, True))
add_area_enemies(E)
add_v05_enemies(E); add_v051_enemies(E); add_v06_enemies(E)
E.save()

# =====================================================================
#  BOSS: 呪いのシャンデリア GRAND LUMIERE  (anchor: top-centre = chain attach point)
# =====================================================================
BO = Atlas('boss', 512)
def chandelier(lit=True, cracked=False):
    W, H = 128, 84; s = Spr(W, H); cx = W // 2
    # top crown
    s.rect(cx - 3, 0, 6, 8, GOLD); s.vline(cx - 2, 0, 7, GOLDH)
    s.ellipse(cx, 12, 10, 6, GOLD); s.ellipse(cx - 2, 10, 6, 3, GOLDH)
    # main ring (ellipse seen slightly from below)
    for k in range(400):
        a = k / 400 * 2 * math.pi
        x = cx + math.cos(a) * 56; y = 40 + math.sin(a) * 9
        s.px(x, y, GOLD if math.sin(a) > 0 else GOLDL); s.px(x, y + 1, GOLDL); s.px(x, y + 2, GOLDD if math.sin(a) > 0 else GOLDL)
    # arms
    for k, ax in enumerate([-50, -30, -12, 12, 30, 50]):
        for t in range(41):
            u = t / 40; x = cx + ax * u; y = 16 + 22 * u - 10 * math.sin(u * math.pi)
            s.px(x, y, GOLD); s.px(x, y + 1, GOLDL)
    # crystal strands hanging
    for x in range(cx - 52, cx + 53, 6):
        y0 = 42 + int(9 * math.sqrt(max(0, 1 - ((x - cx) / 56) ** 2)))
        ln = 8 + (abs(x - cx) // 6) % 3 * 3
        for y in range(y0, y0 + ln):
            s.px(x, y, '#c8ecff' if (y - y0) % 3 else '#ffffff')
        s.ellipse(x, y0 + ln + 1, 1.5, 2, '#a8dcff'); s.px(x, y0 + ln, '#ffffff')
    # candles on ring
    for ax in [-56, -40, -22, 22, 40, 56]:
        x = cx + ax; y = 40 + int(-9 * math.sqrt(max(0, 1 - (ax / 56) ** 2)) * .0)
        s.rect(x - 2, y - 10, 4, 10, '#f0e8d8'); s.vline(x - 2, y - 10, y - 1, '#ffffff'); s.rect(x - 4, y - 1, 8, 3, GOLD); s.hline(x - 4, x + 3, y - 1, GOLDH)
    # central glass globe (the core sits inside; drawn separately)
    for y in range(22, 62):
        for x in range(cx - 18, cx + 19):
            d = ((x + .5 - cx) / 17) ** 2 + ((y + .5 - 42) / 19) ** 2
            if d < 1:
                c = (120, 170, 230, 110) if d < .8 else (200, 230, 255, 200)
                s.px(x, y, c)
    s.line(cx - 10, 28, cx - 13, 40, (255, 255, 255, 200)); s.line(cx - 9, 30, cx - 11, 37, (255, 255, 255, 160))
    s.ellipse(cx, 63, 6, 3, GOLD); s.rect(cx - 2, 64, 4, 8, GOLDL); s.ellipse(cx, 74, 3, 3, '#a8dcff'); s.px(cx - 1, 73, '#ffffff')
    if cracked:
        for (a, b, c, d) in [(cx - 8, 26, cx - 2, 38), (cx - 2, 38, cx + 6, 34), (cx + 6, 34, cx + 12, 46), (cx - 2, 38, cx - 6, 52)]:
            s.line(a, b, c, d, (255, 255, 255, 255))
    s.outline('#2a1a08')
    return s
BO.add('chandelier', chandelier(), ax=64, ay=0)
BO.add('chandelier_cracked', chandelier(cracked=True), ax=64, ay=0)
def core(mood):
    s = Spr(30, 30); cx, cy = 15, 14
    for y in range(30):
        for x in range(30):
            dx, dy = x + .5 - cx, y + .5 - cy
            if dx * dx + dy * dy < 121 or (dy > 0 and abs(dx) < 11 - dy * .3 and y < 28 - (2 if (x // 3) % 2 else 0)):
                d = math.hypot(dx + 3, dy + 3) / 15
                s.px(x, y, '#fff6d0' if d < .35 else ('#ffd070' if d < .7 else '#e0903a'))
    if mood == 'normal':
        s.rect(9, 11, 3, 4, '#3a1000'); s.rect(18, 11, 3, 4, '#3a1000'); s.px(9, 11, '#ffffff'); s.px(18, 11, '#ffffff')
        s.ellipse(15, 20, 3, 2, '#3a1000')
    elif mood == 'angry':
        s.line(8, 9, 12, 12, '#3a1000'); s.line(22, 9, 18, 12, '#3a1000'); s.rect(9, 12, 3, 2, '#ff2020'); s.rect(18, 12, 3, 2, '#ff2020')
        for x in range(10, 21): s.px(x, 19 + (x % 2), '#3a1000')
    elif mood == 'tug':
        s.line(8, 12, 12, 14, '#3a1000'); s.line(8, 16, 12, 14, '#3a1000'); s.line(22, 12, 18, 14, '#3a1000'); s.line(22, 16, 18, 14, '#3a1000')
        s.ellipse(15, 21, 3.5, 4, '#3a1000'); s.px(15, 22, '#ff6a6a')
    elif mood == 'dizzy':
        for (ox) in (10, 19):
            for k in range(12): a = k / 12 * 6.28; s.px(ox + math.cos(a) * (1 + k / 6), 13 + math.sin(a) * (1 + k / 6), '#3a1000')
        s.ellipse(15, 21, 2, 1.5, '#3a1000')
    s.outline('#5a2a00'); return s
for m in ('normal', 'angry', 'tug', 'dizzy'): BO.add('core_' + m, core(m))
s = Spr(6, 10); s.rect(1, 0, 4, 10, GOLD); s.rect(2, 1, 2, 8, GOLDD); s.vline(1, 0, 9, GOLDH); s.outline('#2a1a08'); BO.add('chain', s)
# ---- v0.2 bosses -----------------------------------------------------
def tinted_core(mood, c1, c2, c3, edge):
    s = core(mood)
    def f(x, y, c):
        k = (int(c[0]) + int(c[1]) + int(c[2])) / 765
        if (c[0], c[1], c[2]) in ((0x3a, 0x10, 0), (0x5a, 0x2a, 0), (255, 255, 255), (255, 32, 32), (255, 0x6a, 0x6a)): 
            return edge if tuple(c[:3]) == (0x5a, 0x2a, 0) else None
        return c1 if k > .85 else c2 if k > .6 else c3
    s.shade_mask(f); return s
for pre, cols in (('gcore', ('#ffffff', '#c8e4ff', '#7ab0e8', '#2a4a7a')), ('rcore', ('#fff0f4', '#ff9ac0', '#d84a7a', '#5a0a2a')), ('ccore', ('#fff8d0', '#f0d070', '#b88a2a', '#4a3008'))):
    for m in ('tug', 'dizzy'): BO.add(pre + '_' + m, tinted_core(m, *cols))
# LINEN GOLEM: a heap of laundry with sleeves for arms (anchor bottom-centre)
def golem(pose='idle', f=0):
    W, H = 72, 84; s = Spr(W, H); cx = W // 2
    cols = ['#e8eef8', '#c8d8f0', '#f0d8e0', '#d8f0e0', '#f8f0d8', '#b8c8e0']
    top = {'idle': 18 + f, 'raise': 10, 'slam': 26, 'puff': 16, 'dizzy': 24}[pose]
    for y in range(top, H):
        t = (y - top) / (H - top); hw = 14 + 20 * math.sin(min(1, t * 1.25) * math.pi / 2)
        for x in range(W):
            dx = x + .5 - cx
            if abs(dx) < hw:
                band = int((y + dx * .35 + f * 2) // 7) % len(cols); c = cols[band]
                if (x + y) % 9 == 0: c = lerp(c, '#000000', .12)
                if dx > hw * .45: c = lerp(c, '#3a4a6a', .3)
                s.px(x, y, c)
    # sock + towel details
    s.rect(cx - 30, H - 14, 8, 10, '#c84a5a'); s.hline(cx - 30, cx - 23, H - 14, '#ffffff'); s.rect(cx + 18, top + 22, 12, 4, '#4a8ac8')
    # arms (sleeves)
    arm = {'idle': (-8, 30), 'raise': (-26, -20), 'slam': (30, 40), 'puff': (-4, 10), 'dizzy': (20, 30)}[pose]
    for side in (-1, 1):
        ax0 = cx + side * 26; ay0 = top + 20
        ax1 = ax0 + side * 10; ay1 = ay0 + arm[1] if pose != 'raise' else top - 6
        if pose == 'raise': ax1 = ax0 + side * 4
        for k in range(5): s.line(ax0 + k - 2, ay0, ax1 + k - 2, ay1, '#f0e8f8' if side < 0 else '#c8d0e8')
        s.ellipse(ax1, ay1, 5, 4, '#f8f0d8')
    # face: two buttons and a laundry-bag mouth
    ey = top + 14
    if pose == 'dizzy':
        for ox in (-8, 8):
            for k in range(10): a = k / 10 * 6.28; s.px(cx + ox + math.cos(a) * (1 + k / 5), ey + math.sin(a) * (1 + k / 5), '#1a2a4a')
    else:
        for ox in (-8, 8): s.ellipse(cx + ox, ey, 3, 3, '#2a3a5a'); s.px(cx + ox - 1, ey - 1, '#ffffff')
        if pose in ('raise', 'slam'): s.line(cx - 12, ey - 6, cx - 5, ey - 3, '#1a2a4a'); s.line(cx + 12, ey - 6, cx + 5, ey - 3, '#1a2a4a')
    if pose == 'puff': s.ellipse(cx, ey + 10, 5, 4, '#1a2a4a'); s.ellipse(cx, ey + 10, 3, 2, '#5a6a9a')
    else: s.hline(cx - 6, cx + 6, ey + 9, '#1a2a4a'); s.px(cx - 7, ey + 8, '#1a2a4a'); s.px(cx + 7, ey + 8, '#1a2a4a')
    # soap suds on top
    for k in range(5): s.ellipse(cx - 14 + k * 7, top + (k % 2), 4, 3, (240, 250, 255, 230))
    s.outline('#1a2440'); return s
BO.add('golem_idle0', golem('idle', 0)); BO.add('golem_idle1', golem('idle', 1)); BO.add('golem_raise', golem('raise')); BO.add('golem_slam', golem('slam'))
BO.add('golem_puff', golem('puff')); BO.add('golem_dizzy', golem('dizzy'))
for f in range(4):
    s = Spr(46, 46); cx = cy = 23; cols = ['#e8eef8', '#c8d8f0', '#f0d8e0', '#d8f0e0']
    for y in range(46):
        for x in range(46):
            dx, dy = x + .5 - cx, y + .5 - cy; d = math.hypot(dx, dy)
            if d < 22:
                a = math.atan2(dy, dx) + f * math.pi / 8
                c = cols[int((a + math.pi) / (2 * math.pi) * 8 + d / 7) % 4]
                if dx + dy > 14: c = lerp(c, '#3a4a6a', .3)
                s.px(x, y, c)
    a = f * math.pi / 8; s.rect(cx + math.cos(a) * 12 - 3, cy + math.sin(a) * 12 - 3, 6, 6, '#c84a5a')
    s.outline('#1a2440'); BO.add('golem_ball%d' % f, s)
# MADAME ROSE: a giant rose on a thorny stem
def rose_stem():
    W, H = 60, 112; s = Spr(W, H); cx = W // 2
    for y in range(H):
        x = cx + 3 * math.sin(y * .06); 
        for k in range(-3, 4): s.px(x + k, y, '#2e6a2a' if k < 1 else '#1e4a1e')
        if y % 13 == 5: s.line(x + 3, y, x + 7, y - 3, '#c8e0a0'); s.line(x - 3, y + 6, x - 7, y + 3, '#c8e0a0')
    for (ly, side) in ((70, -1), (46, 1), (86, 1)):
        for k in range(16):
            for w in range(-int(4 * math.sin(k / 16 * math.pi)), int(4 * math.sin(k / 16 * math.pi)) + 1):
                s.px(cx + side * (3 + k), ly - k * .5 + w, '#3e8a36' if w <= 0 else '#2a6a28')
    for x in range(W):  # roots
        if abs(x - cx) < 26: s.px(x, H - 1 - (abs(x - cx) % 5 == 0), '#3a2a1a')
    s.outline('#0a160a'); return s
BO.add('rose_stem', rose_stem())
def rose_head(mood):
    W, H = 64, 58; s = Spr(W, H); cx, cy = 32, 30
    pet = {'head': ('#e83a5a', '#b81a3a', '#ff7a9a'), 'rage': ('#c81a2a', '#8a0a1a', '#ff4a4a'), 'bloom': ('#ff6a9a', '#d83a6a', '#ffc0d8'), 'wilt': ('#9a5a6a', '#6a3a48', '#b88a98')}[mood]
    rr = 27 if mood != 'wilt' else 22
    for y in range(H):
        for x in range(W):
            dx, dy = x + .5 - cx, y + .5 - cy; d = math.hypot(dx, dy); a = math.atan2(dy, dx)
            edge = rr + 3 * math.cos(a * 7)
            if mood == 'bloom': edge = rr + 5 * math.cos(a * 9)
            if d < edge:
                ring = int(d / 6 + (a + math.pi) * 1.3) % 3
                s.px(x, y, pet[ring] if d > 10 else pet[1])
    # face in the centre
    if mood == 'wilt':
        for ox in (-6, 6):
            for k in range(10): a = k / 10 * 6.28; s.px(cx + ox + math.cos(a) * (1 + k / 5), cy + math.sin(a) * (1 + k / 5), '#2a0a14')
        s.ellipse(cx, cy + 8, 3, 2, '#2a0a14')
    else:
        s.ellipse(cx, cy, 11, 10, pet[1])
        for ox in (-5, 5): s.rect(cx + ox - 1, cy - 3, 3, 4, '#1a0a10'); s.px(cx + ox - 1, cy - 3, '#ffffff' if mood != 'rage' else '#ffe040')
        if mood == 'rage': s.line(cx - 9, cy - 7, cx - 3, cy - 4, '#1a0a10'); s.line(cx + 9, cy - 7, cx + 3, cy - 4, '#1a0a10')
        if mood == 'bloom': s.ellipse(cx, cy + 6, 4, 4, '#1a0a10'); s.ellipse(cx, cy + 6, 2, 2, '#ffe080')
        else: 
            for x in range(cx - 4, cx + 5): s.px(x, cy + 6 + (x % 2 if mood == 'rage' else 0), '#1a0a10')
        # lipstick + beauty mark: a "madame"
        s.px(cx + 7, cy + 4, '#1a0a10')
    for k in range(4): s.ellipse(cx - 20 + k * 13, H - 6, 6, 3, '#2e6a2a')  # sepals
    s.outline('#2a0610'); return s
for m in ('head', 'rage', 'bloom', 'wilt'): BO.add('rose_' + m, rose_head(m))
s = Spr(40, 12)
for x in range(40):
    hgt = int(8 * math.sin((x + .5) / 40 * math.pi)) + 2
    for y in range(12 - hgt, 12): s.px(x, y, '#4a3020' if (x + y) % 4 else '#6a4a30')
for k in range(4): s.line(6 + k * 9, 6, 8 + k * 9, 1, '#3e8a36')
s.outline('#1a0e08'); BO.add('rose_mound', s)
# GRANDFATHER CLOCK: anchored bottom-centre, face centre at 96px above floor
def clockbody(mood):
    W, H = 76, 156; s = Spr(W, H); cx = W // 2
    wood, woodh, woodl = ('#5a2e1e', '#8a4a30', '#3a1a10') if mood != 'rage' else ('#5a1a1a', '#8a2a2a', '#3a0a0a')
    s.rect(6, H - 12, W - 12, 12, woodl); s.rect(4, H - 14, W - 8, 3, wood); s.hline(4, W - 5, H - 14, woodh)
    s.rect(14, 40, W - 28, H - 54, wood); s.vline(15, 40, H - 15, woodh); s.vline(W - 15, 40, H - 15, woodl)
    # trunk window (inner pendulum drawn in code)
    s.rect(24, H - 72, W - 48, 44, '#1a0c08'); s.rect(25, H - 71, W - 50, 42, (60, 80, 110, 180)); s.line(27, H - 69, 34, H - 50, (220, 240, 255, 120))
    # hood
    s.rect(6, 20, W - 12, 44, wood); s.hline(6, W - 7, 20, woodh); s.vline(6, 20, 63, woodh)
    for y in range(0, 22):
        hw = 14 + y * 1.3
        s.hline(cx - hw, cx + hw, y, wood if y % 6 else woodh)
    s.ellipse(cx, 6, 6, 6, GOLD); s.ellipse(cx - 2, 4, 2, 2, GOLDH)
    for side in (-1, 1): s.ellipse(cx + side * 26, 14, 3, 3, GOLD)
    # face (centre 96 above the bottom -> y = H - 96)
    fy = H - 96
    s.ellipse(cx, fy, 21, 21, GOLD); s.ellipse(cx, fy, 19, 19, GOLDL); s.ellipse(cx, fy, 17, 17, '#f4ecd8' if mood != 'stop' else '#d8d0c0')
    for k in range(12):
        a = k / 12 * 2 * math.pi; s.rect(cx + math.sin(a) * 14 - 1, fy - math.cos(a) * 14 - 1, 2, 2, '#2a1a10')
    if mood == 'rage':
        s.line(cx - 10, fy - 9, cx - 4, fy - 5, '#c01010'); s.line(cx + 10, fy - 9, cx + 4, fy - 5, '#c01010'); s.rect(cx - 8, fy - 4, 3, 3, '#ff2020'); s.rect(cx + 5, fy - 4, 3, 3, '#ff2020')
    elif mood == 'stop':
        for ox in (-7, 7):
            for k in range(10): a = k / 10 * 6.28; s.px(cx + ox + math.cos(a) * (1 + k / 5), fy - 3 + math.sin(a) * (1 + k / 5), '#2a1a10')
    else:
        for ox in (-7, 7): s.rect(cx + ox - 1, fy - 5, 3, 4, '#2a1a10')
    s.hline(cx - 5, cx + 5, fy + 9, '#2a1a10')
    for side in (-1, 1):  # side columns
        s.rect(cx + side * 30 - 2, 24, 4, 38, GOLDL); s.vline(cx + side * 30 - 2, 24, 61, GOLDH)
    s.outline('#140804'); return s
BO.add('clock_body', clockbody('normal')); BO.add('clock_rage', clockbody('rage')); BO.add('clock_stop', clockbody('stop'))
s = Spr(32, 32); s.ellipse(16, 16, 15, 15, GOLDL); s.ellipse(16, 16, 13, 13, GOLD); s.ellipse(12, 12, 5, 5, GOLDH); s.ellipse(16, 16, 4, 4, GOLDD); s.outline('#2a1a08'); BO.add('pend_bob', s)
# ---- v0.3 bosses -------------------------------------------------------
for pre, cols in (('ocore', ('#f8f0ff', '#d8b8ff', '#9a6ad8', '#3a1a6a')), ('dcore', ('#fffbe0', '#ffe070', '#e8a020', '#5a3a08'))):
    for m in ('tug', 'dizzy'): BO.add(pre + '_' + m, tinted_core(m, *cols))
# CURSED PIPE ORGAN (チャペルの呪いオルガン): a huge organ with a face in the console, pipes as a crown
def organ(mood):
    W, H = 132, 128; s = Spr(W, H); cx = W // 2
    wood, woodh, woodl = ('#4a2438', '#6a3a54', '#2a1020') if mood != 'rage' else ('#5a1428', '#8a2440', '#300810')
    if mood == 'stop': wood, woodh, woodl = '#3a3040', '#504458', '#1e1824'
    for k in range(13):  # pipes
        x = 6 + k * 9; h = 40 + int(34 * math.sin((k + .5) / 13 * math.pi)); y0 = 70 - h
        pc, ph, pl = ('#c8b088', '#f0e0b8', '#8a7048') if mood != 'rage' else ('#d89070', '#ffc0a0', '#8a4a30')
        s.rect(x, y0, 7, h + 6, pc); s.vline(x, y0, y0 + h + 5, ph); s.vline(x + 6, y0, y0 + h + 5, pl); s.rect(x + 2, y0 + h - 14, 3, 4, '#1a0a10'); s.hline(x - 1, x + 7, y0, ph)
    s.rect(8, 64, W - 16, H - 64, wood); s.hline(8, W - 9, 64, woodh); s.vline(8, 64, H - 1, woodh); s.vline(W - 9, 64, H - 1, woodl)
    s.rect(4, 60, W - 8, 6, woodl); s.hline(4, W - 5, 60, GOLD)
    # face: two rose windows as eyes, keyboard as teeth
    ey = 84
    for ox in (-24, 24):
        s.ellipse(cx + ox, ey, 11, 9, '#140810')
        if mood == 'stop':
            for k in range(12): a = k / 12 * 6.28; s.px(cx + ox + math.cos(a) * (1 + k / 3), ey + math.sin(a) * (1 + k / 3), '#d8b8ff')
        else:
            ic = '#ff4a6a' if mood == 'rage' else '#c8a0ff'
            s.ellipse(cx + ox, ey, 6, 5, ic); s.ellipse(cx + ox - 2, ey - 2, 2, 2, '#ffffff')
            if mood == 'rage': s.line(cx + ox - 12, ey - 13 + (0 if ox < 0 else 6), cx + ox + 10, ey - 13 + (6 if ox < 0 else 0), '#140810')
    ky = 104
    s.rect(cx - 40, ky, 80, 14, '#140810')
    for x in range(cx - 38, cx + 38, 5): s.rect(x, ky + 1, 4, 11 if mood != 'sing' else 8, '#f4ecdc')
    for x in range(cx - 36, cx + 34, 10): s.rect(x + 2, ky + 1, 3, 6, '#1a1014')
    if mood == 'sing': s.rect(cx - 40, ky + 10, 80, 6, '#3a0a1a')
    s.rect(cx - 50, H - 8, 100, 8, woodl); s.hline(cx - 50, cx + 49, H - 8, woodh)
    for x in (cx - 46, cx + 46): s.ellipse(x, 70, 4, 4, GOLD)
    s.outline('#120610'); return s
for m in ('idle', 'sing', 'rage', 'stop'): BO.add('organ_' + m, organ(m))
s = Spr(12, 12); s.ellipse(4, 9, 3.5, 2.5, '#d8b8ff'); s.vline(7, 1, 9, '#d8b8ff'); s.line(7, 1, 11, 4, '#d8b8ff'); s.ellipse(4, 8, 1.5, 1, '#ffffff'); s.outline('#3a1a6a'); BO.add('note', s)
# BATHWATER SERPENT (大浴場の主 ユブネ): a serpent made of hot water and soap, with a towel turban
def serp_head(mood):
    W, H = 56, 48; s = Spr(W, H); cx, cy = 26, 26
    wc, wh, wl = ('#5ac8e0', '#b8f0ff', '#2a7ab0') if mood != 'rage' else ('#e86a5a', '#ffb8a0', '#a83a3a')
    if mood == 'dizzy': wc, wh, wl = '#7ab0c0', '#c8e0e8', '#4a7a8a'
    for y in range(H):
        for x in range(W):
            dx, dy = (x + .5 - cx) / 22, (y + .5 - cy) / 16
            if dx * dx + dy * dy < 1: s.px(x, y, wh if dy < -.4 and dx < .2 else wl if dy > .5 else wc)
    for x in range(W - 12, W):  # snout
        for y in range(cy - 4, cy + 8): s.px(x - 10, y, wc)
    s.rect(8, 6, 30, 9, '#ffffff'); s.hline(8, 37, 6, '#f0f0f0'); s.hline(8, 37, 14, '#c8c8d8'); s.ellipse(38, 9, 5, 5, '#ffffff'); s.px(38, 9, '#c8c8d8')  # towel turban
    if mood == 'dizzy':
        for ox in (0, 12):
            for k in range(10): a = k / 10 * 6.28; s.px(30 + ox + math.cos(a) * (1 + k / 5), 22 + math.sin(a) * (1 + k / 5), '#14303a')
    else:
        for ox in (0, 12): s.ellipse(30 + ox, 22, 3, 3.5, '#14303a'); s.px(29 + ox, 21, '#ffffff')
        if mood == 'rage': s.line(26, 16, 33, 19, '#14303a'); s.line(46, 16, 39, 19, '#14303a')
    if mood == 'spit': s.ellipse(44, 33, 6, 5, '#14303a'); s.ellipse(44, 33, 4, 3, '#2a7ab0')
    else: s.hline(34, 48, 33, '#14303a')
    s.outline('#0a2030'); return s
for m in ('head', 'spit', 'rage', 'dizzy'): BO.add('serp_' + m, serp_head(m))
s = Spr(30, 30)
for y in range(30):
    for x in range(30):
        d = math.hypot(x + .5 - 15, y + .5 - 15)
        if d < 14: s.px(x, y, '#b8f0ff' if d < 6 and x < 15 else '#5ac8e0' if d < 11 else '#2a7ab0')
s.ellipse(10, 9, 3, 2, (255, 255, 255, 220)); s.outline('#0a2030'); BO.add('serp_seg', s)
s = Spr(30, 30)
for y in range(30):
    for x in range(30):
        d = math.hypot(x + .5 - 15, y + .5 - 15)
        if d < 14: s.px(x, y, '#ffb8a0' if d < 6 and x < 15 else '#e86a5a' if d < 11 else '#a83a3a')
s.outline('#3a0a0a'); BO.add('serp_seg_r', s)
s = Spr(44, 12)
for x in range(44):
    hh = int(5 + 4 * math.sin((x + .5) / 44 * math.pi))
    for y in range(12 - hh, 12): s.px(x, y, '#8ad8f0' if y > 12 - hh + 1 else '#ffffff')
s.outline('#1a4a5a'); BO.add('splashring', s)
add_area_boss(BO)
# v0.4: Chronoa's eye core (teal) for the tug-of-war
for m in ('tug', 'dizzy'): BO.add('ecore_' + m, tinted_core(m, '#f0fffc', '#9ae8dc', '#2a9a90', '#0e3a38'))
add_v05_boss(BO); add_v051_boss(BO); add_v06_boss(BO)
BO.save()

# =====================================================================
#  TITLE BACKGROUND 384x288
# =====================================================================
W, H = 384, 288
t = Spr(W, H)
for y in range(H):
    for x in range(W):
        k = y / H; c = lerp('#0a0818', '#2a1a48', k)
        if dith(x, y, (k * 3) % 1) and k < .66: c = lerp('#0a0818', '#2a1a48', min(1, k + .06))
        t.px(x, y, c)
random.seed(3)
for i in range(120):
    x, y = random.randrange(W), random.randrange(int(H * .6)); t.px(x, y, (255, 255, 255, random.randint(80, 255)))
# moon
for y in range(H):
    for x in range(W):
        d = math.hypot(x - 290, y - 70)
        if d < 34: t.px(x, y, lerp('#fffbe8', '#d8dcf0', d / 34))
        elif d < 60: t.px(x, y, (200, 210, 255, int(50 * (1 - (d - 34) / 26))))
t.ellipse(280, 62, 5, 4, '#d0d4e8'); t.ellipse(298, 80, 7, 5, '#d0d4e8'); t.ellipse(300, 56, 3, 3, '#d8dcec')
# clouds
for cy, cx0, ln in [(95, 200, 140), (110, 250, 120), (40, 40, 90)]:
    for x in range(cx0, cx0 + ln):
        hh = int(4 + 3 * math.sin(x * .15) + 2 * math.sin(x * .41))
        for y in range(cy - hh, cy + 2): t.px(x, y, (60, 50, 110, 170))
# hill + mansion silhouette
for x in range(W):
    hy = int(230 - 30 * math.exp(-((x - 170) / 120) ** 2) + 4 * math.sin(x * .05))
    for y in range(hy, H): t.px(x, y, '#0c0a16')
M = '#100c1c'; L = '#ffd27a'
def bld(x, y, w, h, roof=0, winrows=0):
    t.rect(x, y, w, h, M)
    if roof:
        for k in range(roof): t.hline(x - 2 + k, x + w + 1 - k, y - 1 - k, M)
    for r in range(winrows):
        for wx in range(x + 4, x + w - 4, 9):
            if random.random() < .45: t.rect(wx, y + 8 + r * 16, 3, 6, L if random.random() < .7 else '#7ab0ff')
            else: t.rect(wx, y + 8 + r * 16, 3, 6, '#1e1830')
bld(80, 150, 180, 70, 0, 4)
bld(120, 110, 100, 50, 22, 2)
bld(60, 130, 36, 90, 16, 5); bld(244, 120, 36, 100, 16, 5)
t.rect(165, 70, 10, 50, M); 
for k in range(30): t.hline(170 - k // 3, 170 + k // 3, 50 + k, M)
t.rect(160, 180, 20, 40, '#1e1830'); t.rect(162, 182, 16, 38, '#ffb84a'); t.vline(170, 182, 219, M)
# dead trees
def tree(x0, y0, h, d):
    t.vline(x0, y0 - h, y0, M); t.vline(x0 + 1, y0 - h + 4, y0, M)
    for k in range(4):
        yy = y0 - h + 6 + k * h // 5; ln = 10 + k * 3
        t.line(x0, yy, x0 + d * ln, yy - ln // 2, M); t.line(x0 + d * ln, yy - ln // 2, x0 + d * ln + d * 4, yy - ln // 2 - 6, M)
        t.line(x0, yy + 3, x0 - d * ln // 2, yy - ln // 3, M)
tree(26, 232, 80, 1); tree(352, 236, 90, -1)
t.img().save(os.path.join(A, 'title_bg.png'))
print('title_bg', (W, H))

# v0.4 characters (Chronoa, Vel, portraits, the clock-eye mimic)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_chars.py'), encoding='utf-8').read())
