#!/usr/bin/env python3
"""v0.4.2: pack the art teammate's final Chronoa / Vel sheets (assets/gaiden_src/, 1:1, right-facing) into the
'gaiden' atlas: assets/gaiden.png + assets/gaiden.json (rect map). Frames keep their full cells so the
README spawn points (cell-local, feet at y=79) stay valid. Chronoa's 64x64 dialogue portrait is cut 1:1 from
her walk frame (the delivery has a 64x64 portrait only for Vel)."""
import json, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC = os.path.join(ROOT, 'assets', 'gaiden_src')
def L(n): return Image.open(os.path.join(SRC, n)).convert('RGBA')
chr_, clk, vel = L('chronoa.png'), L('chronoa_clock.png'), L('vel.png')
parts = []   # (key, image)
for i in range(10): parts.append(('chr%d' % i, chr_.crop((i * 128, 0, i * 128 + 128, 80))))
for i in range(4): parts.append(('clk%d' % i, clk.crop((i * 48, 0, i * 48 + 48, 48))))
for i in range(7): parts.append(('vel%d' % i, vel.crop((i * 64, 0, i * 64 + 64, 80))))
parts.append(('portrait_vel64', L('vel_portrait.png')))
parts.append(('portrait_chronoa64', chr_.crop((128 + 32, 6, 128 + 96, 70))))
parts.append(('watch', chr_.crop((2 * 128 + 103, 53, 2 * 128 + 119, 70))))   # the pocket watch (pendulum bob), cut 1:1 from frame 2
parts.append(('face_chronoa', L('chronoa_face.png'))); parts.append(('face_vel', L('vel_face.png')))
# shelf packing, rows of max width 640
W = 640; x = y = rowh = 0; rects = {}
for k, im in parts:
    if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
    rects[k] = (x, y, im.width, im.height); x += im.width + 1; rowh = max(rowh, im.height)
out = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
for k, im in parts: out.paste(im, rects[k][:2])
out.save(os.path.join(ROOT, 'assets', 'gaiden.png'))
json.dump({k: {'x': r[0], 'y': r[1], 'w': r[2], 'h': r[3]} for k, r in rects.items()}, open(os.path.join(ROOT, 'assets', 'gaiden.json'), 'w'), separators=(',', ':'))
print('gaiden atlas', out.size, len(rects), 'sprites')
