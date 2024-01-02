import {Button, Container, Navbar} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import GameView from "../map/GameView";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import ScrollableViewPort from "../map/ScrollableViewPort";
import SurrenderDialog from "./dialogs/SurrenderDialog";
import {TOP_BAR_HEIGHT} from "../Constants";
import VerticalMapLegend from "../map/VerticalMapLegend";
import VerticalScrollBar from "../map/VerticalScrollBar";
import {useLoaderData} from "react-router-dom";


function GamePage() {
    const [dialog, setDialog] = useState('');

    const gameState  = useLoaderData();

    const [viewPort, setViewPort] = useState({startX: gameState.position().x, startY: gameState.position().y, deltaX: 0, deltaY: 0});
    useEffect(() => {
        if(gameState==null) return;
        const map = gameState.world();
        const dimensions = map.dimensions;
        console.log(gameState.position());
        setViewPort({...viewPort, width: dimensions.width, height: dimensions.height});
        console.log("REGISTER");
        return ()=>{
            console.log("DEREGISTER");
        };
    }, []);

    if(!viewPort.width || !viewPort.height) return null;

    var grid = {
        corner: <div className={"legend-junction"}></div>,
        north:<HorizontalMapLegend range={viewPort}/>,
        west: <VerticalMapLegend range={viewPort}/>,
        south: <HorizontalScrollBar range={viewPort} onUpdate={value=>setViewPort(value)}/>,
        east: <VerticalScrollBar range={viewPort} onUpdate={value=>setViewPort(value)}/>,
        center: <GameView state={gameState} range={viewPort}/>
    };
    return <>
        {dialog === 'surrender' ? <SurrenderDialog code={gameState.code} onClose={()=>setDialog('')}/> : null}
        <ScrollableViewPort
            dimensions={gameState.dimensions()}
            value={viewPort}
            onUpdate={value=>setViewPort(value)}
            grid={grid}
            margin={{north: TOP_BAR_HEIGHT, south: TOP_BAR_HEIGHT}}
        />
        <Navbar sticky="bottom" bg="dark" data-bs-theme="dark" className={"bottom-bar"}>
            <Container fluid>
                <Navbar.Collapse className="justify-content-start">
                    <Navbar.Text>
                        Turn <u>{gameState.turn}</u>
                    </Navbar.Text>
                </Navbar.Collapse>
                <Navbar.Collapse className="justify-content-end">
                    <Button className="d-flex" variant={"danger"} size={"xs"} onClick={()=>setDialog('surrender')}>Surrender</Button>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    </>;
}

export default GamePage;