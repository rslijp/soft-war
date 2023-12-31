import React, {useEffect, useState} from "react";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import ScrollableViewPort from "../map/ScrollableViewPort";
import VerticalMapLegend from "../map/VerticalMapLegend";
import VerticalScrollBar from "../map/VerticalScrollBar";
import WorldMapView from "../map/WorldMapView";
import {useLoaderData} from "react-router-dom";

function GamePage() {
    const gameState  = useLoaderData();
    const [viewPort, setViewPort] = useState({startX: 0, startY: 0, deltaX: 0, deltaY: 0});
    useEffect(() => {
        if(gameState==null) return;
        const map = gameState.map;
        const dimensions = map.dimensions;
        setViewPort({...viewPort, width: dimensions.width, height: dimensions.height});
    }, []);
    if(!viewPort.width || !viewPort.height) return null;
    var grid = {
        corner: <div className={"legend-junction"}></div>,
        north:<HorizontalMapLegend range={viewPort}/>,
        west: <VerticalMapLegend range={viewPort}/>,
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

export default GamePage;