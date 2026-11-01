#!/usr/bin/env python3
"""Generate the map tile set as one sprite map.

Every original tile in tools/tileset-source is reduced to a terrain map (sea, lake,
sand, dry, grass, rock, snow) by colour. Those maps are smoothed and painted
again with procedural textures that repeat every tile, so neighbouring tiles
always continue each other's texture and the grid disappears.

Input:
  tools/tileset-source/*.png        the original 45px tiles (the first tile set, no longer shipped)
  tools/tileset-source/classes.json which tile each land-tile-type-* class shows

Output:
  content/tileset/tileset.png       all tiles in one sprite map (2x resolution)
  src/css/tileset.css               the land-tile-type-* classes for the sprite

Plain Python 3 only (no Pillow/numpy). Run from the frontend folder:
  python3 tools/generate-tileset.py
"""
import json
import math
import os
import struct
import zlib

SOURCE_DIR = "tools/tileset-source"
SOURCE_CLASSES = "tools/tileset-source/classes.json"
OUT_PNG = "content/tileset/tileset.png"
OUT_CSS = "src/css/tileset.css"
SPRITE_URL = "/content/tileset/tileset.png"

SRC = 45        # size of the original tiles
SIZE = 90       # size of the generated tiles (2x for sharp rendering)
COLUMNS = 10    # tiles per row in the sprite map
PAD = 2         # each tile is surrounded by copies of its own edge pixels, so scaling never picks up a neighbour
CELL = SIZE + 2 * PAD

WATER, LAKE, SAND, DRY, GRASS, ROCK, SNOW = "W", "K", "B", "D", "G", "R", "N"


# ---------------------------------------------------------------- PNG in/out

def read_png(path):
    data = open(path, "rb").read()
    pos, idat, palette = 8, b"", None
    while pos < len(data):
        length, = struct.unpack(">I", data[pos:pos + 4])
        kind, chunk = data[pos + 4:pos + 8], data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if kind == b"IHDR":
            width, height, depth, colour, _, _, interlace = struct.unpack(">IIBBBBB", chunk)
        elif kind == b"PLTE":
            palette = chunk
        elif kind == b"IDAT":
            idat += chunk
    assert depth == 8 and interlace == 0, path
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour]
    raw, stride, prev, rows, i = zlib.decompress(idat), width * channels, bytearray(width * channels), [], 0
    for _ in range(height):
        kind = raw[i]
        line = bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        for x in range(stride):
            a = line[x - channels] if x >= channels else 0
            b = prev[x]
            c = prev[x - channels] if x >= channels else 0
            if kind == 1:
                line[x] = (line[x] + a) & 255
            elif kind == 2:
                line[x] = (line[x] + b) & 255
            elif kind == 3:
                line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif kind == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line)
        prev = line
    pixels = []
    for line in rows:
        row = []
        for x in range(width):
            if colour == 3:
                row.append(tuple(palette[line[x] * 3:line[x] * 3 + 3]))
            elif colour in (2, 6):
                row.append(tuple(line[x * channels:x * channels + 3]))
            else:
                row.append((line[x * channels],) * 3)
        pixels.append(row)
    return pixels


def write_png(path, width, height, rgb):
    raw = b"".join(b"\x00" + bytes(rgb[y * width * 3:(y + 1) * width * 3]) for y in range(height))

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xffffffff)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


# ---------------------------------------------------------- periodic noise

def hash2(ix, iy, seed):
    h = (ix * 374761393 + iy * 668265263 + seed * 2246822519) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffff) / 65535.0


def value_noise(cells, seed):
    """Smooth noise on a SIZE x SIZE grid that repeats seamlessly every SIZE pixels."""
    out = [[0.0] * SIZE for _ in range(SIZE)]
    step = SIZE / cells
    for y in range(SIZE):
        fy = y / step
        iy, ty = int(fy), fy - int(fy)
        ty = ty * ty * (3 - 2 * ty)
        for x in range(SIZE):
            fx = x / step
            ix, tx = int(fx), fx - int(fx)
            tx = tx * tx * (3 - 2 * tx)
            x0, x1, y0, y1 = ix % cells, (ix + 1) % cells, iy % cells, (iy + 1) % cells
            top = hash2(x0, y0, seed) * (1 - tx) + hash2(x1, y0, seed) * tx
            bottom = hash2(x0, y1, seed) * (1 - tx) + hash2(x1, y1, seed) * tx
            out[y][x] = top * (1 - ty) + bottom * ty
    return out


