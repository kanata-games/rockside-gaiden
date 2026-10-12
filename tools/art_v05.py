# =====================================================================
#  v0.5 EXPANSION art (exec'd from make_art.py; the add_v05_* functions are called just before each atlas is saved)
#    古酒の大貯蔵庫 OLD VINTAGE VAULTS : casks, grapevines | cork bat, grape wisp | boss 樽蜘蛛 バレルタラント
#    騎士の武具庫 HALL OF KNIGHTS       : weapon racks, banners, forge | squire, griffin | boss 空っぽの騎士団長 アイアンホロウ
# =====================================================================
WINE, WINEH, WINEL = '#7a1a3a', '#b83a5a', '#4a0a20'
OAK, OAKH, OAKL = '#6a4426', '#9a6a3e', '#3e2614'
STEEL, STEELH, STEELL = '#8a94a8', '#d0d8e8', '#4a5264'

def cask(w, h, tap=True):
    s = Spr(w, h)
    for y in range(h):
        bulge = math.sin((y + .5) / h * math.pi)
        hw = w / 2 * (.82 + .18 * bulge)
        for x in range(int(w / 2 - hw), int(w / 2 + hw) + 1):
            k = (x - w / 2) / hw
            s.px(x, y, OAKH if k < -.45 else OAKL if k > .55 else OAK)
    for yy in (3, h // 2 - 2, h - 5):
        s.hline(0, w - 1, yy, '#2a2a30'); s.hline(0, w - 1, yy + 1, '#5a5a66')
    for x in range(4, w - 4, 6): s.vline(x, 0, h - 1, (40, 24, 12, 120))
    if tap: s.rect(w // 2 - 2, h // 2 + 2, 4, 5, '#c9a24a'); s.px(w // 2, h // 2 + 8, WINEH)
    s.outline('#1a0e06'); return s

def add_v05_props(P):
    P.add('cask_big', cask(40, 44))
    s = Spr(72, 60)   # stack of three casks lying on their sides (end view)
    for (cx, cy) in ((18, 44), (54, 44), (36, 16)):
        s.ellipse(cx, cy, 16, 15, OAK); s.ellipse(cx, cy, 13, 12, OAKH); s.ellipse(cx, cy, 10, 9, OAK)
        for a in range(0, 360, 45): r = math.radians(a); s.line(cx, cy, cx + math.cos(r) * 10, cy + math.sin(r) * 9, OAKL)
        s.ellipse(cx, cy, 3, 3, '#c9a24a'); s.px(cx, cy + 4, WINEH)
    s.outline('#1a0e06'); P.add('caskstack', s)
    s = Spr(40, 26)   # hanging grapevine (top anchored)
    for x in range(40): s.px(x, 1 + int(math.sin(x * .4) * 1.5), '#3a5a2a'); s.px(x, 2 + int(math.sin(x * .4) * 1.5), '#24401a')
    for (gx, gy) in ((8, 6), (22, 9), (33, 5)):
        for k in range(9): s.ellipse(gx + (k % 3) * 3 - 3, gy + (k // 3) * 3 + (k % 3 == 1), 1.6, 1.6, '#5a2a7a' if k % 2 else '#7a3a9a')
        s.px(gx - 2, gy - 1, '#c8a0e8')
    for (lx, ly) in ((14, 4), (28, 3)): s.ellipse(lx, ly + 2, 4, 3, '#4a7a2a'); s.px(lx, ly + 1, '#7ab04a')
    s.outline('#140a10'); P.add('grapevine', s)
    s = Spr(28, 34)   # fermenting vat (open tub with purple foam)
    for y in range(8, 34):
        for x in range(2, 26): s.px(x, y, OAKH if x < 7 else OAKL if x > 21 else OAK)
    for yy in (12, 22, 31): s.hline(2, 25, yy, '#2a2a30')
    s.ellipse(14, 8, 12, 3, WINE); for_ = [s.ellipse(6 + k * 5, 6 + (k % 2), 2.5, 2, '#c87aa8') for k in range(4)]
    s.outline('#1a0e06'); P.add('vat', s)
    # ---- armory
    s = Spr(44, 50)   # weapon rack: spears, a sword, an axe
    s.rect(2, 44, 40, 5, OAKL); s.hline(2, 41, 44, OAKH); s.rect(2, 18, 40, 3, OAK); s.hline(2, 41, 18, OAKH)
    for x in (6, 14, 30, 38):
        s.vline(x, 4, 44, '#6a4a2a'); s.vline(x + 1, 4, 44, '#4a3018')
        s.line(x, 4, x - 2, 9, STEELH); s.line(x + 1, 0, x + 3, 6, STEEL); s.line(x, 0, x + 1, 0, STEELH)
    s.rect(21, 6, 3, 30, STEEL); s.vline(21, 6, 35, STEELH); s.rect(17, 34, 11, 2, '#c9a24a'); s.rect(21, 36, 3, 7, '#5a3a20')
    s.outline('#0e0c10'); P.add('weaponrack', s)
    s = Spr(26, 44)   # banner with a crest (top anchored)
    s.hline(0, 25, 0, '#c9a24a'); s.hline(0, 25, 1, '#8a6a2a')
    for y in range(2, 44):
        cut = 0 if y < 36 else abs(13 - 0) * 0 + (y - 36) * 1.6
        for x in range(3, 23):
            if abs(x - 12.5) < cut - 0: continue
            s.px(x, y, '#8a1a24' if (x // 3) % 2 else '#a8242e')
    s.ellipse(13, 18, 6, 7, '#c9a24a'); s.ellipse(13, 18, 4, 5, '#2a3a6a'); s.line(10, 15, 16, 21, '#e8e8f0'); s.line(16, 15, 10, 21, '#e8e8f0')
    s.outline('#1a0608'); P.add('banner', s)
    s = Spr(28, 60)   # knight statue on a plinth
    s.rect(2, 48, 24, 12, '#4a4a56'); s.hline(2, 25, 48, '#7a7a88'); s.hline(2, 25, 59, '#2a2a32')
    s.ellipse(14, 10, 6, 7, STEEL); s.rect(9, 9, 10, 2, '#1a1a22'); s.rect(13, 1, 2, 4, '#a8242e')
    s.rect(7, 17, 14, 16, STEEL); s.vline(8, 17, 32, STEELH); s.vline(19, 17, 32, STEELL); s.rect(8, 33, 5, 15, STEELL); s.rect(15, 33, 5, 15, STEELL)
    s.vline(23, 6, 46, STEELH); s.rect(21, 30, 5, 2, '#c9a24a')
    s.outline('#0e0c10'); P.add('knightstatue', s)
    s = Spr(44, 40)   # forge with glowing coals
    s.rect(2, 10, 40, 30, '#3a3436'); s.hline(2, 41, 10, '#6a6266')
    for y in range(14, 30):
        for x in range(8, 36):
            if ((x - 22) / 14) ** 2 + ((y - 24) / 10) ** 2 < 1: s.px(x, y, '#ffb040' if y > 24 else '#ff6a20' if y > 19 else '#8a2a10')
    s.rect(14, 0, 16, 10, '#2a2426'); s.outline('#0e0a0a'); P.add('forge', s)
    s = Spr(28, 18); s.rect(4, 0, 22, 6, '#4a4a56'); s.rect(0, 1, 6, 3, '#4a4a56'); s.hline(0, 25, 0, '#8a8a98'); s.rect(10, 6, 10, 6, '#3a3a44'); s.rect(6, 12, 18, 6, '#3a3a44'); s.outline('#0e0c10'); P.add('anvil', s)

def add_v05_items(I):
    for k, (c1, c2) in {'keyring': ('#ffe880', '#b88a1a'), 'cling': ('#c8f0ff', '#3a8ac8'), 'lantern': ('#ffd0a0', '#c86a1a')}.items():
        s = Spr(16, 16)
        for y in range(16):
            for x in range(16):
                d = math.hypot(x + .5 - 8, y + .5 - 8)
                if d < 7.5: s.px(x, y, lerp(c1, c2, min(1, math.hypot(x - 5, y - 5) / 9)))
        if k == 'keyring':
            for a in range(12): r = a / 12 * 6.28; s.px(7 + math.cos(r) * 3, 6 + math.sin(r) * 3, '#ffffff')
            s.vline(10, 8, 13, '#ffffff'); s.hline(10, 12, 11, '#ffffff'); s.hline(10, 12, 13, '#ffffff')
        elif k == 'cling':
            s.vline(11, 3, 12, '#ffffff'); s.vline(12, 3, 12, '#ffffff'); s.ellipse(7, 8, 3, 3, '#ffffff'); s.rect(4, 7, 3, 3, '#3a8ac8')
        else:
            s.rect(6, 5, 5, 7, '#ffffff'); s.rect(7, 6, 3, 5, '#ffb040'); s.hline(6, 10, 3, '#ffffff'); s.px(8, 2, '#ffffff')
        s.px(5, 4, '#ffffff'); s.outline('#14102a'); I.add('orb_' + k, s)
    s = Spr(10, 12); s.rect(2, 2, 6, 9, '#c8a070'); s.hline(2, 7, 2, '#e8c890'); s.vline(7, 3, 10, '#8a6a40'); s.outline('#3a2410'); I.add('cork', s)

def add_v05_enemies(E):
    def corkbat(f):   # bat skin: a winged cork
        s = Spr(20, 12); wing = WINE
        s.rect(7, 2, 6, 8, '#c8a070'); s.hline(7, 12, 2, '#e8c890'); s.px(8, 5, '#1a0a0a'); s.px(11, 5, '#1a0a0a')
        for x in range(0, 6):
            if f == 0: s.vline(x, 1 + x // 2, 6, wing); s.vline(19 - x, 1 + x // 2, 6, wing)
            else: s.vline(x, 6, 10 - x // 2, wing); s.vline(19 - x, 6, 10 - x // 2, wing)
        s.outline('#1a0608'); return s
    E.add('corkbat0', corkbat(0)); E.add('corkbat1', corkbat(1))
    s = Spr(12, 14); s.rect(3, 2, 6, 9, '#c8a070'); s.px(4, 7, '#1a0a0a'); s.px(7, 7, '#1a0a0a'); s.rect(2, 0, 8, 3, WINE); s.outline('#1a0608'); E.add('corkbat_hang', s)
    def grapewisp(f):   # skullwisp skin: a bunch of grapes with a sour face
        s = Spr(20, 22)
        for k in range(8): y = 14 + k; w = max(0, 4 - k * .5 + (1 if (k + f) % 2 else 0)); s.hline(10 - w, 10 + w, y, '#c87aff' if k % 3 else '#e8c8ff')
        for (gx, gy) in ((6, 5), (10, 4), (14, 5), (5, 9), (9, 9), (13, 9), (15, 11), (8, 13), (12, 13)):
            s.ellipse(gx, gy, 2.6, 2.6, '#6a2a8a'); s.px(gx - 1, gy - 1, '#b080d8')
        s.px(8, 8, '#ffffff'); s.px(12, 8, '#ffffff'); s.hline(9, 11, 11, '#1a0a1a'); s.vline(10, 0, 2, '#4a7a2a')
        s.outline('#1a0a1a'); return s
    E.add('grapewisp0', grapewisp(0)); E.add('grapewisp1', grapewisp(1))
    def squire(f, throw=False):   # skeleton skin: an empty little squire armour throwing daggers
        s = Spr(24, 42)
        s.ellipse(12, 9, 6, 7, STEEL); s.rect(7, 8, 10, 2, '#0e0c14'); s.px(9, 8, '#ff5050'); s.px(14, 8, '#ff5050'); s.rect(11, 0, 2, 4, '#a8242e')
        s.rect(6, 16, 12, 12, STEEL); s.vline(7, 16, 27, STEELH); s.vline(16, 16, 27, STEELL); s.rect(8, 18, 8, 8, '#a8242e'); s.ellipse(12, 22, 2, 2, '#c9a24a')
        s.rect(7, 28, 4, 12 + f, STEELL); s.rect(13, 28, 4, 13 - f, STEELL); s.rect(6, 40, 6, 2, '#2a2a32'); s.rect(13, 40, 6, 2, '#2a2a32')
        if throw: s.line(18, 18, 23, 8, STEEL); s.line(22, 7, 23, 3, STEELH)
        else: s.line(18, 18, 21, 26 - f, STEEL); s.line(6, 18, 3, 26 + f, STEEL)
        s.outline('#0e0c10'); return s
    E.add('squire0', squire(0)); E.add('squire1', squire(1)); E.add('squire_throw', squire(0, True))
    def griffin(mode, f=0):   # gargoyle skin: a stone griffin (eagle head, lion body)
        s = Spr(30, 28); st, sh, sl = ('#8a8278', '#b8b0a4', '#5a544c') if mode == 'stone' else ('#a8783a', '#e0b060', '#6a4a20')
        s.ellipse(15, 18, 9, 6, st); s.ellipse(22, 10, 5, 5, sh); s.line(26, 10, 29, 12, '#e8c860'); s.px(23, 9, '#1a0a0a' if mode == 'stone' else '#ff4040')
        if mode == 'stone': s.ellipse(10, 11, 6, 4, sl)
        elif mode == 'dive': s.line(14, 14, 2, 2, sh); s.line(16, 14, 8, 1, st)
        else:
            for x in range(4, 16): s.vline(x, 4 + (f * 6 if x < 10 else f * 3) - (x - 4) // 3, 13, st if x % 3 else sh)
        s.line(8, 23, 7, 27, sl); s.line(20, 23, 21, 27, sl); s.line(6, 18, 1, 22, sl)
        s.outline('#1a140c'); return s
    E.add('griffin_stone', griffin('stone')); E.add('griffin_fly0', griffin('fly', 0)); E.add('griffin_fly1', griffin('fly', 1)); E.add('griffin_dive', griffin('dive'))

def add_v05_boss(BO):
    # 樽蜘蛛 バレルタラント: a fat wine cask on corkscrew legs (legs are drawn in code). anchor centre, 72x60
    def tarant(mood):
        s = Spr(72, 60); w, h = 64, 52
        body = cask(w, h, tap=False); s.blit(body, 4, 4)
        if mood == 'open':   # lid popped: a hole full of dark wine
            s.ellipse(36, 10, 18, 6, '#1a0610'); s.ellipse(36, 10, 15, 4, WINEL)
        else:
            s.ellipse(36, 6, 18, 4, OAKH); s.ellipse(36, 6, 14, 2.5, OAK); s.rect(32, 0, 8, 6, '#c8a070'); s.hline(32, 39, 0, '#e8c890')
        eyes = [(24, 26), (32, 22), (40, 22), (48, 26), (28, 32), (44, 32)]
        for (ex, ey) in eyes:
            if mood == 'stun': s.line(ex - 2, ey - 2, ex + 2, ey + 2, '#1a0610'); s.line(ex + 2, ey - 2, ex - 2, ey + 2, '#1a0610')
            else: s.ellipse(ex, ey, 2.6, 2.6, '#ff3a6a' if mood == 'rage' else '#ffd84a'); s.px(ex, ey, '#1a0610')
        s.ellipse(36, 44, 9, 4, WINEL); s.hline(29, 43, 43, '#ffffff' if mood != 'stun' else WINEL)
        for x in range(30, 43, 3): s.vline(x, 44, 46, '#f0e8e0')
        s.outline('#140806'); return s
    for m in ('idle', 'rage', 'open', 'stun'): BO.add('tar_' + m, tarant(m))
    s = Spr(12, 14); s.rect(2, 1, 8, 12, '#c8a070'); s.hline(2, 9, 1, '#e8c890'); s.vline(9, 2, 12, '#8a6a40'); s.hline(2, 9, 12, WINEH); s.outline('#3a2410'); BO.add('corkshot', s)
    s = Spr(18, 14)
    for x in range(18):
        hh = int(5 + 5 * math.sin((x + .5) / 18 * math.pi))
        for y in range(14 - hh, 14): s.px(x, y, WINEH if y < 14 - hh + 2 else WINE)
    s.outline(WINEL); BO.add('winewave', s)
    for m in ('tug', 'dizzy'): BO.add('wcore_' + m, tinted_core(m, '#fff0f6', '#e88ab0', '#a82a5a', '#3a0a1a'))
    # 空っぽの騎士団長 アイアンホロウ: a towering empty plate armour with a greatsword (anchor bottom-centre, 72x104)
    def knight(pose):
        s = Spr(72, 104); cx = 36; lift = {'idle': 0, 'raise': 0, 'slash': 0, 'kneel': -18, 'leap': 4}[pose]
        for side in (-1, 1):   # legs
            s.rect(cx + side * 9 - 5, 66 - lift // 2, 10, 30 + lift // 2, STEEL); s.vline(cx + side * 9 - 4, 66, 95, STEELH)
            s.rect(cx + side * 9 - 6, 96, 13, 8, STEELL); s.hline(cx + side * 9 - 6, cx + side * 9 + 6, 96, STEEL)
        top = 30 - lift
        for y in range(top, top + 38):   # torso
            hw = 17 - (y - top) * .18
            for x in range(int(cx - hw), int(cx + hw) + 1): s.px(x, y, STEELH if x < cx - hw + 3 else STEELL if x > cx + hw - 4 else STEEL)
        s.rect(cx - 6, top + 6, 12, 22, '#a8242e'); s.ellipse(cx, top + 15, 4, 5, '#c9a24a'); s.ellipse(cx, top + 15, 2, 3, '#2a3a6a')
        s.rect(cx - 20, top + 34, 40, 6, '#5a3a20'); s.hline(cx - 20, cx + 19, top + 34, '#8a6a3a')   # belt + skirt
        for side in (-1, 1): s.ellipse(cx + side * 19, top + 4, 8, 6, STEEL); s.ellipse(cx + side * 18, top + 3, 5, 3, STEELH)   # pauldrons
        if pose != 'kneel':   # helmet with a red plume; the visor is a black slit (nobody inside)
            hy = top - 12; s.ellipse(cx, hy, 10, 12, STEEL); s.ellipse(cx - 3, hy - 3, 5, 6, STEELH); s.rect(cx - 8, hy - 1, 16, 3, '#06040a')
            for k in range(3): s.px(cx - 5 + k * 5, hy, '#6af0ff' if pose != 'idle' else '#4ab0c0')
            for y in range(hy - 22, hy - 8): s.hline(cx - 2 + (y % 3) - 1, cx + 2, y, '#c8283a')
        else:
            s.ellipse(cx, top - 2, 8, 3, '#06040a')   # empty neck hole
        # arms + greatsword
        if pose == 'raise':
            s.line(cx + 18, top + 6, cx + 26, top - 16, STEEL); s.rect(cx + 24, top - 70, 6, 56, STEELH); s.vline(cx + 26, top - 70, top - 16, '#ffffff'); s.rect(cx + 18, top - 16, 18, 4, '#c9a24a')
        elif pose == 'slash':
            s.line(cx + 18, top + 8, cx + 30, top + 26, STEEL); s.rect(cx + 28, top + 26, 8, 5, '#c9a24a')
            for i in range(30): s.px(cx + 34 + i, top + 30 + i * .9, STEELH); s.px(cx + 34 + i, top + 31 + i * .9, STEEL)
        elif pose == 'kneel':
            s.line(cx + 18, top + 8, cx + 24, top + 30, STEEL)
        else:
            s.line(cx + 18, top + 8, cx + 24, top + 30, STEEL); s.rect(cx + 22, top + 30, 5, 3, '#c9a24a'); s.rect(cx + 23, top + 33, 3, 40 - (8 if pose == 'leap' else 0), STEELH)
        s.line(cx - 18, top + 8, cx - 26, top + 30, STEEL); s.ellipse(cx - 30, top + 34, 9, 12, '#2a3a6a'); s.ellipse(cx - 30, top + 34, 6, 9, '#a8242e'); s.ellipse(cx - 30, top + 34, 2, 3, '#c9a24a')
        s.outline('#0a080e'); return s
    for p in ('idle', 'raise', 'slash', 'kneel', 'leap'): BO.add('kn_' + p, knight(p))
    s = Spr(24, 26); s.ellipse(12, 14, 10, 12, STEEL); s.ellipse(9, 11, 5, 6, STEELH); s.rect(4, 13, 16, 3, '#06040a')
    for y in range(0, 6): s.hline(10, 14, y, '#c8283a')
    s.outline('#0a080e'); BO.add('helm', s)
    s = Spr(14, 72); s.rect(5, 0, 4, 52, STEELH); s.vline(6, 0, 51, '#ffffff'); s.rect(1, 52, 12, 4, '#c9a24a'); s.rect(5, 56, 4, 14, '#5a3a20')
    s.px(7, 0, '#ffffff'); s.outline('#0a080e'); BO.add('greatsword', s)
    s = Spr(12, 64); s.vline(6, 14, 63, '#6a4a2a'); s.vline(5, 14, 63, '#8a6a3a')
    for y in range(0, 14): s.hline(6 - (y // 2) % 4, 6 + (3 if y < 8 else 0), y, STEEL)
    s.px(6, 0, '#ffffff'); s.outline('#0a080e'); BO.add('halberd', s)
    for m in ('tug', 'dizzy'): BO.add('acore_' + m, tinted_core(m, '#f0f8ff', '#a8d0f0', '#4a7ab0', '#0e2440'))
