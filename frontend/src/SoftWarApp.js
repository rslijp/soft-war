import React, {useEffect, useState} from "react";
import ScrollableViewPort from "./ScrollableViewPort";
import {TILE_SIZE} from "./Constants";
import WorldMap from "./WorldMap";
import {loadGameState} from "./GameStateLoader";

function SoftWarApp() {
    const [state, setState] = useState('');
    const [gameState, setGameState] = useState(null);
    const [viewPort, setViewPort] = useState({startX: 0, startY: 0, deltaX: 32, deltaY: 16});
    useEffect(() => {
        setState('loading');
        document.documentElement.style.setProperty(`--tiles-size`, TILE_SIZE+"px");
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
        <ScrollableViewPort dimensions={gameState.map.dimensions} value={viewPort} onUpdate={value=>setViewPort(value)}>
            <WorldMap map={gameState.map} range={viewPort}/>
        </ScrollableViewPort>
    </>;
}

export default SoftWarApp;