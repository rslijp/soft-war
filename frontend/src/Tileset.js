// Which set of map tiles to show: the generated sprite map (css/maptiles-v2.css, made by
// tools/generate-tileset.py, the default) or the original tiles. Remembered per browser.
const STORAGE_KEY = "softwar-tileset";
const DEFAULT_TILESET = "v2";
export const TILESETS = {classic: "Classic tiles", v2: "New tiles"};

export function currentTileset() {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return TILESETS[stored] ? stored : DEFAULT_TILESET;
    } catch {
        return DEFAULT_TILESET;
    }
}

export function applyTileset(tileset = currentTileset()) {
    document.documentElement.classList.toggle("tileset-v2", tileset === "v2");
}

export function switchTileset() {
    const next = currentTileset() === "v2" ? "classic" : "v2";
    try {
        window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
        // storage blocked: the switch only lasts for this page
    }
    applyTileset(next);
    return next;
}
