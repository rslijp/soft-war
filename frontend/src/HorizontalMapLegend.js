import {LEGEND_SIZE, TILE_SIZE} from "./Constants";
import {number, shape} from "prop-types";
import React from "react";

function HorizontalMapLegend({range}) {
    function normalizedRange(range){
        const r = {...range, startX: Math.floor(range.startX), startY:  Math.floor(range.startY)};
        if(r.startX-range.startX!==0){
            r.deltaX++;
        }
        return r;
    }


    function viewport(range) {
        const deltaX = range.deltaX;
        return <table style={{width: `${(deltaX)*TILE_SIZE}px`, height: `${LEGEND_SIZE}px`}} className={"legend-top"}>
            <tbody>
                <tr>
                    {[...Array(deltaX)].map((_, x) => {
                        let lx = range.startX + x;
                        if(lx<0) lx+=range.width;
                        return <th key={`hl-${x}`}>{(lx%range.width)+1}</th>;
                    })}
                </tr>
            </tbody>
        </table>;
    }

    return viewport(normalizedRange(range));
}

HorizontalMapLegend.propTypes = {
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number,
        width: number,
        height: number
    })
};
export default HorizontalMapLegend;