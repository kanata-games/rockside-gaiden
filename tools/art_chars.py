# =====================================================================
#  v0.4 CHARACTERS (exec'd at the end of make_art.py; shares Spr/Atlas/lerp/GOLD*)
#    chars atlas: クロノア CHRONOA (時計塔管理人, true final boss) + ヴェル VEL (主人付き秘書, never fought)
#    + their dialogue portraits, the clock-face mimic with the giant eye, the pocket watch.
#  Sprites are ~66-72px tall like Kanata (anchor bottom-centre).
# =====================================================================
CH = Atlas('chars', 512)
SKIN, SKINS, SKINL = '#f8e2d0', '#e8c0a8', '#c89880'
def eye_half(s, x, y, iris, closed=False, look=0):
    # sleepy half-closed eye: heavy lid line, iris below
    if closed:
        s.hline(x - 2, x + 2, y + 1, '#3a2018'); s.px(x - 3, y, '#3a2018'); s.px(x + 3, y, '#3a2018'); return
    s.hline(x - 3, x + 2, y - 1, '#2a1410'); s.rect(x - 2, y, 4, 2, iris); s.px(x - 1 + look, y, '#0e1a1a'); s.px(x + 1, y, lerp(iris, '#ffffff', .5))
    s.hline(x - 2, x + 1, y + 2, lerp(SKINS, '#000000', .1))
