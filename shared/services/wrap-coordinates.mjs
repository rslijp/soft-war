// The world wraps around at its edges.
export function wrapAround(value, size) {
    if (value >= size) value -= size;
    if (value < 0) value += size;
    return value;
}

// Only wraps values past the upper edge; negative values are returned unchanged.
export function wrapUpper(value, size) {
    if (value >= size) value -= size;
    return value;
}
