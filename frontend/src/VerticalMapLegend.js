import {LEGEND_SIZE, TILE_SIZE} from "./Constants";
import {number, shape} from "prop-types";
import React from "react";

function VerticalMapLegend({range}) {
    function normalizedRange(range){
        const r = {...range, startX: Math.floor(range.startX), startY:  Math.floor(range.startY)};
        if(r.startY-range.startY!==0){
            r.deltaY++;
        }
        return r;
    }


    function viewport(range) {
        const deltaY = range.deltaY;
        return <table style={{width: `${LEGEND_SIZE}px`, height: `${(deltaY)*TILE_SIZE}px`, }} className={"legend-left"}>
            <tbody>
                {[...Array(deltaY)].map((_, y) => {
                    let ly = range.startY + y;
                    if(ly<0) ly+=range.height;
                    return <tr key={`vl-${y}`}><th>{(ly%range.height) + 1}</th></tr>;
                })}
            </tbody>
        </table>;
    }



    return viewport(normalizedRange(range));
}

VerticalMapLegend.propTypes = {
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number,
        width: number,
        height: number
    })
};
export default VerticalMapLegend;