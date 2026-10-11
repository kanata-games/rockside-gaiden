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
                         'cellar': ('#3c3a40', '#55525a', '#2a282e', '#18171b')}[theme]
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
    if top:
        s.rect(0, 0, 16, 5, '#6e4a36'); s.hline(0, 15, 0, '#b88758'); s.hline(0, 15, 1, '#8c6044')
        for xx in range(0, 16, 6): s.vline((xx + variant * 3) % 16, 1, 4, '#4f3326')
        s.hline(0, 15, 5, '#1a1420'); s.hline(0, 15, 6, '#2a2236')
    return s
T.add('brick0', brick(0)); T.add('brick1', brick(1)); T.add('top0', brick(0, True)); T.add('top1', brick(1, True))
T.add('secret', brick(0, crack=True))
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
    s.rect(0, 0, 32, 24, wood); s.hline(0, 31, 0, woodh); s.hline(0, 31, 1, '#c9a24a' if name in ('ballroom', 'vault', 'foyer') else woodh); s.hline(0, 31, 3, woodl)
    for x0 in (2, 18):
        s.rect(x0, 6, 12, 14, woodl); s.rect(x0 + 1, 7, 10, 12, wood); s.hline(x0 + 1, x0 + 11, 7, woodh); s.vline(x0 + 1, 7, 18, woodh)
    s.hline(0, 31, 22, woodl); s.hline(0, 31, 23, '#0e0a10')
    B.add('wain_' + name, s)
    # pillar
    s = Spr(16, 32)
    pc, ph, pl = ('#4a4058', '#6a5e80', '#2c2638') if name not in ('library', 'cellar') else ('#4a3426', '#6a4c36', '#2a1c14')
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
P.add('barrel', barrel())
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
for f in range(4): E.add('puff%d' % f, ghost(f))
E.add('puff_tug', ghost(1, 'tug')); E.add('puff_angry', ghost(2, 'angry'))
DCOL = ('#f0d0ff', '#c098e8', '#7a52b8')
for f in range(3): 
    s = ghost(f, 'normal', DCOL, 30)
    # chef / butler: bow tie + white gloves holding a plate stack
    s.rect(12, 21, 6, 2, '#2a1440'); s.px(14, 21, '#ff5a7a'); s.px(15, 21, '#ff5a7a')
    E.add('dish%d' % f, s)
E.add('dish_throw', ghost(1, 'angry', DCOL, 30)); E.add('dish_tug', ghost(1, 'tug', DCOL, 30))
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
