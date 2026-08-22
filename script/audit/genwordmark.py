"""Generate the alphacode wordmark in the existing 4x7 pixel font.

Cells are 6px. Each glyph is 4 cells wide, 7 tall (y 0..42), placed at a 30px
pitch. 'X' is base ink, '+' the shadow layer, '.' empty. o/p/e/n/c/d were decoded
from the shipping opencode wordmark so the shared letters are unchanged; a/l/h
are new and follow the same construction as their terminal-font counterparts.
"""
CELL = 6
PITCH = 30

GLYPH = {
    # decoded verbatim from the existing wordmark
    "o": ["....", "XXXX", "X..X", "X++X", "X++X", "XXXX", "...."],
    "p": ["....", "XXXX", "X..X", "X++X", "X++X", "XXXX", "X..."],
    "e": ["....", "XXXX", "X..X", "XXXX", "X+++", "XXXX", "...."],
    "c": ["....", "XXXX", "X...", "X+++", "X+++", "XXXX", "...."],
    "d": ["...X", "XXXX", "X..X", "X++X", "X++X", "XXXX", "...."],
    "n": ["....", "XXX.", "X..X", "X++X", "X++X", "X++X", "...."],
    # new: 'a' is the bowl with a crossbar, closed on the right (that closure is
    # what separates it from 'e', which opens right on the same row)
    "a": ["....", "XXXX", "X..X", "XXXX", "X++X", "XXXX", "...."],
    # new: a plain full-height stem, ascender included
    "l": ["X...", "X...", "X...", "X...", "X...", "X...", "...."],
    # new: 'n' with the stem carried up into an ascender
    "h": ["X...", "XXX.", "X..X", "X++X", "X++X", "X++X", "...."],
}

def cells(word, mark):
    """Filled (col,row) cells for one layer across the whole word."""
    out = []
    for gi, ch in enumerate(word):
        rows = GLYPH[ch]
        for r, row in enumerate(rows):
            for c, v in enumerate(row):
                if v == mark:
                    out.append((gi * (PITCH // CELL) + c, r))
    return out

def runs(cellset):
    """Merge horizontally adjacent cells so adjacent rects cannot seam."""
    by_row = {}
    for c, r in cellset:
        by_row.setdefault(r, []).append(c)
    out = []
    for r, cols in sorted(by_row.items()):
        cols.sort()
        start = prev = cols[0]
        for c in cols[1:]:
            if c == prev + 1:
                prev = c; continue
            out.append((start, prev, r)); start = prev = c
        out.append((start, prev, r))
    return out

def path_d(cellset):
    parts = []
    for c0, c1, r in runs(cellset):
        x0, x1 = c0 * CELL, (c1 + 1) * CELL
        y0, y1 = r * CELL, (r + 1) * CELL
        parts.append(f"M{x0} {y0}H{x1}V{y1}H{x0}Z")
    return "".join(parts)

def build(word, split):
    """Three layers, matching the original: a shadow layer across the whole word,
    then the ink split at `split` so the first part renders dimmer than the second
    ("open"/"code" upstream, "alpha"/"code" here)."""
    width = (len(word) - 1) * PITCH + 4 * CELL
    left, right = word[:split], word[split:]
    shift = split * (PITCH // CELL)
    left_cells = cells(left, "X")
    right_cells = [(c + shift, r) for c, r in cells(right, "X")]
    return {
        "width": width,
        "weak": path_d(cells(word, "+")),
        "left": path_d(left_cells),
        "right": path_d(right_cells),
    }

if __name__ == "__main__":
    import json
    print(json.dumps(build("alphacode", 5)))
