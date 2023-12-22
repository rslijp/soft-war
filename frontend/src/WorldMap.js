import {arrayOf, number, shape, string} from "prop-types";
import React from "react";
import {TILE_SIZE} from "./Constants";

function WorldMap({map, range}) {
    const cities = {};
    const dimensions = map.dimensions;
    map.cities.forEach(c => cities[`${c.x},${c.y}`] = true);


    function normalizedRange(range){
        const r = {...range, startX: Math.floor(range.startX), startY:  Math.floor(range.startY)};
        if(r.startX-range.startX!==0){
            r.deltaX++;
        }
        if(r.startY-range.startY!==0){
            r.deltaY++;
        }
        return r;
    }

    function cell(key, x, y, entry){
        const type = cities[`${x},${y}`] ? 'C' : entry.type;
        const clazzes = ["land-tile","land-tile-type-" + type];

        return <td key={key} className={clazzes.join(" ")}>
            {type}
        </td>;
    }


    function viewport(range, world) {
        const deltaX = range.deltaX;
        const deltaY = range.deltaY;
        return <table style={{width: `${deltaX*TILE_SIZE}px`, height: `${deltaY*TILE_SIZE}px`}}>
            <tbody>
                {/*<tr>*/}
                {/*    <th key={"row-h"}></th>*/}
                {/*    {[...Array(deltaX)].map((_, x) => {*/}
                {/*        let lx = range.startX + x;*/}
                {/*        if(lx<0) lx+=dimensions.width;*/}
                {/*        return <th key={`cell-hx${x}`}>{lx + 1}</th>;*/}
                {/*    })}*/}
                {/*</tr>*/}
                {[...Array(deltaY)].map((_, y) => {
                    let ly = (range.startY + y) % dimensions.height;
                    if(ly<0) ly+=dimensions.height;
                    const line = world[ly];
                    return <tr key={`row-${y}`}>
                        {/*<th key={`cell-${y}xh`}>{ly + 1}</th>*/}
                        {[...Array(deltaX)].map((_, x) => {
                            let lx = (range.startX + x) % dimensions.width;
                            if(lx<0) lx+=dimensions.width;
                            return cell(`cell-${y}x${x}`,lx,ly, line[lx]);
                        })}
                    </tr>;
                })}
            </tbody>
        </table>;
    }



    return viewport(normalizedRange(range), map.world);
}

WorldMap.propTypes = {
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number
    }),
    map: shape({
        dimension: shape({
            width: number,
            height: number
        }),
        cities: arrayOf(
            shape({
                x: number,
                y: number
            })
        ),
        world: arrayOf(
            arrayOf(
                shape({
                    tile: string,
                    type: string
                })
            )
        )
    }),
};
export default WorldMap;