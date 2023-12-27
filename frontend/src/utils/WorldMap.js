const BASIC_TILES_CLASSES = {
    "S": "sea",
    "L": "grass",
    "M": "mountain"
};

const BASIC_VARIATION = {
    "grass": ["grass1", "grass1", "grass2", "grass3"],
    "grass-n-sea": ["grass-n-sea", "grass-n-sea", "grass-n-sea", "grass2-n-sea"],
    "grass-s-sea": ["grass-s-sea", "grass-s-sea", "grass-s-sea", "grass2-s-sea"],
    "grass-e-sea": ["grass-e-sea", "grass-e-sea", "grass-e-sea", "grass2-e-sea"],
    "grass-w-sea": ["grass-w-sea", "grass-w-sea", "grass-w-sea", "grass2-w-sea"]
};

function applyVariation(detail) {
    if (!BASIC_VARIATION[detail]) return detail;
    var mesh = BASIC_VARIATION[detail];
    const choice = Math.floor(Math.random() * mesh.length);
    return mesh[choice];
}

const LAND_SCAPE_TRANSITION_PHASE1 = [
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T3_sw"}
        ],
        pattern: [
            "SSS",
            "XLX",
            "XLS"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T3_se"}
        ],
        pattern: [
            "SSS",
            "XLX",
            "SLX"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T3_nw"}
        ],
        pattern: [
            "XLS",
            "XLX",
            "SSS"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T3_ne"}
        ],
        pattern: [
            "SLX",
            "XLX",
            "SSS"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-w-sea"}
        ],
        pattern: [
            "?L?",
            "XLS",
            "?L?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-e-sea"}
        ],
        pattern: [
            "?L?",
            "SLX",
            "?L?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-s-sea"}
        ],
        pattern: [
            "?X?",
            "LLL",
            "?S?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-n-sea"}
        ],
        pattern: [
            "?S?",
            "LLL",
            "?X?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-se-sea"}
        ],
        pattern: [
            "XXX",
            "XLL",
            "XLS"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "sea-se-grass"}
        ],
        pattern: [
            "?S?",
            "SLL",
            "?LX"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-sw-sea"}
        ],
        pattern: [
            "XXX",
            "LLX",
            "SLX"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "sea-sw-grass"}
        ],
        pattern: [
            "?S?",
            "LLS",
            "XL?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-nw-sea"}
        ],
        pattern: [
            "SLX",
            "LLX",
            "XXX"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "sea-nw-grass"}
        ],
        pattern: [
            "XL?",
            "LLS",
            "?S?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-ne-sea"}
        ],
        pattern: [
            "LLS",
            "XLL",
            "XXL"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "sea-ne-grass"}
        ],
        pattern: [
            "?LX",
            "SLL",
            "?S?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 0, detail: "grass_T-s-sea"}
        ],
        pattern: [
            "XLX",
            "SLS",
            "?X?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 2, detail: "grass_T-n-sea"}
        ],
        pattern: [
            "?L?",
            "SLS",
            "XXX"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 1, detail: "grass_T-e-sea"}
        ],
        pattern: [
            "XS?",
            "XLL",
            "XS?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 2, y: 1, detail: "grass_T-w-sea"}
        ],
        pattern: [
            "?SX",
            "SLX",
            "?SX"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T2-s-sea"}
        ],
        pattern: [
            "SSS",
            "XLX",
            "SLS"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T2-n-sea"}
        ],
        pattern: [
            "SLS",
            "XXX",
            "SSS"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T2-e-sea"}
        ],
        pattern: [
            "SXS",
            "SXL",
            "SXS"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 1, y: 1, detail: "grass_T2-w-sea"}
        ],
        pattern: [
            "SXS",
            "LXS",
            "SXS"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "mountain1_se"},
            {x: 2, y: 1, detail: "mountain1_sw"},
            {x: 1, y: 2, detail: "mountain1_ne"},
            {x: 2, y: 2, detail: "mountain1_nw"}
        ],
        pattern: [
            "?XX?",
            "XMMX",
            "XMMX",
            "?XX?"
        ]
    }

];
const LAND_SCAPE_TRANSITION_PHASE2 = [
    {
        update: [
            {x: 1, y: 1, detail: "mountain1_e"},
            {x: 2, y: 1, detail: "mountain1_w"}
        ],
        pattern: [
            "?XX?",
            "XMMX",
            "?XX?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-ns-sea"}
        ],
        pattern: [
            "?X?",
            "SLS",
            "?X?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-we-sea"}
        ],
        pattern: [
            "?S?",
            "XLX",
            "?S?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-n-end"}
        ],
        pattern: [
            "?S?",
            "SLS"
        ]
    },
    {
        update: [
            {x: 0, y: 1, detail: "grass-e-end"}
        ],
        pattern: [
            "S?",
            "LS",
            "S?"
        ]
    },
    {
        update: [
            {x: 1, y: 0, detail: "grass-s-end"}
        ],
        pattern: [
            "SLS",
            "?S?"
        ]
    },
    {
        update: [
            {x: 1, y: 1, detail: "grass-w-end"}
        ],
        pattern: [
            "?S",
            "SL",
            "?S"
        ]
    },
    {
        change: 0.3,
        update: [
            {x: 1, y: 1, detail: "grass1_1-w-sea"},
            {x: 1, y: 2, detail: "grass1_2-w-sea"}
        ],
        pattern: [
            "?LX",
            "XLS",
            "XLS",
            "?LX"
        ]
    },
    {
        change: 0.3,
        update: [
            {x: 1, y: 1, detail: "grass1_1-e-sea"},
            {x: 1, y: 2, detail: "grass1_2-e-sea"}
        ],
        pattern: [
            "?LX",
            "SLX",
            "SLX",
            "?LX"
        ]
    },
    {
        change: 0.3,
        update: [
            {x: 1, y: 1, detail: "grass1_1-s-sea"},
            {x: 2, y: 1, detail: "grass1_2-s-sea"}
        ],
        pattern: [
            "XXXX",
            "LLLL",
            "?SS?"
        ]
    },
    {
        change: 0.3,
        update: [
            {x: 1, y: 1, detail: "grass1_1-n-sea"},
            {x: 2, y: 1, detail: "grass1_2-n-sea"}
        ],
        pattern: [
            "?SS?",
            "LLLL",
            "XXXX"
        ]
    },
    {
        change: 0.1,
        update: [
            {x: 1, y: 1, detail: "grass_lake1_se"},
            {x: 2, y: 1, detail: "grass_lake1_sw"},
            {x: 1, y: 2, detail: "grass_lake1_ne"},
            {x: 2, y: 2, detail: "grass_lake1_nw"}
        ],
        pattern: [
            "XXXX",
            "XLLX",
            "XLLX",
            "XXXX"
        ]
    },
    {
        change: 0.2,
        update: [
            {x: 1, y: 1, detail: "grass-se-dry"},
            {x: 2, y: 1, detail: "grass-s-dry "},
            {x: 3, y: 1, detail: "grass-sw-dry "},
            {x: 1, y: 2, detail: "grass-e-dry"},
            {x: 2, y: 2, detail: "dry "},
            {x: 3, y: 2, detail: "grass-w-dry "},
            {x: 1, y: 3, detail: "grass-ne-dry"},
            {x: 2, y: 3, detail: "grass-n-dry "},
            {x: 3, y: 3, detail: "grass-nw-dry "},
        ],
        pattern: [
            "XXXXX",
            "XLLLX",
            "XLLLX",
            "XLLLX",
            "XXXXX"
        ]
    }
];


