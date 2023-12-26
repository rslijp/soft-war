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

export function inflateMap(map){
    const dimensions = map.dimensions;
    const flatWorld = map.world;
    const world = [];
    for(var y=0;y<dimensions.height; y++) {
        const row = [];
        world.push(row);
        for(var x=0;x<dimensions.width; x++) {
            const type = flatWorld[y][x];
            const basicDetail = BASIC_TILES_CLASSES[type];
            const detail = applyVariation(basicDetail);
            row.push({"type" : type, "detail": detail});
        }
    }
    const cities=map.cities.map(c=>{return {"x": c[1], "y": c[0]};});
    return {dimensions: dimensions, cities: cities, world: world};
}