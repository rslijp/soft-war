import {Button, Container, Navbar, Spinner} from "react-bootstrap";
import React, {useEffect, useRef, useState} from "react";
import GameView from "../map/GameView";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import ScrollableViewPort from "../map/ScrollableViewPort";
import SurrenderDialog from "./dialogs/SurrenderDialog";
import {TOP_BAR_HEIGHT} from "../Constants";
import VerticalMapLegend from "../map/VerticalMapLegend";
import VerticalScrollBar from "../map/VerticalScrollBar";
import {useLoaderData} from "react-router-dom";

let timer = null;

function GamePage() {
    const [dialog, setDialog] = useState('');
    const [state, setState] = useState('initializing');
    const stateRef = useRef();

    const gameState  = useLoaderData();
    const map = gameState.world();
    const dimensions = map.dimensions;
    const position = gameState.position();
    const [viewPort, setViewPort] = useState({startX: position.x, startY: position.y, deltaX: 0, deltaY: 0, width: dimensions.width, height: dimensions.height});

    stateRef.current = {state: state, viewPort: viewPort};

    useEffect(() => {
        console.log("REGISTER");
        return ()=>{
            console.log("DEREGISTER");
        };
    }, []);

    const focusOnTile = ({x, y}) => {
        clearTimeout(timer);
        timer=setTimeout(()=>{
            const state = stateRef.current.state;
            const viewPort = stateRef.current.viewPort;
            if(state !== "ready") return;
            const sx = x - Math.floor(viewPort.deltaX/2);
            const sy = y - Math.floor(viewPort.deltaY/2)+1;
            setViewPort({...viewPort, startX: sx, startY: sy});
        },100);
    };

    useEffect(() => {
        if(state !== "ready") return;
        clearTimeout(timer);
        timer = setTimeout(function(){
            focusOnTile(position);
        },0);
    }, [state]);

    if(viewPort.deltaX && viewPort.deltaY && state === 'initializing') setState("ready");

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
            onUpdate={(value, resize)=>{
                setViewPort(value);
                console.log(value, resize);
                if(resize) focusOnTile(gameState.position());
            }}
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