def chronoa(pose='idle', f=0):
    W, H = 44, 68; s = Spr(W, H); cx = W // 2
    HAIR, HAIRH, HAIRL = '#8a5436', '#b07a52', '#54301e'
    COAT, COATH, COATL = '#2c2438', '#463a58', '#18121e'
    sway = (1 if f else 0) if pose in ('idle', 'cast') else 0
    tilt = 0
    # long hair behind (down to the hips), swaying
    for y in range(8, 46):
        hw = 9 + min(5, (y - 8) * .35) + (1 if (y + f) % 7 == 0 else 0)
        off = int(sway * (y - 8) / 30)
        for x in range(int(cx - hw + off), int(cx + hw + off) + 1):
            c = HAIRL if (x - cx) % 4 == 0 else HAIR
            if y > 40 and (x + y) % 3 == 0: continue
            s.px(x, y, c)
    # boots + socks + legs
    for side in (-1, 1):
        lx = cx + side * 4 - 2
        s.rect(lx, 49, 4, 7, SKIN); s.vline(lx + (3 if side > 0 else 0), 49, 55, SKINS)
        s.rect(lx, 53, 4, 1, '#141018') if side < 0 else None   # garter band on the left thigh
        s.rect(lx, 56, 4, 4, '#f4f0f4')
        s.rect(lx - 1, 60, 6, 7, '#2a1c18'); s.hline(lx - 1, lx + 4, 60, '#4a3428'); s.rect(lx - 1, 66, 7, 2, '#120c0a')
        s.px(lx + 1, 62, GOLD); s.px(lx + 2, 62, GOLDH); s.px(lx + 1, 64, GOLD)
    # coat body + skirt (teal lining)
    for y in range(22, 50):
        hw = 7 + (y - 22) * .28 if y < 42 else 10 + (y - 42) * .6
        for x in range(int(cx - hw), int(cx + hw) + 1):
            c = COAT if x < cx + hw * .4 else COATL
            if x < cx - hw + 2: c = COATH
            s.px(x, y, c)
    s.hline(cx - 13, cx + 13, 49, '#2e6a5a'); s.hline(cx - 12, cx + 12, 48, '#1e4a40')
    s.rect(cx - 3, 24, 6, 12, '#e8e0ec'); s.vline(cx, 24, 35, '#c8c0d0')   # blouse
    s.rect(cx - 2, 25, 4, 2, '#2e6a5a')                                    # ribbon
    # chains draped over the coat
    for k in range(14): s.px(cx - 9 + k, 38 + int(3 * math.sin(k / 13 * math.pi)), '#b8b8c8' if k % 2 else '#7a7a8a')
    for k in range(10): s.px(cx + 2 + k // 2, 30 + k, GOLD if k % 2 else GOLDL)
    # puffy white sleeves + hands
    for side in (-1, 1):
        sx = cx + side * 11
        if pose == 'cast' and side < 0:
            s.ellipse(sx + 1, 22, 5, 6, '#f2eef6'); s.ellipse(sx + 2, 20, 3, 3, '#ffffff'); s.rect(sx - 1, 13, 3, 4, SKIN)    # arm raised
        elif pose == 'sleep':
            s.ellipse(sx, 32, 5, 7, '#f2eef6'); s.rect(sx - 1, 39, 3, 4, SKIN)
        else:
            s.ellipse(sx, 29, 4, 6, '#f2eef6'); s.ellipse(sx - side, 27, 2, 3, '#ffffff'); s.vline(sx + side * 3, 25, 33, '#c8c0d8')
            s.rect(sx - 1, 35, 3, 4, SKIN)
    # pocket watch: in the lowered right hand (on its chain), or held up when casting
    if pose == 'cast':
        wx, wy = cx - 10, 9; s.line(wx, wy + 3, cx - 10, 14, GOLDL)
    elif pose != 'sleep':
        wx, wy = cx + 11, 44; s.line(cx + 11, 38, wx, wy - 3, GOLDL)
    else: wx = None
    if wx is not None:
        s.ellipse(wx, wy, 3.5, 3.5, GOLD); s.ellipse(wx, wy, 2.2, 2.2, '#f4ecd8'); s.px(wx, wy - 1, '#2a1a10'); s.px(wx + 1, wy, '#2a1a10'); s.px(wx, wy - 4, GOLDH)
    # head: face + front hair + dark hood with a clock-gear ornament
    s.ellipse(cx, 15, 7, 7.5, SKIN); s.ellipse(cx + 3, 17, 4, 4, lerp(SKIN, SKINS, .4))
    for x in range(cx - 8, cx + 9):   # fringe
        yy = 9 + (2 if (x - cx) % 3 == 0 else 0) + (1 if abs(x - cx) > 5 else 0)
        s.vline(x, 7, yy, HAIR if (x - cx) % 3 else HAIRH)
    for side in (-1, 1): s.vline(cx + side * 7, 10, 24, HAIR); s.vline(cx + side * 8, 12, 26, HAIRL)  # side locks
    closed = pose == 'sleep'; hurt = pose == 'hurt'
    if hurt:
        for ox in (-3, 3): s.line(cx + ox - 1, 14, cx + ox + 1, 16, '#2a1410'); s.line(cx + ox + 1, 14, cx + ox - 1, 16, '#2a1410')
    else:
        eye_half(s, cx - 3, 15, '#3aa89a', closed); eye_half(s, cx + 3, 15, '#3aa89a', closed)
    s.hline(cx - 1, cx + 1, 20, '#b06a5a') if not hurt else s.ellipse(cx, 20, 1.5, 1, '#6a2a2a')
    s.px(cx - 5, 18, '#f4b0a8'); s.px(cx + 5, 18, '#f4b0a8')
    for y in range(0, 12):   # hood
        hw = 6 + y * .75
        for x in range(int(cx - hw), int(cx + hw) + 1):
            if y > 6 and abs(x - cx) < hw - 2.5: continue
            s.px(x, y, '#241c2c' if x < cx + 3 else '#16101c')
    for side in (-1, 1):   # the hood drapes down beside the face to the shoulders
        for y in range(8, 25):
            for k in range(3): s.px(cx + side * (9 + k + (y - 8) // 6), y, '#241c2c' if k < 2 else '#16101c')
    s.hline(cx - 4, cx + 4, 0, '#3a2e48')
    gx, gy = cx + 5, 5   # gear ornament
    for k in range(8): a = k / 8 * 6.283; s.px(gx + round(math.cos(a) * 3.4), gy + round(math.sin(a) * 3.4), GOLDH)
    s.ellipse(gx, gy, 2.4, 2.4, GOLD); s.px(gx, gy, GOLDD); s.px(gx - 6, gy + 2, '#3aa89a'); s.px(gx - 7, gy + 3, '#2e6a5a')
    s.outline('#0c0810'); return s
for k, (p, f) in {'chr_idle0': ('idle', 0), 'chr_idle1': ('idle', 1), 'chr_cast': ('cast', 0), 'chr_hurt': ('hurt', 0), 'chr_sleep': ('sleep', 0)}.items():
    CH.add(k, chronoa(p, f))

def vel(pose='idle'):
    W, H = 40, 72; s = Spr(W, H); cx = W // 2
    HAIR, HAIRH = '#0a080c', '#2a3048'
    SUIT, SUITH, SUITL = '#2a2836', '#423e52', '#16141e'
    bow = 2 if pose == 'bow' else 0
    for y in range(8 + bow, 50):   # long black hair behind
        hw = 8 + min(4, (y - 8) * .3)
        for x in range(int(cx - hw), int(cx + hw) + 1): s.px(x, y, HAIR if (x - cx) % 5 else HAIRH)
    # legs (trousers) + shoes
    for side in (-1, 1):
        lx = cx + side * 4 - 2
        s.rect(lx, 50, 4, 17, SUITL if side > 0 else SUIT); s.vline(lx + 1, 52, 66, SUITH) if side < 0 else None
        s.rect(lx - 1, 67, 6, 4, '#08060a'); s.hline(lx - 1, lx + 3, 67, '#3a3644'); s.px(lx + 4, 70, '#08060a')
    # jacket
    for y in range(22 + bow, 52):
        hw = 8 + (y - 22) * .12 if y < 44 else 9 + (y - 44) * .5
        for x in range(int(cx - hw), int(cx + hw) + 1): s.px(x, y, SUIT if x < cx + 3 else SUITL)
    # shirt V + tie + cross
    for y in range(22 + bow, 34 + bow):
        w = max(0, 4 - (y - 22 - bow) // 3)
        s.hline(cx - w, cx + w, y, '#ecebf2')
    s.vline(cx, 24 + bow, 40 + bow, '#0a080e'); s.vline(cx + 1, 25 + bow, 38 + bow, '#24202c'); s.rect(cx - 1, 23 + bow, 3, 2, '#0a080e')
    s.vline(cx - 5, 30 + bow, 36 + bow, '#d0d4e0'); s.hline(cx - 7, cx - 3, 32 + bow, '#d0d4e0'); s.px(cx - 5, 32 + bow, '#ffffff')   # silver cross
    s.hline(cx - 7, cx + 7, 44, '#2a2634'); s.px(cx + 4, 44, '#9a98a8')   # belt + chain glint
    # arms (black gloves), hands folded in front unless bowing
    for side in (-1, 1):
        ax = cx + side * 9
        s.rect(ax - 2, 24 + bow, 4, 16, SUITH if side < 0 else SUITL)
        s.line(cx + side * 2, 22 + bow, cx + side * 5, 36 + bow, '#4a4660')   # lapels
        if pose == 'bow' and side > 0: s.rect(cx - 2, 38 + bow, 6, 3, '#08060a')
        else: s.rect(ax - 2, 40 + bow, 4, 4, '#08060a')
    # head: pale face, hair covering her right eye
    hy = 15 + bow
    s.ellipse(cx, hy, 6.5, 7.5, '#f2e6e4')
    eye_half(s, cx + 3, hy, '#8a2a3a')   # the one visible eye (calm, dark red)
    s.px(cx - 5, hy + 3, '#e8c8c8')
    s.hline(cx - 1, cx + 1, hy + 5, '#a07078')
    for y in range(hy - 9, hy + 12):  # hair: fringe swept over the left side of the face
        for x in range(cx - 8, cx + 9):
            dx = x - cx
            over = dx < -1 and y < hy + 3 + (dx + 8) * .15
            top = y < hy - 4 + (dx + 8) * .12
            edge = abs(dx) > 6 and y < hy + 12
            if over or top or edge: s.px(x, y, HAIR if (x + y) % 6 else HAIRH)
    s.outline('#000000'); return s
CH.add('vel_idle', vel('idle')); CH.add('vel_bow', vel('bow'))

def bust(kind):
    W, H = 48, 48; s = Spr(W, H); cx = 24
    if kind == 'chronoa':
        HAIR, HAIRL = '#8a5436', '#54301e'
        for y in range(10, 48):
            hw = 17 + (y - 10) * .1
            for x in range(int(cx - hw), int(cx + hw) + 1): s.px(x, y, HAIR if (x - cx) % 4 else HAIRL)
        for y in range(36, 48):   # coat + puffy sleeves
            for x in range(cx - 20, cx + 21): s.px(x, y, '#2c2438' if abs(x - cx) < 12 else '#f2eef6')
        s.rect(cx - 3, 36, 6, 12, '#e8e0ec'); s.rect(cx - 2, 37, 4, 2, '#2e6a5a')
        for k in range(12): s.px(cx - 10 + k, 44 + int(2 * math.sin(k / 11 * math.pi)), GOLD if k % 2 else GOLDL)
        s.ellipse(cx, 24, 12, 13, SKIN); s.ellipse(cx + 5, 27, 6, 7, lerp(SKIN, SKINS, .35))
        for x in range(cx - 13, cx + 14):
            yy = 15 + (3 if (x - cx) % 4 == 0 else 1) + (2 if abs(x - cx) > 9 else 0)
            s.vline(x, 8, yy, HAIR if (x - cx) % 4 else '#b07a52')
        for side in (-1, 1): s.rect(cx + side * 12 - 1, 16, 3, 22, HAIR)
        for ox in (-5, 5):   # sleepy half-closed eyes
            s.hline(ox + cx - 4, ox + cx + 3, 23, '#2a1410'); s.hline(ox + cx - 4, ox + cx + 3, 24, '#2a1410')
            s.rect(ox + cx - 3, 25, 6, 3, '#3aa89a'); s.rect(ox + cx - 1, 25, 2, 3, '#0e2a2a'); s.px(ox + cx + 1, 25, '#c8fff4')
        s.hline(cx - 2, cx + 2, 32, '#b06a5a'); s.px(cx - 8, 29, '#f4b0a8'); s.px(cx + 8, 29, '#f4b0a8')
        for y in range(0, 18):   # hood
            hw = 11 + y * .7
            for x in range(int(cx - hw), int(cx + hw) + 1):
                if y > 9 and abs(x - cx) < hw - 4: continue
                s.px(x, y, '#241c2c' if x < cx + 6 else '#16101c')
        gx, gy = cx + 9, 7
        for k in range(10): a = k / 10 * 6.283; s.px(gx + round(math.cos(a) * 5), gy + round(math.sin(a) * 5), GOLDH)
        s.ellipse(gx, gy, 3.6, 3.6, GOLD); s.ellipse(gx, gy, 1.5, 1.5, GOLDD); s.line(cx - 12, 14, cx - 6, 18, '#b8b8c8')
    else:
        HAIR, HAIRH = '#14121a', '#2e2a3a'
        for y in range(8, 48):
            hw = 16 + (y - 8) * .1
            for x in range(int(cx - hw), int(cx + hw) + 1): s.px(x, y, HAIR if (x - cx) % 6 else HAIRH)
        for y in range(36, 48):
            for x in range(cx - 18, cx + 19): s.px(x, y, '#1a1820' if x < cx + 4 else '#0c0a10')
        for y in range(36, 48):
            w = max(0, 5 - (y - 36) // 3); s.hline(cx - w, cx + w, y, '#ecebf2')
        s.vline(cx, 38, 47, '#0a080e'); s.rect(cx - 1, 37, 3, 2, '#0a080e')
        s.vline(cx - 9, 40, 46, '#d0d4e0'); s.hline(cx - 11, cx - 7, 42, '#d0d4e0')
        s.ellipse(cx, 24, 11, 13, '#f2e6e4'); s.ellipse(cx + 5, 27, 5, 7, '#e4d4d4')
        s.hline(cx + 2, cx + 9, 23, '#1a0a10'); s.rect(cx + 3, 24, 5, 3, '#8a2a3a'); s.rect(cx + 5, 24, 2, 3, '#2a0a14'); s.px(cx + 4, 24, '#f0b8c0')
        s.hline(cx + 1, cx + 4, 32, '#a07078')
        for y in range(6, 42):
            for x in range(cx - 15, cx + 16):
                dx = x - cx
                over = dx < 1 and y < 30 + (dx + 15) * .25
                top = y < 16 - dx * .1
                edge = abs(dx) > 11
                if over or top or edge: s.px(x, y, HAIR if (x * 2 + y) % 7 else HAIRH)
    s.outline('#000000'); return s
CH.add('portrait_chronoa', bust('chronoa')); CH.add('portrait_vel', bust('vel'))

# the mimic: a huge clock face with a giant eye in the middle (hands drawn in code). 128x128, anchor centre.
def mimic(mood):
    S = 128; s = Spr(S, S); c = S / 2
    for y in range(S):
        for x in range(S):
            d = math.hypot(x + .5 - c, y + .5 - c); a = math.atan2(y + .5 - c, x + .5 - c)
            if d < 63:
                if d > 56: col = GOLDH if (a % .5) < .08 else (GOLD if d < 61 else GOLDL)
                elif d > 53: col = '#2a1c10'
                else:
                    col = lerp('#e8e0cc', '#a89c84', d / 53)
                    if mood == 'crack' and (abs(math.sin(a * 3 + d * .08)) < .05): col = '#3a2a1a'
                s.px(x, y, col)
    for k in range(12):   # roman-ish numeral ticks
        a = k / 12 * 2 * math.pi
        for r in range(44, 51): s.px(c + math.sin(a) * r, c - math.cos(a) * r, '#2a1a10'); s.px(c + math.sin(a) * r + 1, c - math.cos(a) * r, '#2a1a10')
        if k % 3 == 0:
            for r in range(44, 51): s.px(c + math.sin(a) * r - 2, c - math.cos(a) * r, '#2a1a10')
    for k in range(60):
        a = k / 60 * 2 * math.pi; s.px(c + math.sin(a) * 52, c - math.cos(a) * 52, '#5a4a3a')
    # the eye
    if mood == 'shut':
        for x in range(int(c - 30), int(c + 31)):
            y = c + 6 * (1 - ((x - c) / 30) ** 2); s.px(x, y, '#2a1410'); s.px(x, y + 1, '#2a1410')
        for k in range(7): x = c - 24 + k * 8; s.line(x, c + 6, x - 2, c + 12, '#2a1410')
        s.ellipse(c, c - 2, 28, 7, '#c8a898')
        for x in range(int(c - 30), int(c + 31)): s.px(x, c - 2 + 7 * ((x - c) / 30) ** 2 - 4, '#7a4a3a')
    else:
        for y in range(int(c - 24), int(c + 25)):
            for x in range(int(c - 34), int(c + 35)):
                u, v = (x + .5 - c) / 34, (y + .5 - c) / 22
                if abs(v) < max(0, 1 - u * u) ** 1.1 * 1.05: s.px(x, y, '#f4f0e8' if v < .3 else '#d8d0c8')
        iris = {'open': ('#2a9a90', '#56d0c0', '#0e4a48'), 'charge': ('#d83a4a', '#ffb0a0', '#5a0a1a'), 'crack': ('#2a9a90', '#56d0c0', '#0e4a48')}[mood]
        for y in range(int(c - 18), int(c + 19)):
            for x in range(int(c - 18), int(c + 19)):
                d = math.hypot(x + .5 - c, y + .5 - c)
                if d < 17 and abs((y + .5 - c) / 22) < 1:
                    k = d / 17; col = lerp(iris[1], iris[0], k * 1.2) if k < .8 else iris[2]
                    if (math.atan2(y - c, x - c) * 6) % 1 < .25 and .3 < k < .8: col = lerp(col, iris[2], .4)
                    s.px(x, y, col)
        s.ellipse(c, c, 3, 11, '#060404'); s.ellipse(c - 7, c - 7, 3, 2.5, '#ffffff'); s.px(c + 6, c + 6, '#ffffff')
        for x in range(int(c - 34), int(c + 35)):   # lids + lashes
            u = (x + .5 - c) / 34; v = max(0, 1 - u * u) ** 1.1 * 1.05 * 22
            s.px(x, c - v, '#2a1410'); s.px(x, c - v - 1, '#2a1410'); s.px(x, c + v, '#4a2a20')
            if x % 6 == 0 and abs(u) < .85: s.line(x, c - v - 1, x + (u * 6), c - v - 6, '#2a1410')
    s.outline('#100804'); return s
for m in ('open', 'charge', 'shut', 'crack'): CH.add('mimic_' + m, mimic(m))
s = Spr(26, 26); s.ellipse(13, 14, 11, 11, GOLDL); s.ellipse(13, 14, 10, 10, GOLD); s.ellipse(13, 14, 8, 8, '#f4ecd8')
for k in range(12): a = k / 12 * 6.283; s.px(13 + math.sin(a) * 6.5, 14 - math.cos(a) * 6.5, '#2a1a10')
s.line(13, 14, 13, 9, '#2a1a10'); s.line(13, 14, 16, 15, '#2a1a10'); s.rect(11, 1, 5, 3, GOLD); s.px(13, 0, GOLDH); s.ellipse(10, 11, 2, 2, (255, 255, 255, 200))
s.outline('#2a1a08'); CH.add('pocketwatch', s)
s = Spr(14, 14)
for y in range(14):
    for x in range(14):
        d = math.hypot(x + .5 - 7, y + .5 - 7)
        if d < 6.5: s.px(x, y, '#fff4c8' if d < 2.5 else '#e8c060' if d < 4.5 else '#a8743a')
s.outline('#4a2a08'); CH.add('sandorb', s)
CH.save()
for m in ('tug', 'dizzy'): pass