function sweepForTransitions(transitions, world, dimensions) {
    function normalizeX(ux) {
        if (ux >= dimensions.width) ux -= dimensions.width;
        return ux;
    }

    function normalizeY(uy) {
        if (uy >= dimensions.height) uy -= dimensions.height;
        return uy;
    }

    function match(x, y, t) {
        const pattern = t.pattern;
        for (var py = 0; py < pattern.length; py++) {
            const row = pattern[py];
            for (var px = 0; px < row.length; px++) {
                const expected = pattern[py][px];
                const cell = world[normalizeY(y + py)][normalizeX(x + px)];
                if (expected === '?') continue;
                if (expected === 'X' && (cell.type === 'L' || cell.type === 'M')) continue;
                if (expected !== cell.type) return false;
            }
        }
        return true;
    }

    function apply(x, y, t) {
        const shouldApply = t.update.every(u => {
            const cell = world[normalizeY(y + u.y)][normalizeX(x + u.x)];
            if (!t.change && cell.optimized) return false;
            if (t.change && cell.variation) return false;
            return true;
        });
        if (!shouldApply) return;
        if (t.change && Math.random() > t.change) return;
        t.update.forEach(u => {
            const cell = world[normalizeY(y + u.y)][normalizeX(x + u.x)];
            cell.detail = u.detail;
            cell.optimized = true;
            if (t.change) cell.variation = true;
        });

    }

    for (let y = 0; y < dimensions.height; y++) {
        for (let x = 0; x < dimensions.width; x++) {
            transitions.forEach(t => {
                if (match(x, y, t)) apply(x, y, t);
            });
        }
    }
}

function sweepForVariations(world, dimensions) {
    for (var y = 0; y < dimensions.height; y++) {
        for (var x = 0; x < dimensions.height; x++) {
            world[y][x].detail = applyVariation(world[y][x].detail);
        }
    }
}


export function inflateMap(map) {
    const dimensions = map.dimensions;
    const flatWorld = map.world;
    const world = [];
    for (var y = 0; y < dimensions.height; y++) {
        const row = [];
        world.push(row);
        for (var x = 0; x < dimensions.width; x++) {
            const type = flatWorld[y][x];
            row.push({"type": type, "detail": BASIC_TILES_CLASSES[type]});
        }
    }
    const cities = map.cities.map(c => {
        return {"x": c[1], "y": c[0]};
    });
    sweepForTransitions(LAND_SCAPE_TRANSITION_PHASE1, world, dimensions);
    sweepForTransitions(LAND_SCAPE_TRANSITION_PHASE2, world, dimensions);
    sweepForVariations(world, dimensions);
    return {dimensions: dimensions, cities: cities, world: world};
}