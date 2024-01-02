import {arrayOf, number, shape, string} from "prop-types";
import {CITY_NAMES} from "softwar-shared";
import React from "react";
import {TILE_SIZE} from "../Constants";
import UnitView from "./UnitView";

function WorldMapView({map, range}) {
    const dimensions = map.dimensions;


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
        const unit = map.unitLookUp[`${x},${y}`];
        const freeCity = unit?null:map.cityLookUp[`${x},${y}`];
        const detail =(entry.detail || entry.type);
        const clazzes = ["land-tile","land-tile-type-" + detail];
        if(unit) console.log(unit);
        return <td key={key} className={clazzes.join(" ")}>
            {unit?<UnitView unit={unit}/>:null}
            {freeCity?<UnitView unit={{name: freeCity.name, type: 'C'}}/>:null}
        </td>;
    }


    function viewport(range, world) {
        const deltaX = range.deltaX;
        const deltaY = range.deltaY;
        return <table style={{width: `${deltaX*TILE_SIZE}px`, height: `${deltaY*TILE_SIZE}px`}}>
            <tbody>
                {[...Array(deltaY)].map((_, y) => {
                    let ly = (range.startY + y) % dimensions.height;
                    if(ly<0) ly+=dimensions.height;
                    const line = world[ly];
                    return <tr key={`row-${y}`}>
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

WorldMapView.propTypes = {
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
export default WorldMapView;