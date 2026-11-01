// The map on the sign-in page (public/auth): a freshly generated world in the real map tiles,
// slowly scrolling inside the recon panel. Plain DOM, no React, to keep this bundle small.
import './css/tileset.css';
import './css/units.css';
import {decorateMap, deserializeGameState, generateMap} from "softwar-shared";

const TILE = 44;
const SPEED = 0.45; // tiles per second, diagonally

function start(container) {
    const raw = generateMap('REGULAR', 32, 32);
    const world = deserializeGameState({map: raw, players: []}).world();
    decorateMap(world);
    const {width, height} = world.dimensions;
    const cities = new Set(raw.cities.map(([y, x]) => `${y}_${x}`));

    container.style.setProperty("--tile-size", TILE + "px");
    container.style.setProperty("--unit-size", (TILE - 2) + "px");

    // one tile more than fits in each direction, so the edge never shows while sliding
    const columns = Math.ceil(container.clientWidth / TILE) + 1;
    const rows = Math.ceil(container.clientHeight / TILE) + 1;
    const grid = document.createElement("div");
    grid.className = "login-map";
    grid.style.gridTemplateColumns = `repeat(${columns}, ${TILE}px)`;
    const cells = [];
    for (let i = 0; i < columns * rows; i++) {
        const cell = document.createElement("div");
        const city = document.createElement("div");
        city.className = "unit-view city";
        cell.appendChild(city);
        grid.appendChild(cell);
        cells.push({cell, city});
    }
    container.replaceChildren(grid);

    let shown = null;
    function draw(startX, startY) {
        const x0 = Math.floor(startX), y0 = Math.floor(startY);
        if (shown !== `${x0}_${y0}`) {
            shown = `${x0}_${y0}`;
            cells.forEach(({cell, city}, i) => {
                const y = (y0 + Math.floor(i / columns)) % height;
                const x = (x0 + i % columns) % width;
                const entry = world.world[y][x];
                cell.className = "land-tile land-tile-type-" + (entry.detail || entry.type).trim();
                city.style.display = cities.has(`${y}_${x}`) ? "" : "none";
            });
        }
        grid.style.transform = `translate(${-(startX - x0) * TILE}px, ${-(startY - y0) * TILE}px)`;
    }

    // start with a city in the middle, so the first view isn't just sea
    const [cy, cx] = raw.cities[Math.floor(Math.random() * raw.cities.length)] || [0, 0];
    const origin = {x: (cx - columns / 2 + width) % width, y: (cy - rows / 2 + height) % height};
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        draw(origin.x, origin.y);
        return;
    }
    const began = performance.now();
    function frame(now) {
        const travelled = (now - began) / 1000 * SPEED;
        draw((origin.x + travelled) % width, (origin.y + travelled) % height);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

const container = document.getElementById("login-map");
if (container) start(container);
