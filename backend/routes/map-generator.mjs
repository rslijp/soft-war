import connection from '../connections.mjs';
import express from 'express';
const router = express.Router();

const MAX_SIZE=128;

const GENERATION_SETTINGS = {
    'REGULAR' : {
        seedFactor: 0.008,
        mountainFactor: 0.2,
        growCycles: 5
    },
    'LANDMASS' : {
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

async function appStates(){
    return connection.collection("app-state");
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
        let t = 0.0;
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                const uy = normalizeY(y + dy);
                const ux = normalizeX(x + dx);
                if (world[uy][ux] === "S") t+=0.1;
                if (world[uy][ux] === "M") t-=0.05;
                if (seen[uy+","+ux]) t-=0.1;
                t+=0.5;
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

router.get('/:type/:dimensions', async function(req, res, next) {
    if(!req.params.type || !req.params.dimensions) {
        res.status("412");
        return;
    }
    const dimensions = req.params.dimensions.split('x');
    if(dimensions.length!=2) {
        res.status("412");
        return;
    }
    try {
        dimensions[0]=parseInt(dimensions[0]);
        dimensions[1]=parseInt(dimensions[1]);
    } catch {
        res.status("412");
        return;
    }
    if(dimensions[0]>MAX_SIZE || dimensions[1]>MAX_SIZE) {
        res.status("412");
        return;
    }
    const [width, height] = dimensions;
    const settings = GENERATION_SETTINGS[req.params.type];
    if(!settings) {
        res.status("412");
        return;
    }
    let world = seed(settings.seedFactor, width, height);
    world = grow(settings.growCycles, world, width, height);
    world = mountains(settings.mountainFactor, world, width, height);
    const cities = generateCities(width+height/2,world, width, height);
    const result = serialize(width, height, world, cities);
    res.send(result).status(200);
});

export default router;