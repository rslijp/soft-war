import {LEGEND_SIZE, TILE_SIZE} from "./Constants";
import React, {useEffect, useState} from "react";
import HorizontalMapLegend from "./HorizontalMapLegend";
import ScrollableViewPort from "./ScrollableViewPort";
import VerticalMapLegend from "./VerticalMapLegend";
import WorldMap from "./WorldMap";
import {loadGameState} from "./GameStateLoader";

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
            setState('ready');
        }).catch(error=>{
            console.error(error);
            setState("error");
        });
    }, []);

    if(state!=="ready"){
        return <p>{state}</p>;
    }

    return <>
        <ScrollableViewPort
            dimensions={gameState.map.dimensions}
            value={viewPort}
            onUpdate={value=>setViewPort(value)}
            legend={<div className={"legend-junction"}></div>}
            horizontalLegend={<HorizontalMapLegend map={gameState.map} range={viewPort}/>}
            verticalLegend={<VerticalMapLegend map={gameState.map} range={viewPort}/>}>
            <WorldMap map={gameState.map} range={viewPort}/>
        </ScrollableViewPort>
    </>;
}

export default SoftWarApp;