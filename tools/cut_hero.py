#!/usr/bin/env python3
"""Cuts the hero's 8-pose sheets (art/src/kanata_gaiden_sheet_{a,b}.png, 2 rows x 4) into game frames.

  python3 tools/cut_hero.py    -> assets/kanata.png (16 frames in one row: a0..a7, b0..b7) + assets/kanata.json
                                  assets/wisp.png (a blue ghost wisp cut from the sheet, used as a particle/companion)
                                  art/preview_hero.png (x4 preview on dark + light backdrops)

Background removal: flood fill from the sheet edges through 'background' pixels (alpha < 40, or near-white with
alpha < 230) so that white hair / apron highlights inside the outline are never eaten. Components are assigned to a
pose by their centroid cell. Detached small components (ghost wisps) are dropped on idle/move/hurt/down poses
(the game draws its own orbiting wisps) and kept on suck/spit (they are part of the effect).
Feet = bottom of the largest component, x anchor = centre of the head (top 35% of the largest component).
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_H = int(sys.argv[1]) if len(sys.argv) > 1 else 68   # idle pose height in game px (headdress top -> feet)
POSES = ['idle', 'blink', 'move1', 'move2', 'suck', 'spit', 'hurt', 'down']
KEEP_FX = {'suck', 'spit'}

def load(f):
    im = np.array(Image.open(os.path.join(ROOT, 'art/src', f)).convert('RGBA')).astype(np.int32)
    return im

def background_mask(a):
    h, w = a.shape[:2]
    al = a[..., 3]; rgb = a[..., :3]
    whiteish = (rgb.min(axis=2) > 235) & (al < 230)
    bgc = (al < 40) | whiteish
    lab, n = ndimage.label(bgc)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return np.isin(lab, list(edge))

def cut(sheet):
    a = load(sheet); h, w = a.shape[:2]
    bg = background_mask(a)
    fg = ~bg & (a[..., 3] >= 40)
    lab, n = ndimage.label(fg, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    coms = ndimage.center_of_mass(fg, lab, range(1, n + 1))
    cw, ch = w / 4, h / 2
    poses = []
    for i in range(8):
        r, c = divmod(i, 4)
        ids = [k + 1 for k in range(n) if sizes[k] >= 6 and int(coms[k][0] // ch) == r and int(coms[k][1] // cw) == c]
        main = max(ids, key=lambda k: sizes[k - 1])
        keep = ids if POSES[i] in KEEP_FX else [k for k in ids if k == main or sizes[k - 1] > sizes[main - 1] * 0.25]
        mask = np.isin(lab, keep)
        ys, xs = np.nonzero(lab == main)
        feet = ys.max()
        top = ys.min()
        head = (ys < top + (feet - top) * 0.35)
        ax = int(np.median(xs[head]))
        poses.append(dict(name=POSES[i], mask=mask, feet=feet, top=top, ax=ax, ids=ids, main=main))
    return a, poses, lab, sizes

def downscale(a, mask, box, scale):
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1].astype(np.float64)
    m = mask[y0:y1, x0:x1]
    al = np.where(m, sub[..., 3], 0) / 255.0
    pm = sub[..., :3] * al[..., None]
    W = max(1, round((x1 - x0) * scale)); H = max(1, round((y1 - y0) * scale))
    def rs(ch):
        return np.array(Image.fromarray(ch.astype(np.float32), 'F').resize((W, H), Image.BOX))
    A = rs(al)
    rgb = np.stack([rs(pm[..., k]) for k in range(3)], -1) / np.maximum(A[..., None], 1e-6)
    out = np.zeros((H, W, 4), np.uint8)
    on = A > 0.42
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[..., 3] = np.where(on, 255, 0)
    return out

def sharpen(img):
    # small unsharp on colour only, keeps pixel-art punch after the box filter
    from PIL import ImageFilter
    im = Image.fromarray(img, 'RGBA'); rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
    out = np.array(rgb); return np.dstack([out, img[..., 3]])

frames = []
wisp = None
for si, sheet in enumerate(['kanata_gaiden_sheet_a.png', 'kanata_gaiden_sheet_b.png']):
    a, poses, lab, sizes = cut(sheet)
    idle = poses[0]
    scale = TARGET_H / (idle['feet'] - idle['top'] + 1)
    for p in poses:
        ys, xs = np.nonzero(p['mask'])
        # snap the crop box so the anchor lands on an integer game pixel
        inv = 1 / scale
        x0 = p['ax'] - int(np.ceil((p['ax'] - xs.min()) * scale)) * inv
        y1 = p['feet'] + 1
        y0 = y1 - int(np.ceil((y1 - ys.min()) * scale)) * inv
        x1 = p['ax'] + int(np.ceil((xs.max() + 1 - p['ax']) * scale)) * inv
        box = (int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1)))
        img = sharpen(downscale(a, p['mask'], box, scale))
        frames.append(dict(sheet='ab'[si], pose=p['name'], img=img, ax=int(round((p['ax'] - box[0]) * scale)), ay=img.shape[0]))
    if si == 0:  # wisp: the detached blob right of the idle pose
        ids = [k for k in poses[0]['ids'] if k != poses[0]['main']]
        k = max(ids, key=lambda k: sizes[k - 1])
        sl = ndimage.find_objects(lab)[k - 1]
        m = (lab == k)
        box = (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)
        al = np.where(m, a[..., 3], 0); a2 = a.copy(); a2[..., 3] = al
        wisp = downscale(a2, m, box, scale * 1.0)
# uniform frame size around the anchor
L = max(f['ax'] for f in frames); R = max(f['img'].shape[1] - f['ax'] for f in frames)
T = max(f['ay'] for f in frames)
FW, FH = L + R, T + 1
sheet = np.zeros((FH, FW * len(frames), 4), np.uint8)
meta = {'frameWidth': FW, 'frameHeight': FH, 'anchorX': L, 'anchorY': T, 'targetHeight': TARGET_H, 'frames': []}
for i, f in enumerate(frames):
    h, w = f['img'].shape[:2]
    ox = i * FW + L - f['ax']; oy = T - f['ay']
    sheet[oy:oy + h, ox:ox + w] = f['img']
    meta['frames'].append({'i': i, 'sheet': f['sheet'], 'pose': f['pose']})
meta['poses'] = {p: [POSES.index(p), 8 + POSES.index(p)] for p in POSES}
Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'assets/kanata.png'))
Image.fromarray(wisp, 'RGBA').save(os.path.join(ROOT, 'assets/wisp.png'))
json.dump(meta, open(os.path.join(ROOT, 'assets/kanata.json'), 'w'), indent=1)
# preview: frames x3 on dark and on mansion-ish backdrop with baseline
S = 3
pv = Image.new('RGBA', (FW * 8 * S, FH * 2 * S * 2 + 8), (0, 0, 0, 255))
for half, col in enumerate([(38, 30, 58, 255), (196, 186, 170, 255)]):
    bgim = Image.new('RGBA', (FW * 8, FH * 2), col)
    for i, f in enumerate(frames):
        r, c = divmod(i, 8)
        tile = Image.fromarray(sheet[:, i * FW:(i + 1) * FW], 'RGBA')
        bgim.alpha_composite(tile, (c * FW, r * FH))
        for x in range(FW): bgim.putpixel((c * FW + x, r * FH + T), (255, 80, 80, 255)) if x % 2 == 0 else None
        bgim.putpixel((c * FW + L, r * FH + T - 1), (80, 255, 80, 255))
    pv.paste(bgim.resize((FW * 8 * S, FH * 2 * S), Image.NEAREST), (0, half * (FH * 2 * S + 8)))
pv.save(os.path.join(ROOT, 'art/preview_hero.png'))
print('frame', FW, 'x', FH, 'anchor', L, T, 'wisp', wisp.shape)
