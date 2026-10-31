import {LEGEND_SIZE, TILE_SIZE, TOP_BAR_HEIGHT} from "../Constants";
import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {func, node, number, shape} from "prop-types";

function ScrollableViewPort({dimensions, value, onUpdate, grid, margin}) {
    const [state, setState] = useState({track: false, touch: null});
    const [size, setSize] = useState([0, 0]);
    const canvas = useRef();
    const latest = useRef();
    latest.current = {value, onUpdate, dimensions};
    const effectiveMargin = {west: 0, east: 0, north: 0, south: 0, ...margin};
    useLayoutEffect(() => {
        function updateSize() {
            const width  = window.innerWidth-effectiveMargin.east-effectiveMargin.west;
            const height  = window.innerHeight-effectiveMargin.north-effectiveMargin.south;

            setSize([width, height]);
            onUpdate({...value, deltaX: Math.ceil(width/TILE_SIZE), deltaY: Math.ceil(height/TILE_SIZE)}, true);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Two-finger scroll on a trackpad (and the mouse wheel) arrive as wheel events.
    // The listener is not passive so it can stop the browser from scrolling the page
    // or treating a sideways swipe as back/forward navigation.
    useEffect(() => {
        const element = canvas.current;
        const wrap = (v, size) => ((v % size) + size) % size;
        function onWheel(e) {
            if (e.ctrlKey) return; // pinch to zoom
            e.preventDefault();
            const {value, onUpdate, dimensions} = latest.current;
            const scale = e.deltaMode === 1 ? 16 : 1; // lines instead of pixels
            const dx = e.deltaX * scale / TILE_SIZE;
            const dy = e.deltaY * scale / TILE_SIZE;
            onUpdate({...value, startX: wrap(value.startX + dx, dimensions.width), startY: wrap(value.startY + dy, dimensions.height)});
        }
        element.addEventListener('wheel', onWheel, {passive: false});
        return () => element.removeEventListener('wheel', onWheel);
    }, []);

    const marginTop = Math.round((Math.floor(value.startY)-value.startY)*TILE_SIZE);
    const marginLeft = Math.round((Math.floor(value.startX)-value.startX)*TILE_SIZE);

    function moveViewPortOnMouse(e){
        if(!state.track) return;
        const dx = -e.movementX/10;
        const dy = -e.movementY/10;
        let sx = (value.startX+dx)%dimensions.width;
        if(sx<0) sx=sx+dimensions.width;
        let sy = (value.startY+dy)%dimensions.height;
        if(sy<0) sx=sx+dimensions.height;
        onUpdate({...value, startX: sx, startY: sy});
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
            <div className={"map-view-port-legend"} style={{"top": TOP_BAR_HEIGHT+"px", "left": 0}}>{grid.corner}</div>
            <div className={"map-view-port-horizontal-legend"} style={{"width": `${size[0]-2*LEGEND_SIZE}px`, "marginLeft": `${marginLeft}px`}}>{grid.north}</div>
            <div className={"map-view-port-legend"}  style={{"top": TOP_BAR_HEIGHT+"px", "right": 0}}>{grid.corner}</div>
        </div>
        <div className={"map-view-port-main"} style={{"height": `${size[1]-2*LEGEND_SIZE}px`}}>
            <div className={"map-view-port-vertical-legend"} style={{"marginTop": `${marginTop}px`, "height": `${size[1]-2*LEGEND_SIZE}px`}}>{grid.west}</div>
            <div style={{"width": `${size[0]-2*LEGEND_SIZE}px`, "height": `${size[1]-2*LEGEND_SIZE}px`}}>
                <div className={"map-view-port-canvas"}
                    ref={canvas}
                    onMouseDown={()=>setState({...state, track: true})}
                    onMouseUp={()=>setState({...state, track: false})}
                    onMouseMove={moveViewPortOnMouse}
                    onTouchStart={e=>setState({...state, touch: e.touches[0]})}
                    onTouchEnd={()=>setState({...state, touch: null})}
                    onTouchMove={moveViewPortOnTouch}
                    style={{"marginTop": `${marginTop}px`, "marginLeft": `${marginLeft}px`}}>
                    {grid.center}
                </div>
            </div>
            <div className={"map-view-port-vertical-legend"} style={{"height": `${size[1]-2*LEGEND_SIZE}px`}}>{grid.east}</div>
        </div>
        <div className={"map-view-port-bottom"} style={{"width": `${size[0]}px`, "height": `${LEGEND_SIZE}px`, "bottom": effectiveMargin.south, "position": "fixed"}}>
            <div className={"map-view-port-legend"} style={{"bottom": effectiveMargin.south, "left": effectiveMargin.west}}>{grid.corner}</div>
            <div className={"map-view-port-horizontal-legend"} style={{"width": `${size[0]-2*LEGEND_SIZE}px`}}>{grid.south}</div>
            <div className={"map-view-port-legend"}  style={{"bottom": effectiveMargin.south, "right": effectiveMargin.east}}>{grid.corner}</div>
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
    grid: shape({
        north: node,
        west: node,
        south: node,
        east: node,
        center: node,
        corner: node
    }),
    margin: shape({
        north: number,
        west: number,
        south: number,
        east: number
    }),
    onUpdate: func,
};
export default ScrollableViewPort;