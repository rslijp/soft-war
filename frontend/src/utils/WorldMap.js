const BASIC_TILES_CLASSES = {
    "S": "sea",
    "L": "grass",
    "M": "mountain"
};

const BASIC_VARIATION = {
    "grass": ["grass1", "grass1","grass2", "grass3"]
};

function applyVariation(detail){
    if(!BASIC_VARIATION[detail]) return detail;
    var mesh = BASIC_VARIATION[detail];
    const choice = Math.floor(Math.random()*mesh.length);
    return mesh[choice];
}

const LAND_SCAPE_TRANSITION = [
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-w-sea"}
        ],
        pattern: [
            "?L?",
            "XLS",
            "?L?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-e-sea"}
        ],
        pattern: [
            "?L?",
            "SLX",
            "?L?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-s-sea"}
        ],
        pattern: [
            "?X?",
            "LLL",
            "?S?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-n-sea"}
        ],
        pattern: [
            "?S?",
            "LLL",
            "?X?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-se-sea"}
        ],
        pattern: [
            "XXX",
            "XLL",
            "XLS"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "sea-se-grass"}
        ],
        pattern: [
            "?S?",
            "SLL",
            "?LX"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-sw-sea"}
        ],
        pattern: [
            "XXX",
            "LLX",
            "SLX"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "sea-sw-grass"}
        ],
        pattern: [
            "?S?",
            "LLS",
            "XL?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-nw-sea"}
        ],
        pattern: [
            "SLX",
            "LLX",
            "XXX"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "sea-nw-grass"}
        ],
        pattern: [
            "XL?",
            "LLS",
            "?S?"
        ]
    },
    {
        type: '3x3',
        update: [
            {x: 0, y: 0, detail: "grass-ne-sea"}
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
            {x: 0, y: 0, detail: "sea-ne-grass"}
        ],
        pattern: [
            "?LX",
            "SLL",
            "?S?"
        ]
    }
];

function sweepForTransitions(world, dimensions){
    for(let y=0; y<dimensions.height; y++) {
        for (let x = 0; x < dimensions.width; x++) {
            let lx = x - 1;
            if (lx < 0) lx += dimensions.width;
            let rx = x + 1;
            if (rx >= dimensions.width) rx -= dimensions.width;
            let uy = y - 1;
            if (uy < 0) uy += dimensions.height;
            let by = y + 1;
            if (by >= dimensions.height) by -= dimensions.height;
            const pattern = [world[uy][lx].type, world[uy][x].type, world[uy][rx].type, world[y][lx].type, world[y][x].type, world[y][rx].type, world[by][lx].type, world[by][x].type, world[by][rx].type];
            const flatPattern = pattern.join();
            LAND_SCAPE_TRANSITION.forEach(t => {
                if (!t.optimizedPattern) {
                    t.optimizedPattern = [t.pattern[0][0], t.pattern[0][1], t.pattern[0][2], t.pattern[1][0], t.pattern[1][1], t.pattern[1][2], t.pattern[2][0], t.pattern[2][1], t.pattern[2][2]].join();
                }
                let optimizedPattern = ""+t.optimizedPattern;
                for (var i = 0; i < optimizedPattern.length; i++) {
                    if (optimizedPattern[i] === '?') optimizedPattern=optimizedPattern.substr(0,i)+flatPattern[i]+optimizedPattern.substr(i+1);
                    if (optimizedPattern[i] === 'X' && flatPattern[i]!=='S') optimizedPattern=optimizedPattern.substr(0,i)+flatPattern[i]+optimizedPattern.substr(i+1);
                }
                if (optimizedPattern === flatPattern) {
                    t.update.forEach(u => world[y + u.y][x + u.x].detail = u.detail);
                }
            });
        }
    }
}

function sweepForVariations(world, dimensions){
    for(var y=0;y<dimensions.height; y++) {
        for(var x=0;x<dimensions.height; x++) {
            world[y][x].detail=applyVariation(world[y][x].detail);
        }
    }
}


export function inflateMap(map){
    const dimensions = map.dimensions;
    const flatWorld = map.world;
    const world = [];
    for(var y=0;y<dimensions.height; y++) {
        const row = [];
        world.push(row);
        for(var x=0;x<dimensions.width; x++) {
            const type = flatWorld[y][x];
            row.push({"type" : type, "detail": BASIC_TILES_CLASSES[type]});
        }
    }
    const cities=map.cities.map(c=>{return {"x": c[1], "y": c[0]};});
    sweepForTransitions(world,dimensions);
    sweepForVariations(world,dimensions);
    return {dimensions: dimensions, cities: cities, world: world};
}