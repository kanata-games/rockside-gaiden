# =====================================================================
#  v0.6 EXPANSION art (exec'd from make_art.py; add_v06_* are called just before each atlas is saved)
#    尖塔の屋根 ROOFTOP SPIRES : slate, chimneys, weathervanes | crow, stone vane-gargoyle | boss 風見鶏 ゲイルコック
#    絵の中の世界 PAINTED WORLD : canvas, frames, paint pots | ink bat, brush dancer | boss 絵の具ゴーレム パレットン
#    おもちゃ箱の子供部屋 TOY NURSERY : blocks, rocking horse | tin soldier, wind-up mouse | boss びっくり箱 ボックスジャック
# =====================================================================
IRON, IRONH, IRONL = '#3a3e48', '#7a8494', '#1a1c22'
PAINT = ['#e84a4a', '#f0c030', '#3a8ae8', '#4ac86a', '#c85ae8', '#ffffff']

def add_v06_props(P):
    s = Spr(24, 48)   # chimney stack
    s.rect(2, 8, 20, 40, '#6a3a2a'); s.rect(0, 2, 24, 7, '#4a2a1e'); s.hline(0, 23, 2, '#8a5a40')
    for y in range(12, 48, 6):
        for x in range(2 + (3 if (y // 6) % 2 else 0), 22, 7): s.hline(x, x + 5, y, '#4a2418')
    s.outline('#120806'); P.add('chimney', s)
    s = Spr(20, 40)   # small weathervane on a pole (decor)
    s.vline(10, 8, 39, IRONL); s.vline(9, 8, 39, IRONH); s.hline(3, 17, 18, IRON); s.px(3, 17, IRONH); s.px(17, 19, IRONH)
    s.ellipse(10, 6, 6, 4, IRON); s.line(14, 3, 18, 1, IRON); s.line(4, 6, 1, 3, IRON); s.px(13, 5, '#ffd84a')
    s.outline('#08080c'); P.add('vane_small', s)
    s = Spr(40, 10)   # slate ridge with snow-ish moonlight
    for x in range(40): s.vline(x, 4 - (x % 8) // 3, 9, '#3a4458' if x % 8 else '#5a6a84')
    s.hline(0, 39, 4, '#a8b8d8'); s.outline('#0a0c14'); P.add('ridge', s)
    s = Spr(36, 30)   # moon (drawn as a prop high on the wall)
    s.ellipse(18, 15, 13, 13, '#f0ecd8'); s.ellipse(14, 12, 3, 3, '#d8d0b8'); s.ellipse(22, 19, 4, 3, '#d8d0b8'); P.add('moon', s)
    # ---- painted world
    s = Spr(40, 34)   # empty golden frame
    s.rect(0, 0, 40, 34, '#c9a24a'); s.rect(3, 3, 34, 28, '#7a5a1a'); s.rect(5, 5, 30, 24, (0, 0, 0, 0))
    for k in range(0, 40, 6): s.px(k, 1, '#ffe08a'); s.px(k, 32, '#ffe08a')
    s.outline('#2a1a06'); P.add('frame_empty', s)
    s = Spr(18, 22)   # paint pot
    s.rect(2, 6, 14, 16, '#8a8e98'); s.hline(2, 15, 6, '#c8ccd4'); s.ellipse(9, 6, 7, 2, PAINT[2]); s.rect(6, 8, 2, 8, PAINT[2]); s.line(13, 0, 9, 7, '#8a6a3a')
    s.outline('#14141a'); P.add('paintpot', s)
    s = Spr(28, 44)   # easel with a canvas
    s.line(4, 43, 14, 0, '#8a6a3a'); s.line(24, 43, 14, 0, '#8a6a3a'); s.rect(3, 6, 22, 18, '#f4f0e4')
    s.ellipse(10, 14, 4, 3, PAINT[0]); s.ellipse(17, 17, 5, 3, PAINT[2]); s.line(5, 20, 22, 10, PAINT[1]); s.hline(2, 25, 25, '#6a4a2a')
    s.outline('#1a1006'); P.add('easel', s)
    s = Spr(36, 12)   # paint splash on the floor
    for (cx, c) in ((8, 0), (18, 1), (28, 2)): s.ellipse(cx, 7, 7, 3, PAINT[c]); s.px(cx - 4, 2, PAINT[c])
    P.add('splash', s)
    # ---- toy nursery
    s = Spr(36, 34)   # stack of alphabet blocks
    for (x, y, c, ch) in ((0, 18, 0, 'A'), (18, 18, 2, 'B'), (9, 2, 1, 'C')):
        s.rect(x, y, 16, 16, PAINT[c]); s.rect(x + 2, y + 2, 12, 12, '#f4f0e4'); s.rect(x + 6, y + 5, 4, 6, PAINT[c])
    s.outline('#1a1006'); P.add('blocks', s)
    s = Spr(44, 36)   # rocking horse
    for x in range(2, 42): s.px(x, 33 - int(4 * math.sin((x - 2) / 40 * math.pi)), '#8a5a2a'); s.px(x, 34 - int(4 * math.sin((x - 2) / 40 * math.pi)), '#5a3a1a')
    s.rect(10, 14, 22, 9, '#e8e4dc'); s.rect(28, 4, 8, 12, '#e8e4dc'); s.rect(34, 8, 6, 5, '#e8e4dc'); s.px(31, 7, '#1a1a1a')
    for x in (12, 28): s.vline(x, 23, 30, '#e8e4dc')
    s.rect(14, 12, 10, 3, PAINT[0]); s.vline(27, 4, 13, '#a83a2a'); s.outline('#1a1006'); P.add('rockinghorse', s)
    s = Spr(16, 30)   # toy drum + stick (soldier props)
    s.rect(1, 14, 14, 14, PAINT[0]); s.hline(1, 14, 14, '#f4f0e4'); s.hline(1, 14, 27, '#f4f0e4')
    for x in range(1, 15, 3): s.line(x, 15, x + 2, 26, '#ffe08a')
    s.line(4, 0, 8, 13, '#c8a870'); s.outline('#1a0606'); P.add('toydrum', s)
    s = Spr(40, 40)   # toy chest
    s.rect(0, 10, 40, 30, '#3a6ac8'); s.rect(0, 4, 40, 8, '#2a4a98'); s.hline(0, 39, 4, '#6a9ae8'); s.rect(17, 12, 6, 6, '#ffd84a')
    for (x, c) in ((6, 0), (28, 1)): s.rect(x, 0, 6, 6, PAINT[c])
    s.outline('#0a1026'); P.add('toychest', s)

def add_v06_enemies(E):
    def crow(f):   # bat skin: a ragged rooftop crow
        s = Spr(20, 12); s.ellipse(10, 6, 4, 3, '#1a1a22'); s.px(12, 5, '#ffd84a'); s.line(13, 6, 16, 7, '#c8a040')
        for x in range(0, 7):
            if f == 0: s.vline(x, 1 + x // 2, 6, '#2a2a36'); s.vline(19 - x, 1 + x // 2, 6, '#2a2a36')
            else: s.vline(x, 6, 10 - x // 2, '#2a2a36'); s.vline(19 - x, 6, 10 - x // 2, '#2a2a36')
        s.outline('#06060a'); return s
    E.add('crow0', crow(0)); E.add('crow1', crow(1))
    s = Spr(12, 14); s.ellipse(6, 8, 4, 5, '#1a1a22'); s.px(7, 6, '#ffd84a'); s.vline(6, 0, 3, IRON); s.outline('#06060a'); E.add('crow_hang', s)
    def vanegarg(mode, f=0):   # gargoyle skin: an iron weathercock that comes alive
        s = Spr(30, 28); c, h = (IRON, IRONH) if mode == 'stone' else ('#5a6070', '#a8b4c8')
        s.ellipse(15, 16, 8, 6, c); s.ellipse(22, 9, 4, 4, h); s.line(25, 9, 29, 10, '#ffd84a'); s.rect(21, 3, 3, 3, '#c83a3a'); s.px(23, 8, '#ff4040' if mode != 'stone' else '#08080c')
        for k in range(5): s.line(7, 14, 1, 6 + k * 3, h if k % 2 else c)
        if mode == 'stone': s.vline(15, 22, 27, IRONL); s.hline(9, 21, 25, IRONL)
        elif mode == 'dive': s.line(12, 12, 4, 2, h)
        else:
            for x in range(8, 18): s.vline(x, 4 + f * 5 - (x - 8) // 3, 12, c if x % 2 else h)
        s.line(13, 22, 12, 27, IRONL); s.line(17, 22, 18, 27, IRONL); s.outline('#08080c'); return s
    E.add('vanegarg_stone', vanegarg('stone')); E.add('vanegarg_fly0', vanegarg('fly', 0)); E.add('vanegarg_fly1', vanegarg('fly', 1)); E.add('vanegarg_dive', vanegarg('dive'))
    def inkbat(f):   # bat skin: a flying ink blot
        s = Spr(20, 12); s.ellipse(10, 6, 5, 4, '#1a1a3a'); s.px(8, 5, '#ffffff'); s.px(12, 5, '#ffffff'); s.px(10, 10, '#3a3a8a')
        for x in range(0, 6):
            if f == 0: s.vline(x, 2 + x // 2, 6, '#2a2a6a')
            else: s.vline(x, 6, 10 - x // 2, '#2a2a6a')
            if f == 0: s.vline(19 - x, 2 + x // 2, 6, '#2a2a6a')
            else: s.vline(19 - x, 6, 10 - x // 2, '#2a2a6a')
        s.outline('#06061a'); return s
    E.add('inkbat0', inkbat(0)); E.add('inkbat1', inkbat(1))
    s = Spr(12, 14); s.ellipse(6, 8, 5, 5, '#1a1a3a'); s.vline(6, 0, 3, '#1a1a3a'); s.outline('#06061a'); E.add('inkbat_hang', s)
    def brushdancer(f, throw=False):   # puppet skin: a living paintbrush that flicks paint
        s = Spr(20, 34); s.rect(8, 4, 4, 18, '#c8a060'); s.rect(7, 18, 6, 4, '#a8a8b0')
        for y in range(22, 32): hw = 3 - (y - 22) * .25; s.hline(10 - hw, 10 + hw, y, PAINT[(f + y // 4) % 3])
        s.px(9, 9, '#1a1006'); s.px(11, 9, '#1a1006')
        if throw: s.line(12, 10, 18, 4, '#c8a060'); s.ellipse(18, 3, 2, 2, PAINT[0])
        else: s.line(12, 10, 17, 14 - f, '#c8a060'); s.line(8, 10, 3, 14 + f, '#c8a060')
        s.outline('#1a1006'); return s
    E.add('brushdancer0', brushdancer(0)); E.add('brushdancer1', brushdancer(1)); E.add('brushdancer_throw', brushdancer(0, True))
    def tinsoldier(f, throw=False):   # skeleton skin: a wind-up tin soldier
        s = Spr(24, 42)
        s.rect(8, 0, 8, 9, '#1a1a2a'); s.rect(7, 8, 10, 2, '#ffd84a'); s.ellipse(12, 13, 4, 4, '#f0d8c0'); s.px(10, 13, '#1a1a1a'); s.px(14, 13, '#1a1a1a'); s.ellipse(9, 15, 1, 1, '#ff8a8a'); s.ellipse(15, 15, 1, 1, '#ff8a8a')
        s.rect(7, 17, 10, 12, '#c83a3a'); s.vline(12, 17, 28, '#ffd84a'); s.hline(7, 16, 23, '#f4f0e4')
        s.rect(8, 29, 3, 11 + f, '#2a3a8a'); s.rect(13, 29, 3, 12 - f, '#2a3a8a'); s.rect(7, 40, 5, 2, '#1a1a1a'); s.rect(12, 40, 5, 2, '#1a1a1a')
        s.rect(0, 20, 5, 2, '#c8c8d0'); s.vline(2, 16, 25, '#c8c8d0')   # wind-up key on the back
        if throw: s.line(17, 19, 23, 10, '#8a6a3a')
        else: s.line(17, 19, 20, 28 - f, '#8a6a3a'); s.vline(21, 2, 28 - f, '#8a8a90')
        s.outline('#0a0a14'); return s
    E.add('tinsoldier0', tinsoldier(0)); E.add('tinsoldier1', tinsoldier(1)); E.add('tinsoldier_throw', tinsoldier(0, True))
    def toymouse(f):   # rat skin: a clockwork mouse with a key
        s = Spr(22, 12); s.ellipse(11, 7, 7, 4, '#a8a8b8'); s.ellipse(9, 5, 3, 2, '#d8d8e8'); s.ellipse(17, 4, 2, 2, '#e8a0b0'); s.px(18, 6, '#1a1a1a')
        s.vline(6, 1, 4, '#ffd84a'); s.hline(4, 8, 1, '#ffd84a'); s.line(3, 8, 0, 6 + f, '#a8a8b8')
        for x in (7, 14): s.ellipse(x, 11, 1.5, 1, '#3a3a3a')
        s.outline('#1a1a24'); return s
    E.add('toymouse0', toymouse(0)); E.add('toymouse1', toymouse(1))

def add_v06_boss(BO):
    # 風見鶏 ゲイルコック GALECOCK: a giant iron weathercock on a spinning compass pole (anchor bottom-centre, 88x104)
    def vane(pose):
        s = Spr(88, 104); cx = 44
        if pose == 'fall':
            s.hline(4, 83, 100, IRONL); s.hline(4, 83, 99, IRONH); s.rect(4, 97, 80, 3, IRON)
            s.ellipse(70, 88, 14, 10, IRON); s.ellipse(80, 82, 6, 6, IRONH); s.line(84, 82, 87, 86, '#ffd84a')
            s.line(66, 84, 70, 74, '#c83a3a'); s.outline('#06060a'); return s
        s.rect(cx - 2, 40, 4, 64, IRONL); s.vline(cx - 1, 40, 103, IRONH)
        arm = {'idle': 0, 'rage': 0, 'spin': 1, 'swoop': 0}[pose]
        if arm: s.line(cx - 30, 66, cx + 30, 54, IRON); s.line(cx - 20, 50, cx + 20, 70, IRONH)
        else: s.hline(cx - 30, cx + 30, 60, IRON); s.hline(cx - 30, cx + 30, 61, IRONL)
        for (lx, ch) in ((cx - 34, 'W'), (cx + 30, 'E')): s.rect(lx, 56, 5, 9, '#ffd84a')
        s.ellipse(cx + 2, 26, 22, 14, IRON); s.ellipse(cx - 2, 22, 12, 7, IRONH)   # body
        for k in range(6): s.line(cx - 18, 26, cx - 40 + k * 2, 4 + k * 5, IRONH if k % 2 else IRON)   # tail feathers
        s.ellipse(cx + 20, 12, 8, 8, IRON); s.rect(cx + 16, 0, 8, 5, '#c83a3a'); s.line(cx + 27, 12, cx + 34, 14, '#ffd84a'); s.line(cx + 27, 14, cx + 32, 17, '#ffd84a')
        s.ellipse(cx + 22, 10, 2.5, 2.5, '#ff4a3a' if pose == 'rage' else '#ffd84a'); s.px(cx + 22, 10, '#06060a'); s.rect(cx + 20, 18, 4, 6, '#c83a3a')
        s.outline('#06060a'); return s
    for p in ('idle', 'rage', 'spin', 'swoop', 'fall'): BO.add('wv_' + p, vane(p))
    s = Spr(10, 18); s.line(5, 0, 5, 17, IRONH); 
    for y in range(2, 14): s.hline(5 - (3 - abs(y - 8) // 3), 5 + (3 - abs(y - 8) // 3), y, IRON)
    s.outline('#06060a'); BO.add('feather', s)
    s = Spr(20, 14)
    for a in range(0, 180, 8): r = math.radians(a); s.px(10 + math.cos(r) * 9, 13 - math.sin(r) * 11, '#c8e0ff'); s.px(10 + math.cos(r) * 5, 13 - math.sin(r) * 7, '#ffffff')
    BO.add('gustwave', s)
    for m in ('tug', 'dizzy'): BO.add('vcore_' + m, tinted_core(m, '#f0f8ff', '#c8e0ff', '#5a7ab0', '#0a1430'))
    # 絵の具ゴーレム パレットン PALETTON: a hulking golem of wet oil paint with a palette for a face (anchor bottom-centre, 80x92)
    def golem(pose):
        s = Spr(80, 92); cx = 40; sq = {'idle': 0, 'rage': 0, 'raise': -4, 'melt': 40, 'splat': 6}[pose]
        for y in range(10 + sq, 92):
            k = (y - 10 - sq) / max(1, 82 - sq); hw = 18 + 14 * math.sin(min(1, k * 1.6) * math.pi / 2) + (k * 14 if pose == 'melt' else 0)
            for x in range(int(cx - hw), int(cx + hw) + 1):
                band = int((x * 0.35 + y * 0.25 + (3 if pose == 'rage' else 0))) % 5
                s.px(x, y, PAINT[band])
        if pose != 'melt':
            s.ellipse(cx, 22 + sq, 14, 10, '#c8a060'); s.ellipse(cx + 8, 26 + sq, 3, 3, '#5a3a1a')   # palette face with a thumb hole
            for (dx, dy, c) in ((-8, -2, 0), (-2, -5, 1), (5, -4, 2), (-6, 5, 3)): s.ellipse(cx + dx, 22 + sq + dy, 2.5, 2.5, PAINT[c])
            s.ellipse(cx - 4, 20 + sq, 2, 2, '#1a1006' if pose != 'rage' else '#ff2a2a'); s.ellipse(cx + 3, 20 + sq, 2, 2, '#1a1006' if pose != 'rage' else '#ff2a2a')
            if pose == 'raise': s.ellipse(cx - 30, 14, 8, 8, PAINT[0]); s.ellipse(cx + 30, 14, 8, 8, PAINT[2])
            else: s.ellipse(cx - 30, 54, 8, 10, PAINT[0]); s.ellipse(cx + 30, 54, 8, 10, PAINT[2])
        s.outline('#140a1a'); return s
    for p in ('idle', 'rage', 'raise', 'splat', 'melt'): BO.add('pg_' + p, golem(p))
    for i, c in enumerate(PAINT[:4]):
        s = Spr(12, 12); s.ellipse(6, 7, 5, 5, c); s.ellipse(6, 2, 2, 3, c); s.px(4, 5, '#ffffff'); s.outline('#140a1a'); BO.add('paintblob%d' % i, s)
    s = Spr(20, 16)
    for x in range(20):
        hh = int(6 + 6 * math.sin((x + .5) / 20 * math.pi))
        for y in range(16 - hh, 16): s.px(x, y, PAINT[(x // 4) % 4])
    s.outline('#140a1a'); BO.add('paintwave', s)
    for m in ('tug', 'dizzy'): BO.add('pcore_' + m, tinted_core(m, '#fff8f0', '#ffc8a0', '#e84a4a', '#3a0a10'))
    # びっくり箱 ボックスジャック BOXJACK: a jack-in-the-box with a jester head on a spring (anchor bottom-centre, 64x104)
    def jack(pose):
        s = Spr(64, 104); cx = 32
        s.rect(8, 60, 48, 44, '#c83a3a'); s.rect(8, 60, 48, 4, '#ffd84a'); s.rect(8, 100, 48, 4, '#ffd84a')
        for (x, y, c) in ((14, 70, 2), (38, 80, 3), (20, 88, 1)): s.rect(x, y, 10, 10, PAINT[c])
        s.rect(56, 76, 6, 4, '#c8c8d0'); s.rect(60, 70, 3, 14, '#c8c8d0')   # crank
        if pose == 'closed' or pose == 'dizzy':
            s.rect(6, 54, 52, 7, '#a82a2a') if pose == 'closed' else None
            if pose == 'dizzy':
                s.rect(6, 50, 52, 6, '#a82a2a'); s.line(20, 54, 40, 30, '#c8c8d0'); s.line(22, 54, 42, 30, '#8a8a90')
                s.ellipse(46, 26, 9, 8, '#f0e0d0'); s.line(42, 22, 46, 26, '#1a1a1a'); s.line(46, 22, 42, 26, '#1a1a1a'); s.line(48, 22, 52, 26, '#1a1a1a'); s.line(52, 22, 48, 26, '#1a1a1a')
            s.outline('#1a0606'); return s
        lift = 0 if pose == 'open' else -4
        for k in range(8): y = 58 - k * 4 + lift; s.ellipse(cx + (2 if k % 2 else -2), y, 7, 2, '#c8c8d0')   # spring
        hy = 20 + lift
        s.ellipse(cx, hy, 12, 12, '#f0e0d0'); s.ellipse(cx - 4, hy - 2, 2, 2.5, '#1a1a1a'); s.ellipse(cx + 4, hy - 2, 2, 2.5, '#1a1a1a' if pose != 'rage' else '#ff2a2a')
        s.line(cx - 6, hy + 5, cx + 6, hy + 5, '#c83a3a'); s.ellipse(cx, hy + 1, 2, 2, '#ff6a6a')
        for (dx, c) in ((-14, 3), (0, 4), (14, 1)): s.line(cx + dx // 2, hy - 10, cx + dx, hy - 20, PAINT[c]); s.ellipse(cx + dx, hy - 20, 2.5, 2.5, '#ffd84a')
        s.outline('#1a0606'); return s
    for p in ('closed', 'open', 'rage', 'dizzy'): BO.add('jb_' + p, jack(p))
    for i, c in enumerate(PAINT[:4]):
        s = Spr(12, 12); s.rect(0, 0, 12, 12, c); s.rect(2, 2, 8, 8, '#f4f0e4'); s.rect(5, 3, 2, 6, c); s.outline('#1a1006'); BO.add('toyblock%d' % i, s)
    s = Spr(24, 20); s.ellipse(12, 10, 10, 9, '#f0e0d0'); s.ellipse(8, 8, 2, 2.5, '#1a1a1a'); s.ellipse(16, 8, 2, 2.5, '#1a1a1a'); s.line(7, 14, 17, 14, '#c83a3a'); s.outline('#1a0606'); BO.add('jackhead', s)
    for m in ('tug', 'dizzy'): BO.add('jcore_' + m, tinted_core(m, '#fffff0', '#ffd84a', '#c83a3a', '#2a0a06'))
