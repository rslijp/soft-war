import React, {useEffect, useState} from "react";
import HorizontalMapLegend from "./map/HorizontalMapLegend";
import HorizontalScrollBar from "./map/HorizontalScrollBar";
import ScrollableViewPort from "./map/ScrollableViewPort";
import VerticalMapLegend from "./map/VerticalMapLegend";
import VerticalScrollBar from "./map/VerticalScrollBar";
import WorldMapView from "./map/WorldMapView";
import {inflateMap} from "./model/WorldMap";
import {loadGameState} from "./model/GameStateLoader";

function GameComponent() {
    const [state, setState] = useState('');
    const [gameState, setGameState] = useState(null);
    const [viewPort, setViewPort] = useState({startX: 0, startY: 0, deltaX: 0, deltaY: 0});
    useEffect(() => {
        setState('loading');
        loadGameState().then(gameState=>{
            setGameState(gameState);
            const dimensions = gameState.map.dimensions;
            setViewPort({...viewPort, width: dimensions.width, height: dimensions.height});
            gameState.map = inflateMap(gameState.map);
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
        center: <WorldMapView map={gameState.map} range={viewPort}/>
    };
    return <>
        <ScrollableViewPort
            dimensions={gameState.map.dimensions}
            value={viewPort}
            onUpdate={value=>setViewPort(value)}
            grid={grid}/>
    </>;
}

export default GameComponent;