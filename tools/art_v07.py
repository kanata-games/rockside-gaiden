# v0.7: おばけ猫の行商人 ミャオ (original ghost-cat peddler) + her shop counter. exec'd from make_art.py
def add_v07_props(P):
    def cat(f):
        s = Spr(36, 40); body, bodyh, bodyl = '#d8d0f8', '#f4f0ff', '#9a8ed0'
        for y in range(30, 40): s.hline(8 + (y - 30) // 2 + (1 if f and y > 36 else 0), 28 - (y - 30) // 2, y, body if y < 37 else '#b8acec')   # ghostly wispy bottom
        s.px(10, 39, (0, 0, 0, 0)); s.px(18, 39, (0, 0, 0, 0)); s.px(26, 39, (0, 0, 0, 0))
        s.ellipse(18, 26, 10, 8, body); s.ellipse(18, 14, 10, 8, body); s.ellipse(15, 12, 4, 3, bodyh)
        for (ex, d) in ((10, -1), (26, 1)): s.line(ex, 4, ex + d * 3, 10, body); s.line(ex + 1, 5, ex + d * 2 + 1, 9, '#f0a0c0'); s.line(ex, 4, ex - d * 1, 10, body)   # ears
        s.vline(10, 4, 10, body); s.vline(26, 4, 10, body); s.px(10, 3, bodyl); s.px(26, 3, bodyl)
        s.hline(13, 15, 14, '#3a2a6a') if f else s.ellipse(14, 14, 1.5, 2, '#3a2a6a')   # wink on frame 1
        s.ellipse(22, 14, 1.5, 2, '#3a2a6a'); s.px(22, 13, '#ffffff'); s.px(18, 17, '#f08aa8'); s.line(16, 18, 18, 19, '#6a5aa8'); s.line(20, 18, 18, 19, '#6a5aa8')
        for k in (-1, 1): s.line(18 + k * 4, 17, 18 + k * 10, 16, bodyl); s.line(18 + k * 4, 18, 18 + k * 10, 19, bodyl)
        s.rect(6, 20, 6, 10, '#8a5a2a'); s.rect(6, 20, 6, 2, '#b07a3a'); s.px(8, 24, '#ffd84a')   # backpack strap/peddler bag
        s.ellipse(22, 29, 4, 3, '#c8a040'); s.px(22, 28, '#fff0a0'); s.hline(20, 24, 26, '#7a5a1a')   # coin pouch
        s.line(28, 26, 33, 20 - f * 2, body); s.ellipse(33, 18 - f * 2, 2, 2, bodyh)   # tail wisp
        s.rect(13, 21, 10, 2, '#c83a5a'); s.px(18, 23, '#ffd84a')   # collar + bell
        s.outline('#3a2a6a'); return s
    P.add('shopcat0', cat(0)); P.add('shopcat1', cat(1))
    s = Spr(60, 26); s.rect(0, 6, 60, 20, '#6a3a1e'); s.rect(0, 2, 60, 6, '#9a5a2e'); s.hline(0, 59, 2, '#c88a4a')
    for x in range(4, 56, 12): s.rect(x, 12, 8, 10, '#4a2812')
    s.rect(6, 0, 6, 3, '#c83a3a'); s.ellipse(28, 1, 4, 2, '#ffd84a'); s.rect(44, -1 + 1, 8, 2, '#3a8ae8'); s.outline('#1a0a04'); P.add('shopcounter', s)
