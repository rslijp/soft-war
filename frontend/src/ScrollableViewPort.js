import React, {useLayoutEffect, useState} from "react";
import {func, node, number, shape} from "prop-types";
import {TILE_SIZE} from "./Constants";

function ScrollableViewPort({dimensions, value, onUpdate, legend, horizontalLegend, verticalLegend, children}) {
    const [state, setState] = useState({track: false});
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
            onUpdate({...value, deltaX: Math.ceil(window.innerWidth/TILE_SIZE), deltaY: Math.ceil(window.innerHeight/TILE_SIZE)});
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const marginTop = Math.round((Math.floor(value.startY)-value.startY)*TILE_SIZE);
    const marginLeft = Math.round((Math.floor(value.startX)-value.startX)*TILE_SIZE);

    function moveViewPort(e){
        if(!state.track) return;
        const dx = -e.movementX/10;
        const dy = -e.movementY/10;
        onUpdate({...value, startX: (value.startX+dx)%dimensions.width, startY: (value.startY+dy)%dimensions.height});
    }

    return <div className={"map-view-port"} style={{"width": `${size[0]}px`, "height": `${size[1]}px`}} >
        <div className={"map-view-port-top"}>
            <div className={"map-view-port-legend"}>{legend}</div>
            <div className={"map-view-port-horizontal-legend"} style={{"marginLeft": `${marginLeft}px`}}>{horizontalLegend}</div>
        </div>
        <div className={"map-view-port-main"}>
            <div className={"map-view-port-vertical-legend"} style={{"marginTop": `${marginTop}px`}}>{verticalLegend}</div>
            <div className={"map-view-port-canvas"} onMouseDown={()=>setState({...state, track: true})} onMouseUp={()=>setState({...state, track: false})} onMouseMove={moveViewPort} style={{"marginTop": `${marginTop}px`, "marginLeft": `${marginLeft}px`}}>{children}</div>
        </div>
        <div className={"map-view-port-top"}>
            <div className={"map-view-port-legend"}>{legend}</div>
            <div className={"map-view-port-horizontal-legend"} style={{"marginLeft": `${marginLeft}px`}}>{horizontalLegend}</div>
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
    legend:node,
    horizontalLegend: node,
    verticalLegend: node,
    children: node
};
export default ScrollableViewPort;