# =====================================================================
#  v0.5.1 EXPANSION art (exec'd from make_art.py; add_v051_* are called just before each atlas is saved)
#    使用人の裏廊下 SERVANTS' QUARTERS : bell board, linen, bunks | dust maid, bell bat | boss 呼び鈴盤 リンガリング
#    地底の湖 UNDERGROUND LAKE         : stalagmites, glow moss | lake wisp, blind crab | boss 灯り鮟鱇 ランタンアングラー
# =====================================================================
BRASS, BRASSH, BRASSL = '#c9a24a', '#ffe08a', '#7a5a1a'
LAKE, LAKEH, LAKEL = '#1e4a50', '#4a9aa0', '#0a2024'
MOSS = '#7affc0'

def mkbell(w, h, c=BRASS, ch=BRASSH, cl=BRASSL):
    s = Spr(w, h)
    for y in range(h - 2):
        k = y / (h - 2); hw = (w / 2 - 1) * (0.35 + 0.65 * k ** 1.6)
        for x in range(int(w / 2 - hw), int(w / 2 + hw) + 1): s.px(x, y, ch if x < w / 2 - hw * .4 else cl if x > w / 2 + hw * .5 else c)
    s.hline(0, w - 1, h - 2, cl); s.ellipse(w / 2, h - 1, 1.5, 1.2, '#3a2a10'); s.outline('#1a1006'); return s

def add_v051_props(P):
    s = Spr(64, 40)   # servants' bell board (decor version: a row of small bells on a plaque)
    s.rect(0, 0, 64, 14, '#5a3a24'); s.hline(0, 63, 0, '#8a6a44'); s.hline(0, 63, 13, '#2a1a10')
    for k in range(6):
        x = 4 + k * 10; s.vline(x + 3, 14, 20, '#2a1a10'); s.blit(mkbell(8, 9), x, 20)
        s.rect(x, 4, 8, 6, '#e8dcc0'); s.px(x + 3, 6, '#3a2a1a'); s.px(x + 4, 6, '#3a2a1a')
    s.outline('#140a06'); P.add('bellplaque', s)
    s = Spr(36, 46)   # linen shelf
    s.rect(0, 0, 36, 46, '#4a3220'); s.rect(2, 2, 32, 42, '#2a1a10')
    for row in range(3):
        y = 4 + row * 14; s.hline(2, 33, y + 11, '#6a4a30')
        for k in range(4): s.rect(3 + k * 8, y + 3, 7, 8, ('#e8e4dc', '#c8d8e8', '#e8d0d8', '#f0ecd8')[(k + row) % 4]); s.hline(3 + k * 8, 9 + k * 8, y + 3, '#ffffff')
    s.outline('#140a06'); P.add('linenshelf', s)
    s = Spr(48, 30)   # narrow bunk bed
    s.rect(2, 4, 4, 26, '#4a3220'); s.rect(42, 0, 4, 30, '#4a3220'); s.rect(2, 16, 44, 4, '#5a3a24'); s.rect(6, 12, 36, 4, '#e8e4dc'); s.ellipse(12, 11, 5, 3, '#ffffff')
    s.rect(18, 10, 24, 6, '#8a4a5a'); s.outline('#140a06'); P.add('bunk', s)
    s = Spr(14, 44)   # broom leaning
    s.line(9, 0, 6, 32, '#8a6a3a'); s.line(10, 0, 7, 32, '#6a4a2a')
    for x in range(1, 13): s.line(6, 31, x, 43, '#c8a860' if x % 2 else '#a88840')
    s.outline('#1a1006'); P.add('broom', s)
    s = Spr(22, 20)   # mop bucket
    s.rect(2, 6, 18, 14, '#8a8e98'); s.hline(2, 19, 6, '#c8ccd4'); s.vline(2, 6, 19, '#c8ccd4'); s.ellipse(11, 6, 8, 2, '#5a7a8a'); s.line(4, 6, 11, 0, '#4a4a52'); s.line(18, 6, 11, 0, '#4a4a52')
    s.outline('#14141a'); P.add('mopbucket', s)
    s = Spr(40, 20)   # ironing board
    s.ellipse(20, 4, 19, 3, '#d8d0c0'); s.hline(2, 37, 6, '#8a8070'); s.line(8, 7, 30, 19, '#5a5a62'); s.line(30, 7, 8, 19, '#5a5a62'); s.rect(26, 0, 8, 3, '#4a4a52')
    s.outline('#14141a'); P.add('ironboard', s)
    # ---- underground lake
    def stalag(w, h, up=True):
        s = Spr(w, h)
        for y in range(h):
            k = (h - 1 - y) / (h - 1) if up else y / (h - 1); hw = (w / 2) * (1 - k) ** 1.2
            for x in range(int(w / 2 - hw), int(w / 2 + hw) + 1): s.px(x, y, '#5a6a6a' if x < w / 2 else '#3a4648')
        s.outline('#0a1012'); return s
    P.add('stalagmite', stalag(16, 34)); P.add('stalactite', stalag(14, 30, False))
    s = Spr(30, 10)   # glowing moss tuft
    for x in range(30): h = 2 + int(3 * abs(math.sin(x * .7))); s.vline(x, 10 - h, 9, MOSS if x % 3 else '#3ac890')
    P.add('glowmoss', s)
    s = Spr(28, 34)   # rock with a dripping lantern hook
    s.ellipse(14, 24, 13, 10, '#3a4648'); s.ellipse(10, 20, 6, 5, '#5a6a6a'); s.vline(14, 0, 10, '#2a2a2a'); s.rect(11, 10, 6, 6, '#ffb040'); s.hline(11, 16, 10, '#5a4a2a')
    s.outline('#0a1012'); P.add('lakerock', s)
    s = Spr(48, 14)   # sunken rowboat
    for x in range(48): d = int(5 * math.sin((x + .5) / 48 * math.pi)); s.vline(x, 4, 4 + d + 3, '#4a3220' if x % 6 else '#2a1a10')
    s.hline(0, 47, 4, '#6a4a30'); s.outline('#0a0806'); P.add('rowboat', s)

