import {Nav, Navbar} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import ScrollableViewPort from "../map/ScrollableViewPort";
import VerticalMapLegend from "../map/VerticalMapLegend";
import WorldMapView from "../map/WorldMapView";
import { useLoaderData} from "react-router";

let timer = null;

// the pixel dissolve of the SoftCause S, as an underline of the title
const DISSOLVE = [1,1,1,1,1,1,1,1,1,1,1,1,0.9,1,0.8,1,0.7,0.9,0,0.6,0.8,0,0.5,0,0.4,0,0.3];

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
    clearTimeout(timer);
    timer = setTimeout(()=>{
        const dimensions = map.dimensions;
        setViewPort({...viewPort, startX: (viewPort.startX+0.05)%dimensions.width, startY: (viewPort.startY+0.05)%dimensions.height});
    },100);
    return <>
        <div className={"demo-blanket"}/>
        <div className={"title-center"}>
            <div className={"content"}>
                <div className={"plaque fc-brackets"}>
                    <div className={"plaque-kicker"}>{"// Operation briefing"}</div>
                    <h1>SOFT<br/>WAR</h1>
                    <div className={"plaque-dissolve"} aria-hidden={"true"}>
                        {DISSOLVE.map((opacity, i) => <span key={i} className={i % 5 === 3 ? "olive" : null} style={{opacity}}/>)}
                    </div>
                    <p>Build cities, raise armies, take the world. A turn-based tribute to the classic Empire.</p>
                    <div className={"plaque-actions"}>
                        <a className={"btn btn-primary"} href={"#/new-game"}>Start a new game</a>
                        <a className={"btn btn-outline-light"} href={"#/your-games"}>Continue a game</a>
                    </div>
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