def fbm(seed, octaves=((3, 0.5), (6, 0.25), (15, 0.15), (45, 0.10))):
    layers = [(value_noise(cells, seed + i), weight) for i, (cells, weight) in enumerate(octaves)]
    total = sum(w for _, w in layers)
    return [[sum(layer[y][x] * w for layer, w in layers) / total for x in range(SIZE)] for y in range(SIZE)]


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def shade(colour, factor):
    return tuple(c * factor for c in colour)


def smoothstep(e0, e1, v):
    t = max(0.0, min(1.0, (v - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------- terrain maps

def classify(pixel, name):
    r, g, b = pixel
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if name == "snow":
        return SNOW
    if b > r + 25 and b >= g - 5:
        return LAKE if lum > 125 and "lake" in name and name.startswith("grass2") else WATER
    if g > r + 4 and g > b + 15:
        return GRASS
    if lum > 135 and r >= g - 8 and r > b + 20:
        return DRY if "dry" in name else SAND
    if name.startswith("mountain"):
        return ROCK
    return GRASS


def majority(labels):
    out = [row[:] for row in labels]
    for y in range(SRC):
        for x in range(SRC):
            counts = {}
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = min(SRC - 1, max(0, y + dy)), min(SRC - 1, max(0, x + dx))
                    counts[labels[yy][xx]] = counts.get(labels[yy][xx], 0) + 1
            label, count = max(counts.items(), key=lambda kv: kv[1])
            if count >= 5:
                out[y][x] = label
    return out


def blur(field, radius):
    """Box blur, twice (close to a gaussian); edges are clamped so a tile only uses its own pixels."""
    n = len(field)
    for _ in range(2):
        tmp = [[0.0] * n for _ in range(n)]
        for y in range(n):
            for x in range(n):
                tmp[y][x] = sum(field[y][min(n - 1, max(0, x + d))] for d in range(-radius, radius + 1)) / (2 * radius + 1)
        field = [[sum(tmp[min(n - 1, max(0, y + d))][x] for d in range(-radius, radius + 1)) / (2 * radius + 1)
                  for x in range(n)] for y in range(n)]
    return field


def upscale(field):
    """Bilinear resize from SRC to SIZE."""
    out = [[0.0] * SIZE for _ in range(SIZE)]
    scale = SRC / SIZE
    for y in range(SIZE):
        fy = min(SRC - 1.0, max(0.0, (y + 0.5) * scale - 0.5))
        y0 = int(fy)
        y1, ty = min(SRC - 1, y0 + 1), fy - y0
        for x in range(SIZE):
            fx = min(SRC - 1.0, max(0.0, (x + 0.5) * scale - 0.5))
            x0 = int(fx)
            x1, tx = min(SRC - 1, x0 + 1), fx - x0
            top = field[y0][x0] * (1 - tx) + field[y0][x1] * tx
            bottom = field[y1][x0] * (1 - tx) + field[y1][x1] * tx
            out[y][x] = top * (1 - ty) + bottom * ty
    return out


def terrain_field(labels, kinds, radius=2):
    return upscale(blur([[1.0 if labels[y][x] in kinds else 0.0 for x in range(SRC)] for y in range(SRC)], radius))


# In the original tiles a coastline leaves a tile roughly 18 or 72 pixels along the edge, but
# not exactly (14 to 22), so neighbouring tiles showed a small step in the beach. The water
# field is warped near each edge so every crossing lands exactly on one of these positions.
COAST_SNAP = (18.0, 72.0)
# the four lake tiles form one 2x2 lake; its shore crosses the inner edges at these positions
LAKE_SNAP = (38.0, 53.0, 65.0)
COAST_SNAP_RANGE = 8.0
COAST_WARP_DEPTH = 30


def edge_crossings(values):
    found = []
    for i in range(len(values) - 1):
        a, b = values[i], values[i + 1]
        if (a - 0.5) * (b - 0.5) < 0:
            found.append(i + 0.5 + (0.5 - a) / (b - a))
    return found


def edge_warp(values, snap):
    """Piecewise linear map from an aligned position along the edge to the position to sample."""
    points = [(0.0, 0.0)]
    for c in edge_crossings(values):
        target = min(snap, key=lambda t: abs(t - c))
        if abs(target - c) <= COAST_SNAP_RANGE and target > points[-1][0] and c > points[-1][1]:
            points.append((target, c))
    points.append((float(SIZE), float(SIZE)))

    def warp(t):
        for (t0, s0), (t1, s1) in zip(points, points[1:]):
            if t <= t1:
                return s0 + (s1 - s0) * (t - t0) / (t1 - t0)
        return t
    return warp


def sample(field, x, y):
    x, y = min(SIZE - 1.0, max(0.0, x)), min(SIZE - 1.0, max(0.0, y))
    x0, y0 = int(x), int(y)
    x1, y1, tx, ty = min(SIZE - 1, x0 + 1), min(SIZE - 1, y0 + 1), x - x0, y - y0
    top = field[y0][x0] * (1 - tx) + field[y0][x1] * tx
    bottom = field[y1][x0] * (1 - tx) + field[y1][x1] * tx
    return top * (1 - ty) + bottom * ty


def align_coast(field, snap):
    north = edge_warp([field[0][x] for x in range(SIZE)], snap)
    south = edge_warp([field[SIZE - 1][x] for x in range(SIZE)], snap)
    west = edge_warp([field[y][0] for y in range(SIZE)], snap)
    east = edge_warp([field[y][SIZE - 1] for y in range(SIZE)], snap)
    out = [[0.0] * SIZE for _ in range(SIZE)]
    for y in range(SIZE):
        for x in range(SIZE):
            # pixel centres sit at +0.5; the shift fades out towards the middle of the tile
            cx, cy = x + 0.5, y + 0.5
            wn, ws = 1 - smoothstep(0, COAST_WARP_DEPTH, y), 1 - smoothstep(0, COAST_WARP_DEPTH, SIZE - 1 - y)
            ww, we = 1 - smoothstep(0, COAST_WARP_DEPTH, x), 1 - smoothstep(0, COAST_WARP_DEPTH, SIZE - 1 - x)
            sx = cx + wn * (north(cx) - cx) + ws * (south(cx) - cx)
            sy = cy + ww * (west(cy) - cy) + we * (east(cy) - cy)
            out[y][x] = sample(field, sx - 0.5, sy - 0.5)
    return out


# ------------------------------------------------------------------- paint

GRASS_DARK, GRASS_LIGHT = (78, 116, 44), (118, 152, 60)
SEA_DEEP, SEA_SHALLOW = (24, 58, 120), (46, 112, 160)
LAKE_DEEP, LAKE_SHALLOW = (58, 140, 200), (110, 190, 225)
SAND_DARK, SAND_LIGHT = (196, 174, 118), (226, 210, 160)
DRY_DARK, DRY_LIGHT = (150, 132, 80), (190, 170, 112)
ROCK_DARK, ROCK_LIGHT = (88, 78, 70), (150, 140, 128)
SNOW_DARK, SNOW_LIGHT = (205, 215, 228), (246, 248, 252)
FOAM = (236, 240, 236)

GRASS_NOISE = fbm(11, ((6, 0.3), (15, 0.35), (45, 0.35)))
GRASS_GRAIN = value_noise(45, 91)
SEA_NOISE = fbm(23, ((3, 0.5), (9, 0.3), (30, 0.2)))
SAND_NOISE = fbm(37, ((5, 0.4), (18, 0.3), (45, 0.3)))
DRY_NOISE = fbm(41)
ROCK_NOISE = fbm(53, ((5, 0.4), (15, 0.35), (45, 0.25)))
SNOW_NOISE = fbm(67, ((3, 0.6), (9, 0.4)))
PATCH_SHAPE = fbm(71, ((2, 0.6), (5, 0.4)))
PATCH_DETAIL = value_noise(15, 83)


def edge_fade(x, y, margin=30):
    """1 in the middle of the tile, 0 at its border: interior details never touch a neighbour."""
    d = min(x, y, SIZE - 1 - x, SIZE - 1 - y)
    return smoothstep(4, margin, d)


def grass_colour(x, y, variant):
    n = GRASS_NOISE[y][x]
    colour = mix(GRASS_DARK, GRASS_LIGHT, smoothstep(0.3, 0.7, n))
    colour = shade(colour, 0.95 + 0.1 * GRASS_GRAIN[y][x])
    # The variants (placed at random by the map) get a soft patch in the middle that fades out
    # before the border, which breaks up the repetition without creating seams.
    fade = edge_fade(x, y)
    if fade > 0 and variant in (2, 3):
        patch = fade * smoothstep(0.35, 0.65, PATCH_SHAPE[y][x]) * (0.7 + 0.3 * PATCH_DETAIL[y][x])
        target = shade(GRASS_DARK, 0.88) if variant == 2 else mix(GRASS_LIGHT, (150, 166, 78), 0.5)
        colour = mix(colour, target, 0.55 * patch)
    return colour


# Dry ground comes in 3x3 blocks (see LAND_SCAPE_TRANSITION_PHASE2 in shared/view/world-map.mjs).
# The tile name says where the dry centre is, so it tells where the tile sits in the block.
DRY_BLOCK = {"grass-se-dry": (0, 0), "grass-s-dry": (1, 0), "grass-sw-dry": (2, 0),
             "grass-e-dry": (0, 1), "dry": (1, 1), "grass-w-dry": (2, 1),
             "grass-ne-dry": (0, 2), "grass-n-dry": (1, 2), "grass-nw-dry": (2, 2)}


def dry_blob(name):
    """One organic dry patch over the whole 3x3 block; this tile gets its own part of it."""
    bx, by = DRY_BLOCK[name]
    field = [[0.0] * SIZE for _ in range(SIZE)]
    half = 1.5 * SIZE
    for y in range(SIZE):
        for x in range(SIZE):
            u = (bx * SIZE + x + 0.5 - half) / half
            v = (by * SIZE + y + 0.5 - half) / half
            angle = math.atan2(v, u)
            radius = (abs(u) ** 2.6 + abs(v) ** 2.6) ** (1 / 2.6)
            edge = 0.64 + 0.05 * math.sin(3 * angle + 0.7) + 0.04 * math.sin(5 * angle + 2.1) + 0.03 * math.sin(9 * angle + 4.0)
            field[y][x] = 1 - smoothstep(edge - 0.06, edge + 0.06, radius)
    return field


def render_tile(name, pixels):
    labels = majority([[classify(pixels[y][x], name) for x in range(SRC)] for y in range(SRC)])
    variant = {"grass2": 2, "grass3": 3}.get(name, 1)
    water = align_coast(terrain_field(labels, {WATER}), LAKE_SNAP if "lake1" in name else COAST_SNAP)
    lake = terrain_field(labels, {LAKE})
    dry = dry_blob(name) if name in DRY_BLOCK else terrain_field(labels, {DRY}, radius=3)
    rock = terrain_field(labels, {ROCK}, radius=1)
    rock_shadow = terrain_field(labels, {ROCK}, radius=3)
    snow = terrain_field(labels, {SNOW})
    out = bytearray(SIZE * SIZE * 3)
    for y in range(SIZE):
        for x in range(SIZE):
            colour = grass_colour(x, y, variant)
            # dry ground blends softly into the grass
            d = smoothstep(0.35, 0.65, dry[y][x])
            if d > 0:
                dry_colour = mix(DRY_DARK, DRY_LIGHT, DRY_NOISE[y][x])
                colour = mix(colour, dry_colour, d * (0.85 + 0.15 * GRASS_GRAIN[y][x]))
            # mountains: rock with light from the top left and a soft shadow on the ground
            s = rock_shadow[min(SIZE - 1, max(0, y - 4))][min(SIZE - 1, max(0, x - 4))]
            colour = shade(colour, 1 - 0.35 * smoothstep(0.1, 0.6, s) * (1 - smoothstep(0.45, 0.55, rock[y][x])))
            r = smoothstep(0.42, 0.58, rock[y][x])
            if r > 0:
                gx = rock[y][min(SIZE - 1, x + 1)] - rock[y][max(0, x - 1)]
                gy = rock[min(SIZE - 1, y + 1)][x] - rock[max(0, y - 1)][x]
                light = max(0.55, min(1.35, 1 - 2.2 * (gx + gy) + 0.5 * (ROCK_NOISE[y][x] - 0.5)))
                colour = mix(colour, shade(mix(ROCK_DARK, ROCK_LIGHT, ROCK_NOISE[y][x]), light), r)
            # snow
            n = smoothstep(0.45, 0.55, snow[y][x])
            if n > 0:
                colour = mix(colour, mix(SNOW_DARK, SNOW_LIGHT, SNOW_NOISE[y][x]), n)
            # beaches and water: sea and lakes get a sand rim, shallow water and a foam line
            for field, deep, shallow in ((water, SEA_DEEP, SEA_SHALLOW), (lake, LAKE_DEEP, LAKE_SHALLOW)):
                v = field[y][x]
                if v <= 0.06:
                    continue
                sand = smoothstep(0.06, 0.2, v) * (1 - smoothstep(0.47, 0.5, v))
                if sand > 0:
                    colour = mix(colour, mix(SAND_DARK, SAND_LIGHT, SAND_NOISE[y][x]), sand)
                w = smoothstep(0.47, 0.53, v)
                if w > 0:
                    sea = mix(shallow, deep, smoothstep(0.5, 0.95, v) * (0.75 + 0.25 * SEA_NOISE[y][x]))
                    sea = shade(sea, 0.9 + 0.2 * SEA_NOISE[y][x])
                    foam = 0.6 * (1 - smoothstep(0.5, 0.6, v))
                    colour = mix(colour, mix(sea, FOAM, foam), w)
            i = (y * SIZE + x) * 3
            out[i:i + 3] = bytes(max(0, min(255, int(round(c)))) for c in colour)
    return out


# --------------------------------------------------------------------- main

def css_mapping():
    """class name -> tile file (once taken from the stylesheet of the original tiles)."""
    return json.load(open(SOURCE_CLASSES))


def main():
    names = sorted(f[:-4] for f in os.listdir(SOURCE_DIR) if f.endswith(".png"))
    rows = (len(names) + COLUMNS - 1) // COLUMNS
    width, height = COLUMNS * CELL, rows * CELL
    sprite = bytearray(width * height * 3)
    position = {}
    for index, name in enumerate(names):
        col, row = index % COLUMNS, index // COLUMNS
        position[name] = (col, row)
        tile = render_tile(name, read_png(os.path.join(SOURCE_DIR, name + ".png")))
        for y in range(CELL):
            ty = min(SIZE - 1, max(0, y - PAD))
            line = tile[ty * SIZE * 3:(ty + 1) * SIZE * 3]
            line = line[:3] * PAD + line + line[-3:] * PAD
            start = ((row * CELL + y) * width + col * CELL) * 3
            sprite[start:start + CELL * 3] = line
        print(f"{index + 1:3}/{len(names)} {name}")
    write_png(OUT_PNG, width, height, sprite)

    mapping = css_mapping()
    # the plain type classes are only used when a tile has no detail; give them a real tile too
    mapping.update({"S": "sea", "L": "grass1", "M": "mountain1"})
    lines = [
        "/* Generated by tools/generate-tileset.py - do not edit by hand. */",
        "",
        '.land-tile[class*="land-tile-type-"] {',
        f'    background-image: url("{SPRITE_URL}");',
        f"    background-size: calc(var(--tile-size) * {width} / {SIZE}) calc(var(--tile-size) * {height} / {SIZE});",
        "}",
        "",
    ]
    for cls in sorted(mapping):
        col, row = position[mapping[cls]]
        x, y = col * CELL + PAD, row * CELL + PAD
        lines.append(f".land-tile.land-tile-type-{cls} "
                     f"{{ background-position: calc(var(--tile-size) * -{x} / {SIZE}) calc(var(--tile-size) * -{y} / {SIZE}); }}")
    open(OUT_CSS, "w").write("\n".join(lines) + "\n")
    print(f"wrote {OUT_PNG} ({width}x{height}) and {OUT_CSS} ({len(mapping)} classes)")


if __name__ == "__main__":
    main()