def add_v051_enemies(E):
    def dustmaid(f, throw=False):   # puppet skin: a doll maid with a feather duster
        s = Spr(20, 34)
        for x in (4, 10, 16): s.vline(x, 0, 6 + (x % 3), (220, 220, 230, 140))
        s.ellipse(10, 9, 4.5, 4.5, '#f0e4d8'); s.rect(6, 4, 8, 3, '#3a2a1a'); s.hline(6, 13, 4, '#ffffff'); s.px(8, 9, '#1a1a2a'); s.px(12, 9, '#1a1a2a')
        for y in range(14, 25): hw = 2.5 if y < 19 else 2.5 + (y - 19) * .8; s.hline(10 - hw, 10 + hw, y, '#2a2a3a')
        s.rect(8, 15, 5, 9, '#ffffff'); s.hline(6, 14, 24, '#ffffff')
        if throw: s.line(14, 15, 19, 6, '#8a6a3a'); s.ellipse(19, 5, 2.5, 2.5, '#e8a0c0')
        else: s.line(14, 15, 18, 10 + f, '#8a6a3a'); s.ellipse(18, 9 + f, 2.5, 2.5, '#e8a0c0'); s.line(6, 15, 2, 19, '#f0e4d8')
        s.vline(9, 25, 31 + f, '#f0e4d8'); s.vline(11, 25, 32 - f, '#f0e4d8'); s.outline('#140c10'); return s
    E.add('dustmaid0', dustmaid(0)); E.add('dustmaid1', dustmaid(1)); E.add('dustmaid_throw', dustmaid(0, True))
    def bellbat(f):   # bat skin: a little brass bell with lace wings
        s = Spr(20, 12); s.blit(mkbell(8, 9), 6, 1); s.px(8, 5, '#1a1006'); s.px(11, 5, '#1a1006')
        for x in range(0, 6):
            if f == 0: s.vline(x, 1 + x // 2, 6, '#e8e4dc'); s.vline(19 - x, 1 + x // 2, 6, '#e8e4dc')
            else: s.vline(x, 6, 10 - x // 2, '#e8e4dc'); s.vline(19 - x, 6, 10 - x // 2, '#e8e4dc')
        s.outline('#1a1006'); return s
    E.add('bellbat0', bellbat(0)); E.add('bellbat1', bellbat(1))
    s = Spr(12, 14); s.blit(mkbell(10, 11), 1, 2); s.vline(6, 0, 2, '#2a1a10'); s.outline('#1a1006'); E.add('bellbat_hang', s)
    def lakewisp(f):   # skullwisp skin: a pale firefly lantern-fish
        s = Spr(20, 22)
        for k in range(8): y = 14 + k; w = max(0, 4 - k * .5 + (1 if (k + f) % 2 else 0)); s.hline(10 - w, 10 + w, y, MOSS if k % 3 else '#e8fff4')
        s.ellipse(10, 8, 7, 5, '#8ad8d0'); s.ellipse(8, 7, 3, 2, '#e8fff8'); s.px(13, 7, '#0a2024'); s.line(3, 8, 0, 4 + f * 2, '#8ad8d0'); s.line(3, 8, 0, 12 - f * 2, '#8ad8d0')
        s.vline(10, 0, 3, '#4a9aa0'); s.ellipse(10, 0, 1.5, 1.5, '#fff8a0'); s.outline('#0a1a1c'); return s
    E.add('lakewisp0', lakewisp(0)); E.add('lakewisp1', lakewisp(1))
    def blindcrab(f, snap=False):   # crab skin: a pale cave crab with no eyes
        s = Spr(24, 16); sh, shl, shd = '#d8d8e0', '#ffffff', '#8a8aa0'
        s.ellipse(12, 10, 8, 5, sh); s.ellipse(10, 8, 4, 2, shl); s.hline(5, 19, 13, shd)
        cy = 5 if snap else 7
        for side in (-1, 1):
            cx = 12 + side * 10; s.ellipse(cx, cy, 3, 3, sh)
            if snap: s.line(cx, cy - 1, cx + side * 2, cy - 4, sh)
            for k in range(3): s.line(12 + side * (3 + k * 2), 13, 12 + side * (5 + k * 2), 15 - ((k + f) % 2), shd)
        s.outline('#2a2a3a'); return s
    E.add('blindcrab0', blindcrab(0)); E.add('blindcrab1', blindcrab(1)); E.add('blindcrab_snap', blindcrab(0, True))

def add_v051_boss(BO):
    # 呼び鈴盤 リンガリング: a big wooden servants' bell board with a giant bell at its heart (anchor centre, 104x64)
    def board(mood):
        s = Spr(104, 64)
        s.rect(4, 4, 96, 30, '#5a3a24'); s.hline(4, 99, 4, '#8a6a44'); s.hline(4, 99, 33, '#2a1a10'); s.rect(8, 8, 88, 22, '#3a2416')
        for k in range(8):
            x = 10 + k * 11
            if not (36 <= x <= 60): s.vline(x + 4, 30, 38, '#2a1a10'); s.blit(mkbell(9, 10), x, 38 - (2 if mood == 'rage' and k % 2 else 0))
            s.rect(x + 1, 10, 8, 7, '#e8dcc0'); s.px(x + 3, 13, '#3a2a1a'); s.px(x + 6, 13, '#3a2a1a')
        if mood == 'open':
            s.ellipse(52, 44, 15, 14, '#140a06'); s.ellipse(52, 44, 11, 10, '#2a1406'); s.line(40, 30, 64, 58, BRASSL)
        else:
            s.blit(mkbell(30, 28, BRASS if mood != 'rage' else '#e87a3a'), 37, 30)
        eyes = [(30, 20), (74, 20)]
        for (ex, ey) in eyes:
            if mood == 'stun': s.line(ex - 3, ey - 3, ex + 3, ey + 3, '#1a0a06'); s.line(ex + 3, ey - 3, ex - 3, ey + 3, '#1a0a06')
            else: s.ellipse(ex, ey, 4, 3, '#ff4a3a' if mood == 'rage' else '#ffe08a'); s.ellipse(ex, ey, 1.5, 1.5, '#1a0a06')
        s.hline(44, 60, 24, '#1a0a06'); s.outline('#140a06'); return s
    for m in ('idle', 'rage', 'open', 'stun'): BO.add('bb_' + m, board(m))
    BO.add('bellshot', mkbell(12, 14))
    s = Spr(18, 14)   # chime ring rolling along the floor
    for a in range(0, 360, 10): r = math.radians(a); s.px(9 + math.cos(r) * 7, 7 + math.sin(r) * 6, BRASSH if a < 180 else BRASS)
    for a in range(0, 360, 20): r = math.radians(a); s.px(9 + math.cos(r) * 4, 7 + math.sin(r) * 3, '#ffffff')
    BO.add('chimering', s)
    s = Spr(28, 16)   # bell clapper (rope strike)
    s.ellipse(14, 8, 12, 7, BRASSL); s.ellipse(12, 6, 7, 4, BRASS); s.outline('#140a06'); BO.add('clapper', s)
    for m in ('tug', 'dizzy'): BO.add('bcore_' + m, tinted_core(m, '#fffbe8', '#ffe08a', '#c9a24a', '#3a2a06'))
    # 灯り鮟鱇 ランタンアングラー: a huge blind anglerfish crawling on fin-legs (anchor bottom-centre, 112x72)
    def angler(pose):
        s = Spr(112, 72); jaw = {'idle': 4, 'rage': 6, 'bite': 18, 'dive': 0, 'stun': 10}[pose]
        if pose == 'dive':
            for x in range(10, 102):
                h = int(14 * math.sin((x - 10) / 92 * math.pi)); s.vline(x, 72 - h, 71, LAKE if x % 5 else LAKEH)
            s.line(50, 58, 58, 44, LAKEH); s.line(58, 44, 66, 58, LAKEH); s.outline('#04100e'); return s
        for y in range(18, 66):
            k = (y - 18) / 48; hw = 44 * math.sin(min(1, k * 1.3 + .15) * math.pi * .5) * (1 - k * .15)
            for x in range(int(60 - hw), int(60 + hw) + 1): s.px(x, y, LAKEH if y < 26 else LAKEL if y > 56 else LAKE)
        for x in range(14, 30): s.vline(x, 30 + (x - 14) // 2, 54 - (x - 14) // 3, LAKEL)  # tail fin (left)
        mt = 44 - jaw // 2
        s.rect(70, mt, 34, jaw, '#0a0408')
        for x in range(72, 104, 4): s.line(x, mt, x + 1, mt + 4, '#f0f0f8'); s.line(x, mt + jaw, x + 1, mt + jaw - 4, '#f0f0f8')
        s.ellipse(86, 30, 4, 3, '#e8e8f0' if pose != 'rage' else '#ff6060'); s.px(87, 30, '#2a2a3a')
        for side in (40, 70): s.line(side, 64, side - 8, 71, LAKEL); s.line(side + 4, 64, side + 2, 71, LAKEL)
        if pose == 'stun': s.line(82, 26, 90, 34, '#0a0408'); s.line(90, 26, 82, 34, '#0a0408')
        for (sx, sy) in ((40, 30), (52, 26), (34, 42), (60, 50)): s.px(sx, sy, MOSS)
        s.outline('#04100e'); return s
    for p in ('idle', 'rage', 'bite', 'dive', 'stun'): BO.add('an_' + p, angler(p))
    s = Spr(14, 14); s.ellipse(7, 7, 6, 6, '#fff8a0'); s.ellipse(6, 6, 3, 3, '#ffffff'); s.outline('#8a6a10'); BO.add('lurebulb', s)
    s = Spr(12, 12); s.ellipse(6, 6, 5, 5, (160, 230, 255, 200)); s.ellipse(4, 4, 1.5, 1.5, '#ffffff'); s.outline('#4a9aa0'); BO.add('bubble', s)
    for m in ('tug', 'dizzy'): BO.add('lcore_' + m, tinted_core(m, '#fffff0', '#fff8a0', '#7affc0', '#0a3020'))
