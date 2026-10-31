// Which set of map tiles to show: the original tiles or the generated sprite map
// (css/maptiles-v2.css, made by tools/generate-tileset.py). Remembered per browser.
const STORAGE_KEY = "softwar-tileset";
export const TILESETS = {classic: "Classic tiles", v2: "New tiles"};

export function currentTileset() {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return TILESETS[stored] ? stored : "classic";
    } catch {
        return "classic";
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
