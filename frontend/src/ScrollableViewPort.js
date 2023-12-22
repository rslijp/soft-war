import {func, node, number, shape} from "prop-types";
import React from "react";
import {TILE_SIZE} from "./Constants";

function ScrollableViewPort({dimensions, value, onUpdate, children}) {
    // console.log(dimensions, value);
    setTimeout(()=>{
        onUpdate({...value, startX: (value.startX+0.1)%dimensions.width, startY: (value.startY+0.1)%dimensions.height});
    },100);
    const marginTop = Math.round((Math.floor(value.startY)-value.startY)*TILE_SIZE);
    const marginLeft = Math.round((Math.floor(value.startX)-value.startX)*TILE_SIZE);
    return <div className={"map-view-port"}>
        <div className={"map-view-port-canvas"} style={{"marginTop": `${marginTop}px`, "marginLeft": `${marginLeft}px`}}>
            {children}
        </div>
    </div>;
}

ScrollableViewPort.propTypes = {
    dimensions: shape({
        width: number,
        height: number
    }),
    value: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number
    }),
    onUpdate: func,
    children: node
};
export default ScrollableViewPort;