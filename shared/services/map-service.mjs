import {unitTypes} from "../game/unit-types.mjs";

const MAX_SIZE=128;

const CITY_FACTOR = 1/128;

const GENERATION_SETTINGS = {
    'REGULAR' : {
        seedFactor: 0.008,
        mountainFactor: 0.2,
        growCycles: 5
    },
    'CONTINENTS' : {
        seedFactor: 0.004,
        mountainFactor: 0.15,
        growCycles: 7
    },
    'ISLANDS' : {
        seedFactor: 0.016,
        mountainFactor: 0.3,
        growCycles: 3
    }
}


function seed(f, width, height){
    const world = Array(height);
    for(var y=0; y<height; y++){
        const row = world[y]= Array(width);
        for(var x=0; x<width; x++){
            const a = Math.random();
            row[x]=a<=f?"L":"S";
        }
    }
    return world;
}

function growCycle(world, width, height){
    const MATRIX_SIZE=3;
    const matrix = [
        [0.6,0.8,0,6],
        [0.8,1.0,0,8],
        [0.6,0.8,0,6]
    ]
    function normalizeX(ux) {
        if (ux >= width) ux -= width;
        return ux;
    }

    function normalizeY(uy) {
        if (uy >= height) uy -= height;
        return uy;
    }

    const temp = Array(height);
    for(var y=0; y<height; y++){
        temp[y]= [].concat(world[y]);
    }
    for(var y=0; y<height; y++){
        for(var x=0; x<width; x++){
            if(world[y][x]==="S") continue;
            for(var dy=0; dy<MATRIX_SIZE; dy++){
                for(var dx=0; dx<MATRIX_SIZE; dx++){
                    const uy = normalizeY(y+dy);
                    const ux = normalizeX(x+dx);
                    const a = Math.random();
                    // console.log("  ?", a,matrix[dy][dx],a<matrix[dy][dx])
                    if(a<matrix[dy][dx]) {
                        temp[uy][ux]="L";
                    }
                }
            }
        }
    }
    return temp;
}

function mountains(f, world, width, height) {
    function normalizeX(ux) {
        if (ux >= width) ux -= width;
        if (ux < 0) ux += width;
        return ux;
    }

    function normalizeY(uy) {
        if (uy >= height) uy -= height;
        if (uy < 0) uy += height;
        return uy;
    }

    for(var y=0; y<height; y++){
        for(var x=0; x<width; x++){
            let t = f;
            let mountain = true
            for(var dy=-1; dy<=1; dy++){
                for(var dx=-1; dx<=1; dx++){
                    const uy = normalizeY(y+dy);
                    const ux = normalizeX(x+dx);
                    if(world[uy][ux]==="S") mountain=false
                    if(world[uy][ux]==="M") t=t*1.2;
                    if(!mountain) break;
                }
            }
            if(mountain && Math.random()<t){
                world[y][x]="M";
            }
        }
    }
    return world;
}

function generateCities(number, world, width, height) {
    const cities = [];
    const seen = {}
    function normalizeX(ux) {
        if (ux >= width) ux -= width;
        if (ux < 0) ux += width;
        return ux;
    }

    function normalizeY(uy) {
        if (uy >= height) uy -= height;
        if (uy < 0) uy += height;
        return uy;
    }

    let left = number;
    while(left>0) {
        const x = Math.floor(Math.random()*width);
        const y = Math.floor(Math.random()*height);
        if (world[y][x] !== "L") continue;
        const key = y+","+x;
        if(seen[key]) continue;
        let t = 0.1;
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                const uy = normalizeY(y + dy);
                const ux = normalizeX(x + dx);
                if (world[uy][ux] === "S") t+=0.15;
                else if (world[uy][ux] === "M") t-=0.05;
                else if (seen[uy+","+ux]) t-=0.2;
                // else t+=0.05;
            }
        }
        if (Math.random() < t) {
            cities.push({x, y});
            seen[key]=true;
            left--;
        }
    }
    return cities;
}


function grow(cycles, world, width, height){
    let result = world;
    for(var c=0; c<cycles; c++){
        result=growCycle(result, width, height);
    }
    return result;
}

function serialize(width, height, world, cities){
    const result = {
        dimensions: {
            width: width,
            height: height
        },
        world: Array(height),
        cities: cities.map(c=>[c.y,c.x])
    }
    for(var y=0; y<height; y++){
        result.world[y]=world[y].join("");
    }
    return result;
}

export function generateMap(type, width, height) {
    try {
        width=parseInt(width);
        height=parseInt(height);
    } catch {
        console.log("MAP GENERATION FAILED Parsing failed of ", width,"or", height);
        return null;
    }
    if(width>MAX_SIZE || height>MAX_SIZE) {
        console.log("MAP GENERATION FAILED", width, "or", height,"is beyond max", MAX_SIZE);
        return null;
    }
    const settings = GENERATION_SETTINGS[type];
    if(!settings) {
        console.log("MAP GENERATION FAILED", type, "is unknown");
        return null;
    }
    console.log("Generating map ",width, height)
    let world = seed(settings.seedFactor, width, height);
    world = grow(settings.growCycles, world, width, height);
    world = mountains(settings.mountainFactor, world, width, height);
    const expectedCities = Math.floor(CITY_FACTOR*width*height);
    const cities = generateCities(expectedCities,world, width, height);
    const result = serialize(width, height, world, cities);
    return result;
}

function pickCity(cities, widthRange, heightRange){
    const candidates = cities.
        filter(c=>widthRange.start<=c[0]&&c[0]<widthRange.end).
        filter(c=>heightRange.start<=c[0]&&c[0]<heightRange.end);

    const pick = Math.floor(Math.random()*candidates.length);
    const position = candidates[pick];
    return {y: position[0], x: position[1], producingType: "T", production: unitTypes['T'].costs}
}

export function generatePlayerList(user, world){
    const cities = world.cities;
    const {width, height} = world.dimensions;

    const players = [{
        id: user.email,
        name: user.name,
        type: "Human",
        units: [],
        cities: [pickCity(cities, {start: 0, end: width/2}, {start: 0, end: height})],
        accepted: true
    },
    {
        id: "ai",
        name: "SkyNet",
        type: "AI",
        units: [],
        cities: [pickCity(cities, {start: width/2, end: width}, {start: 0, end: height})],
        accepted: true
    }];
    return players;
}
// export default {generateMap};