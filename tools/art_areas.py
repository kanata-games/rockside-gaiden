# =====================================================================
#  v0.4 NEW AREAS art (exec'd from make_art.py right after the palette; the add_* functions are called
#  just before each atlas is saved)
#    人形劇場 MARIONETTE THEATER : props (stage curtain, theatre masks, footlights), enemies (dancer puppet, mask moth),
#                                  boss 人形座長 ストリングス MAESTRO STRINGS
#    星見の天文台 OBSERVATORY      : props (telescope, armillary globe, star chart), enemies (star wisp, star chart),
#                                  boss 星喰いの天球儀 アストラ ASTRA
# =====================================================================
def add_area_props(P):
    s = Spr(64, 96)   # stage curtain (bottom anchored): heavy red folds with a gold tassel
    for y in range(96):
        for x in range(64):
            fold = math.sin(x * .45 + (y > 70) * (x * .05)) * .5 + .5
            if y > 86 and (x * 7 + y) % 5 == 0: continue
            s.px(x, y, lerp('#5a0a1a', '#b8283a', fold * .9))
    s.rect(0, 0, 64, 6, '#3a0610'); s.hline(0, 63, 6, GOLD)
    for x in range(2, 64, 8): s.vline(x, 7, 10, GOLDH)
    s.ellipse(54, 50, 3, 3, GOLD); s.vline(54, 53, 62, GOLDL); s.outline('#1a0208'); P.add('stagecurtain', s)
    s = Spr(34, 22)   # comedy / tragedy masks
    for (mx, sad) in ((9, 0), (24, 1)):
        s.ellipse(mx, 10, 8, 9, '#f4ecd8' if not sad else '#d8d0e8')
        for ox in (-3, 3): s.rect(mx + ox - 1, 7, 3, 2 + sad, '#1a1020')
        if sad: s.line(mx - 3, 15, mx, 13, '#1a1020'); s.line(mx, 13, mx + 3, 15, '#1a1020')
        else: s.line(mx - 3, 13, mx, 15, '#1a1020'); s.line(mx, 15, mx + 3, 13, '#1a1020')
    s.line(4, 20, 30, 18, '#c83a5a'); s.outline('#1a0c14'); P.add('masks', s)
    s = Spr(16, 10)   # footlight
    s.rect(1, 5, 14, 5, '#3a2a1a'); s.hline(1, 14, 5, GOLD); s.ellipse(8, 4, 4, 3, '#ffe8a0'); s.ellipse(8, 3, 2, 1.5, '#ffffff'); s.outline('#140c06'); P.add('footlight', s)
    s = Spr(40, 56)   # telescope on a tripod
    for k in range(3): s.line(20, 34, 6 + k * 14, 55, '#5a3a20')
    for i in range(34):
        x = 4 + i; y = 30 - i * .7; r = 3 + i * .08
        for d in range(-int(r), int(r) + 1): s.px(x, y + d, GOLD if d < 0 else GOLDL)
    s.rect(34, 4, 5, 9, GOLDD); s.ellipse(20, 34, 3, 3, GOLDH); s.outline('#1a1006'); P.add('telescope', s)
    s = Spr(36, 46)   # armillary globe
    for k in range(3):
        for i in range(60):
            a = i / 60 * 6.283; x = 18 + math.cos(a) * 15; y = 18 + math.sin(a) * 15 * (1, .35, .8)[k]
            if k == 2: x, y = 18 + math.cos(a) * 15 * .35, 18 + math.sin(a) * 15
            s.px(x, y, GOLD)
    s.ellipse(18, 18, 4, 4, '#4a8ad8'); s.ellipse(17, 17, 1.5, 1.5, '#c8e8ff'); s.vline(18, 33, 40, GOLDL); s.rect(10, 40, 17, 5, '#3a2a1a'); s.hline(10, 26, 40, GOLD)
    s.outline('#140c06'); P.add('armillary', s)
    s = Spr(40, 30)   # framed star chart
    s.rect(0, 0, 40, 30, '#5a3a20'); s.rect(2, 2, 36, 26, '#141a3a')
    random.seed(41)
    pts = [(random.randint(5, 34), random.randint(5, 24)) for _ in range(7)]
    for a, b in zip(pts, pts[1:]): s.line(a[0], a[1], b[0], b[1], (140, 170, 255, 160))
    for (x, y) in pts: s.px(x, y, '#ffffff'); s.px(x + 1, y, '#c8d8ff')
    s.outline('#140c06'); P.add('starchart', s)

