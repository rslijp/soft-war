import {Nav, Navbar} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import ScrollableViewPort from "../map/ScrollableViewPort";
import VerticalMapLegend from "../map/VerticalMapLegend";
import WorldMapView from "../map/WorldMapView";
import { useLoaderData} from "react-router-dom";

function DemoPage() {
    const demoState = useLoaderData();
    const [viewPort, setViewPort] = useState({startX: 0, startY: 0, deltaX: 0, deltaY: 0});
    useEffect(() => {
        const dimensions = demoState.dimensions();
        setViewPort({...viewPort, width: dimensions.width, height: dimensions.height});
    }, []);
    if(!viewPort.width || !viewPort.height) return null;
    const map = demoState.world();
    var grid = {
        corner: <div className={"legend-junction"}></div>,
        north:<HorizontalMapLegend range={viewPort}/>,
        west: <VerticalMapLegend range={viewPort}/>,
        south: <></>,
        east: <></>,
        center: <WorldMapView map={map} range={viewPort}/>
    };
    setTimeout(()=>{
        const dimensions = map.dimensions;
        setViewPort({...viewPort, startX: (viewPort.startX+0.1)%dimensions.width, startY: (viewPort.startY+0.1)%dimensions.height});
    },100);
    return <>
        <div className={"demo-blanket"}/>
        <div className={"title-center"}>
            <div className={"content"}>
                <div className={"plaque"}>
                    <h1>SoftWar</h1>
                    <p>Start a <a href={"#/new-game"}>new game</a> or <a href={'#/your-games'}>continue</a> and existing game</p>
                </div>
            </div>
        </div>
        <ScrollableViewPort
            dimensions={demoState.dimensions()}
            value={viewPort}
            onUpdate={value=>setViewPort(value)}
            grid={grid}/>
        <Navbar sticky="bottom" bg="dark" data-bs-theme="dark">
            <Nav className="justify-content-center demo-footer">
                Powered by <a href={"http://www.softcause.com"}>SoftCause</a>
            </Nav>
        </Navbar>
    </>;
}

export default DemoPage;