import React, {useLayoutEffect, useState} from "react";
import {func, node, number, shape} from "prop-types";
import {LEGEND_SIZE, TILE_SIZE} from "./Constants";

function ScrollableViewPort({dimensions, value, onUpdate, legend, horizontalLegend, verticalLegend, children}) {
    const [state, setState] = useState({track: false, touch: null});
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

    function moveViewPortOnMouse(e){
        if(!state.track) return;
        const dx = -e.movementX/10;
        const dy = -e.movementY/10;
        onUpdate({...value, startX: (value.startX+dx)%dimensions.width, startY: (value.startY+dy)%dimensions.height});
    }

    function moveViewPortOnTouch(e){
        const start = state.touch;
        const end = e.touches[0];
        if(!start) {
            setState({...state, touch: end});
            return;
        }
        const dx = (start.screenX-end.screenX)/10;
        const dy = (start.screenY-end.screenY)/10;
        setState({...state, touch: end});
        onUpdate({...value, startX: (value.startX+dx)%dimensions.width, startY: (value.startY+dy)%dimensions.height});
    }

    return <div className={"map-view-port"} style={{"width": `${size[0]}px`, "height": `${size[1]}px`}} >
        <div className={"map-view-port-top"} style={{"width": `${size[0]}px`, "height": `${LEGEND_SIZE}px`}}>
            <div className={"map-view-port-legend"} style={{"top": 0, "left": 0}}>{legend}</div>
            <div className={"map-view-port-horizontal-legend"} style={{"width": `${size[0]-2*LEGEND_SIZE}px`, "marginLeft": `${marginLeft}px`}}>{horizontalLegend}</div>
            <div className={"map-view-port-legend"}  style={{"top": 0, "right": 0}}>{legend}</div>
        </div>
        <div className={"map-view-port-main"} style={{"height": `${size[1]-2*LEGEND_SIZE}px`}}>
            <div className={"map-view-port-vertical-legend"} style={{"marginTop": `${marginTop}px`, "height": `${size[1]-2*LEGEND_SIZE}px`}}>{verticalLegend}</div>
            <div style={{"width": `${size[0]-2*LEGEND_SIZE}px`, "height": `${size[1]-2*LEGEND_SIZE}px`}}>
                <div className={"map-view-port-canvas"}
                    onMouseDown={()=>setState({...state, track: true})}
                    onMouseUp={()=>setState({...state, track: false})}
                    onMouseMove={moveViewPortOnMouse}
                    onTouchStart={e=>setState({...state, touch: e.touches[0]})}
                    onTouchEnd={()=>setState({...state, touch: null})}
                    onTouchMove={moveViewPortOnTouch}
                    style={{"marginTop": `${marginTop}px`, "marginLeft": `${marginLeft}px`}}>
                    {children}
                </div>
            </div>
            <div className={"map-view-port-vertical-legend"} style={{"marginTop": `${marginTop}px`, "height": `${size[1]-2*LEGEND_SIZE}px`}}>{verticalLegend}</div>
        </div>
        <div className={"map-view-port-bottom"} style={{"width": `${size[0]}px`, "height": `${LEGEND_SIZE}px`, "bottom": 0, "position": "fixed"}}>
            <div className={"map-view-port-legend"} style={{"bottom": 0, "left": 0}}>{legend}</div>
            <div className={"map-view-port-horizontal-legend"} style={{"width": `${size[0]-2*LEGEND_SIZE}px`, "marginLeft": `${marginLeft}px`}}>{horizontalLegend}</div>
            <div className={"map-view-port-legend"}  style={{"bottom": 0, "right": 0}}>{legend}</div>
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