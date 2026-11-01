#!/usr/bin/env python3
"""Generate the frayed edge of the fog of war (the black, undiscovered part of the map).

A discovered tile next to undiscovered ones gets one or more of these black, partly
transparent layers on top (see .fog-border in src/css/maptiles.css):
  edge-n/e/s/w     a frayed, speckled band along that side
  corner-nw/...    the rounded inner corner where two undiscovered sides meet
  outer-nw/...     a small frayed patch where only the diagonal tile is undiscovered
The noise repeats every tile, so the layers of neighbouring tiles join without a seam.

Output: content/fog/*.png (2x resolution). Plain Python 3 only. Run from the frontend folder:
  python3 tools/generate-fog.py
"""
import math
import os
import struct
import zlib

OUT_DIR = "content/fog"
SIZE = 90           # 2x the tile size
DEPTH = 22          # how far the fray reaches into the discovered tile
RADIUS = SIZE / 2   # radius of the rounded inner corners


def write_png(path, rgba):
    raw = b"".join(b"\x00" + bytes(rgba[y * SIZE * 4:(y + 1) * SIZE * 4]) for y in range(SIZE))

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xffffffff)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


def hash2(ix, iy, seed):
    h = (ix * 374761393 + iy * 668265263 + seed * 2246822519) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffff) / 65535.0


def noise(x, y, cells, seed):
    """Smooth value noise that repeats every SIZE pixels, also at x = SIZE and y = SIZE."""
    step = SIZE / cells
    fx, fy = x / step, y / step
    ix, iy = math.floor(fx), math.floor(fy)
    tx, ty = fx - ix, fy - iy
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)

    def h(a, b):
        return hash2(a % cells, b % cells, seed)
    top = h(ix, iy) * (1 - tx) + h(ix + 1, iy) * tx
    bottom = h(ix, iy + 1) * (1 - tx) + h(ix + 1, iy + 1) * tx
    return top * (1 - ty) + bottom * ty


def fray(x, y):
    """Shift of the edge: torn shapes plus fine grain for the speckles."""
    torn = 0.55 * noise(x, y, 5, 1) + 0.3 * noise(x, y, 15, 2) + 0.15 * noise(x, y, 30, 3)
    return (torn - 0.5) * DEPTH * 1.1


def speckle(x, y):
    return noise(x, y, 45, 4)


def alpha(distance, x, y):
    """Opacity at a given distance (in pixels) from the undiscovered area."""
    d = distance + fray(x, y)
    if d <= 0:
        return 1.0
    t = d / DEPTH
    if t >= 1:
        return 0.0
    # mostly dark close to the edge, then loose black speckles that thin out
    base = (1 - t) ** 1.6
    grain = speckle(x, y)
    return max(0.0, min(1.0, base * 1.2 + (0.85 if grain < base * 0.55 else 0) - 0.15))


def layer(distance):
    out = bytearray(SIZE * SIZE * 4)
    for y in range(SIZE):
        for x in range(SIZE):
            # pixel centres, in tile coordinates
            cx, cy = x + 0.5, y + 0.5
            a = alpha(distance(cx, cy), cx, cy)
            out[(y * SIZE + x) * 4 + 3] = int(round(255 * a))
    return out


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    layers = {
        "edge-n": lambda x, y: y,
        "edge-s": lambda x, y: SIZE - y,
        "edge-w": lambda x, y: x,
        "edge-e": lambda x, y: SIZE - x,
        # inside the corner quarter, the distance to the quarter circle; elsewhere far away
        "corner-nw": lambda x, y: RADIUS - math.hypot(RADIUS - x, RADIUS - y) if x < RADIUS and y < RADIUS else SIZE,
        "corner-ne": lambda x, y: RADIUS - math.hypot(x - RADIUS, RADIUS - y) if x > RADIUS and y < RADIUS else SIZE,
        "corner-sw": lambda x, y: RADIUS - math.hypot(RADIUS - x, y - RADIUS) if x < RADIUS and y > RADIUS else SIZE,
        "corner-se": lambda x, y: RADIUS - math.hypot(x - RADIUS, y - RADIUS) if x > RADIUS and y > RADIUS else SIZE,
        "outer-nw": lambda x, y: math.hypot(x, y),
        "outer-ne": lambda x, y: math.hypot(SIZE - x, y),
        "outer-sw": lambda x, y: math.hypot(x, SIZE - y),
        "outer-se": lambda x, y: math.hypot(SIZE - x, SIZE - y),
    }
    for name, distance in layers.items():
        write_png(os.path.join(OUT_DIR, name + ".png"), layer(distance))
        print("wrote", os.path.join(OUT_DIR, name + ".png"))


if __name__ == "__main__":
    main()
