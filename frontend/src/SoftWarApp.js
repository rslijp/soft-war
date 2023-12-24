import {LEGEND_SIZE, TILE_SIZE} from "./Constants";
import React, {useEffect, useState} from "react";
import HorizontalMapLegend from "./HorizontalMapLegend";
import HorizontalScrollBar from "./HorizontalScrollBar";
import ScrollableViewPort from "./ScrollableViewPort";
import VerticalMapLegend from "./VerticalMapLegend";
import WorldMap from "./WorldMap";
import {loadGameState} from "./GameStateLoader";
import VerticalScrollBar from "./VerticalScrollBar";

function SoftWarApp() {
    const [state, setState] = useState('');
    const [gameState, setGameState] = useState(null);
    const [viewPort, setViewPort] = useState({startX: 0, startY: 0, deltaX: 0, deltaY: 0});
    useEffect(() => {
        setState('loading');
        document.documentElement.style.setProperty(`--tile-size`, TILE_SIZE+"px");
        document.documentElement.style.setProperty(`--legend-size`, LEGEND_SIZE+"px");
        loadGameState().then(gameState=>{
            setGameState(gameState);
            const dimensions = gameState.map.dimensions;
            setViewPort({...viewPort, width: dimensions.width, height: dimensions.height});
            setState('ready');
        }).catch(error=>{
            console.error(error);
            setState("error");
        });
    }, []);

    if(state!=="ready"){
        return <p>{state}</p>;
    }

    var grid = {
        corner: <div className={"legend-junction"}></div>,
        north:<HorizontalMapLegend range={viewPort}/>,
        west: <VerticalMapLegend map={gameState.map} range={viewPort}/>,
        south: <HorizontalScrollBar range={viewPort} onUpdate={value=>setViewPort(value)}/>,
        east: <VerticalScrollBar range={viewPort} onUpdate={value=>setViewPort(value)}/>,
        center: <WorldMap map={gameState.map} range={viewPort}/>
    };
    return <>
        <ScrollableViewPort
            dimensions={gameState.map.dimensions}
            value={viewPort}
            onUpdate={value=>setViewPort(value)}
            grid={grid}/>
    </>;
}

export default SoftWarApp;