def add_area_enemies(E):
    def dancer(f, throw=False):   # theatre puppet skin (ballerina marionette)
        s = Spr(20, 34)
        for x in (4, 10, 16): s.vline(x, 0, 6 + (x % 3), (220, 220, 230, 140))
        s.ellipse(10, 9, 4.5, 4.5, '#f4ece4'); s.rect(6, 3, 8, 3, '#2a1a2a'); s.px(8, 9, '#3a1a3a'); s.px(12, 9, '#3a1a3a'); s.hline(9, 11, 12, '#c83a6a')
        s.ellipse(10, 4, 3, 2, '#ff8ac0')
        for y in range(14, 24):
            hw = 2 + (y - 14) * .9 if y > 19 else 2.5
            s.hline(10 - hw, 10 + hw, y, '#ff9ac8' if y > 19 else '#c83a7a')
        s.hline(1, 19, 23, '#ffd0e8')
        if throw: s.line(14, 15, 19, 7, '#f4ece4'); s.px(19, 6, '#ffe080'); s.line(6, 15, 2, 19, '#f4ece4')
        else: s.line(6, 15, 1 + f, 11, '#f4ece4'); s.line(14, 15, 19 - f, 11, '#f4ece4')
        s.vline(9, 24, 31 + f, '#f4ece4'); s.vline(11, 24, 32 - f, '#f4ece4'); s.px(9, 32 + f, '#c83a7a'); s.outline('#1a0c14'); return s
    E.add('dancer0', dancer(0)); E.add('dancer1', dancer(1)); E.add('dancer_throw', dancer(0, True))
    def maskbat(f):   # bat skin: a little theatre mask with moth wings
        s = Spr(20, 12); wing = '#8a3a6a'
        s.ellipse(10, 6, 4, 4, '#f4ecd8'); s.px(8, 5, '#1a1020'); s.px(12, 5, '#1a1020'); s.hline(9, 11, 8, '#c83a5a')
        for x in range(0, 6):
            if f == 0: s.vline(x, 1 + x // 2, 6, wing); s.vline(19 - x, 1 + x // 2, 6, wing)
            else: s.vline(x, 6, 10 - x // 2, wing); s.vline(19 - x, 6, 10 - x // 2, wing)
        s.outline('#1a0a14'); return s
    E.add('maskbat0', maskbat(0)); E.add('maskbat1', maskbat(1))
    s = Spr(12, 14); s.ellipse(6, 8, 4, 5, '#f4ecd8'); s.px(4, 8, '#1a1020'); s.px(7, 8, '#1a1020'); s.rect(2, 0, 8, 4, '#8a3a6a'); s.outline('#1a0a14'); E.add('maskbat_hang', s)
    def starwisp(f):   # skullwisp skin: a sleepy little star
        s = Spr(20, 22)
        for k in range(9): y = 12 + k; w = max(0, 5 - k * .6 + (1 if (k + f) % 2 else 0)); s.hline(10 - w, 10 + w, y, '#8ab0ff' if k % 3 else '#d8e8ff')
        for i in range(5):
            a = -math.pi / 2 + i * 2 * math.pi / 5
            s.line(10, 9, 10 + math.cos(a) * 8, 9 + math.sin(a) * 8, '#ffe070')
        s.ellipse(10, 9, 5, 5, '#ffe890'); s.px(8, 9, '#3a2a10'); s.px(12, 9, '#3a2a10'); s.hline(9, 11, 11, '#c88a3a'); s.outline('#2a2008'); return s
    E.add('starwisp0', starwisp(0)); E.add('starwisp1', starwisp(1))
    def chart(f, bite=False):   # cursedbook skin: a rolled star chart that snaps open
        s = Spr(22, 18)
        if bite:
            s.rect(1, 3, 20, 12, '#141a3a'); s.ellipse(1, 9, 2, 7, '#d8c8a0'); s.ellipse(20, 9, 2, 7, '#d8c8a0')
            for (x, y) in ((5, 6), (9, 11), (14, 5), (17, 10)): s.px(x, y, '#ffffff')
            s.line(5, 6, 9, 11, '#6a8ad8'); s.line(9, 11, 14, 5, '#6a8ad8'); s.px(11, 8, '#ff5050'); s.px(13, 8, '#ff5050')
        else:
            s.rect(3, 6 + f, 16, 7, '#d8c8a0'); s.ellipse(3, 9 + f, 3, 4, '#e8dcb8'); s.ellipse(18, 9 + f, 3, 4, '#c8b890'); s.hline(5, 16, 9 + f, '#8a7a5a'); s.px(12, 8 + f, '#ff5050')
        s.outline('#1a1408'); return s
    E.add('chart0', chart(0)); E.add('chart1', chart(1)); E.add('chart_bite', chart(0, True))

def add_area_boss(BO):
    # 人形座長 ストリングス: a tall wooden marionette conductor (anchor bottom-centre); strings drawn in code
    def strings(pose='idle', f=0):
        W, H = 64, 104; s = Spr(W, H); cx = W // 2; WOOD, WOODH, WOODL = '#8a5a34', '#b88050', '#5a3a1e'
        lift = {'idle': 0, 'jump': 6, 'cast': 2, 'slump': -10}[pose]
        # legs (jointed) + boots
        for side in (-1, 1):
            kx = cx + side * (7 + (3 if pose == 'jump' else 0))
            s.line(cx + side * 5, 66 - lift, kx, 82 - lift // 2, WOOD); s.line(cx + side * 5 + 1, 66 - lift, kx + 1, 82 - lift // 2, WOODL)
            s.line(kx, 82 - lift // 2, cx + side * 6, 98, WOOD); s.ellipse(kx, 82 - lift // 2, 2, 2, WOODH)
            s.rect(cx + side * 6 - 4, 98, 8, 6, '#1a1014'); s.hline(cx + side * 6 - 4, cx + side * 6 + 3, 98, '#3a2a30')
        # tailcoat body
        for y in range(34 - lift, 68 - lift):
            hw = 9 + (y - 34 + lift) * .12
            for x in range(int(cx - hw), int(cx + hw) + 1): s.px(x, y, '#2a1a3a' if x < cx + 3 else '#1a1028')
        for side in (-1, 1):   # coat tails
            for y in range(60 - lift, 80 - lift): s.hline(cx + side * 6 - (3 if side < 0 else 0), cx + side * 6 + (3 if side > 0 else 0) - (0 if side > 0 else 0), y, '#2a1a3a')
        s.rect(cx - 3, 36 - lift, 6, 14, '#f0e8f0'); s.rect(cx - 4, 36 - lift, 8, 3, '#c83a5a')   # shirt + red bow tie
        for k in range(3): s.px(cx, 42 - lift + k * 4, GOLD)
        # arms (raised when conducting)
        arm = {'idle': 10, 'jump': -14, 'cast': -22, 'slump': 22}[pose]
        for side in (-1, 1):
            ex = cx + side * 18; ey = 44 - lift + arm // 2
            s.line(cx + side * 9, 38 - lift, ex, ey, WOOD); s.line(ex, ey, ex + side * 6, ey + arm // 2 + 4, WOOD); s.ellipse(ex, ey, 2, 2, WOODH)
            s.ellipse(ex + side * 6, ey + arm // 2 + 5, 3, 3, '#f4ece4')
        if pose == 'cast': s.line(cx + 24, 30 - lift, cx + 30, 12 - lift, '#ffffff')   # baton
        # head: carved wooden face, top hat, painted cheeks
        hy = 20 - lift + (6 if pose == 'slump' else 0); hx = cx + (4 if pose == 'slump' else 0)
        s.ellipse(hx, hy, 11, 12, WOODH); s.ellipse(hx + 4, hy + 3, 6, 7, WOOD)
        s.vline(hx - 6, hy + 2, hy + 10, WOODL); s.vline(hx + 6, hy + 2, hy + 10, WOODL)   # nutcracker jaw lines
        if pose == 'slump':
            for ox in (-5, 5):
                for k in range(8): a = k / 8 * 6.28; s.px(hx + ox + math.cos(a) * (1 + k / 4), hy - 2 + math.sin(a) * (1 + k / 4), '#1a0a10')
        else:
            for ox in (-5, 5): s.ellipse(hx + ox, hy - 2, 2.5, 3, '#ffffff'); s.rect(hx + ox - 1, hy - 2, 2, 3, '#1a0a10')
            if pose in ('cast', 'jump'): s.line(hx - 9, hy - 7, hx - 2, hy - 5, '#1a0a10'); s.line(hx + 9, hy - 7, hx + 2, hy - 5, '#1a0a10')
        s.hline(hx - 4, hx + 4, hy + 7, '#3a1010'); s.ellipse(hx - 7, hy + 3, 2, 1.5, '#e86a7a'); s.ellipse(hx + 7, hy + 3, 2, 1.5, '#e86a7a')
        s.rect(hx - 8, hy - 24, 16, 14, '#1a1020'); s.rect(hx - 12, hy - 11, 24, 3, '#1a1020'); s.hline(hx - 8, hx + 7, hy - 14, '#c83a5a'); s.hline(hx - 8, hx + 7, hy - 24, '#3a2a40')
        s.outline('#0e0806'); return s
    for k, p in (('str_idle0', ('idle', 0)), ('str_idle1', ('idle', 1)), ('str_jump', ('jump', 0)), ('str_cast', ('cast', 0)), ('str_slump', ('slump', 0))):
        BO.add(k, strings(*p))
    s = Spr(44, 40)   # sandbag (falls in the spotlight)
    s.ellipse(22, 24, 18, 15, '#a8885a'); s.ellipse(17, 19, 8, 6, '#c8a878'); s.rect(18, 4, 8, 8, '#7a5a3a'); s.hline(14, 30, 10, '#5a3a20')
    for x in range(8, 36, 6): s.px(x, 30, '#7a5a3a')
    s.outline('#2a1a0a'); BO.add('sandbag', s)
    s = Spr(14, 14); s.ellipse(7, 7, 6, 6.5, '#f4ecd8'); s.px(5, 6, '#1a1020'); s.px(9, 6, '#1a1020'); s.line(5, 10, 9, 10, '#c83a5a'); s.outline('#1a0a14'); BO.add('maskshot', s)
    for m in ('tug', 'dizzy'): BO.add('mcore_' + m, tinted_core(m, '#fff0f8', '#ffb0d8', '#c83a7a', '#4a0a2a'))
    # 星喰いの天球儀 アストラ: brass rings around a sun with a sleepy-angry face (anchor centre, 112x112)
    def astra(mood):
        S = 112; s = Spr(S, S); c = S / 2
        hot = mood == 'nova'; stop = mood == 'stop'; rage = mood == 'rage'
        for k, (rx, ry, rot) in enumerate(((52, 18, .35), (52, 22, -.5), (40, 40, 0))):
            col = (GOLD, GOLDL, GOLDH)[k] if not stop else ('#7a6a4a', '#5a4a30', '#9a8a6a')[k]
            for i in range(240):
                a = i / 240 * 6.283; x, y = math.cos(a) * rx, math.sin(a) * ry
                xr, yr = x * math.cos(rot) - y * math.sin(rot), x * math.sin(rot) + y * math.cos(rot)
                s.px(c + xr, c + yr, col); s.px(c + xr, c + yr + 1, GOLDD if not stop else '#3a2a1a')
        sun = ('#fff4c0', '#ffc840', '#e87a20') if not hot else ('#ffffff', '#ffe8a0', '#ff6a3a')
        if rage: sun = ('#ffe0c0', '#ff8a40', '#c83a20')
        if stop: sun = ('#d8d0b8', '#a89870', '#7a6a4a')
        for y in range(S):
            for x in range(S):
                d = math.hypot(x + .5 - c, y + .5 - c)
                if d < 20: s.px(x, y, sun[0] if d < 8 else sun[1] if d < 15 else sun[2])
                elif d < 24 and not stop and (math.atan2(y - c, x - c) * 8) % 1 < .5: s.px(x, y, sun[2])
        if stop:
            for ox in (-6, 6):
                for k in range(8): a = k / 8 * 6.28; s.px(c + ox + math.cos(a) * (1 + k / 4), c - 3 + math.sin(a) * (1 + k / 4), '#3a2a10')
        else:
            for ox in (-6, 6): s.hline(c + ox - 3, c + ox + 2, c - 4, '#5a2a08'); s.rect(c + ox - 2, c - 3, 4, 2, '#5a2a08')
            if rage or hot: s.line(c - 10, c - 9, c - 3, c - 6, '#5a2a08'); s.line(c + 10, c - 9, c + 3, c - 6, '#5a2a08')
        s.hline(c - 4, c + 4, c + 7, '#5a2a08')
        for (pa, pr, pc) in ((.6, 50, '#5a8ad8'), (2.4, 44, '#d86a4a'), (4.1, 38, '#8ad86a')):   # planets riding the rings
            s.ellipse(c + math.cos(pa) * pr, c + math.sin(pa) * pr * .4, 5, 5, pc if not stop else '#6a6a6a')
        s.outline('#1a1006'); return s
    for m in ('idle', 'nova', 'rage', 'stop'): BO.add('astra_' + m, astra(m))
    s = Spr(16, 16)
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5; s.line(8, 8, 8 + math.cos(a) * 7, 8 + math.sin(a) * 7, '#ffe070'); s.line(8, 8, 8 + math.cos(a + .3) * 4, 8 + math.sin(a + .3) * 4, '#ffe070')
    s.ellipse(8, 8, 3.5, 3.5, '#fff8d0'); s.outline('#5a3a08'); BO.add('starshot', s)
    s = Spr(18, 18); s.ellipse(9, 9, 8, 8, '#5a8ad8'); s.ellipse(7, 7, 3, 3, '#a8d0ff'); s.hline(1, 17, 10, (255, 255, 255, 120)); s.outline('#0a1a3a'); BO.add('planet', s)
    for m in ('tug', 'dizzy'): BO.add('scor_' + m, tinted_core(m, '#fffbe0', '#ffd060', '#e8902a', '#5a2a08'))
