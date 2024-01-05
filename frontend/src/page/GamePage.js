import {Button, Container, Navbar} from "react-bootstrap";
import React, {useEffect, useRef, useState} from "react";
import FlashMessagesDialog from "./dialogs/FlashMessagesDialog";
import GameView from "../map/GameView";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import MessageBus from "softwar-shared/services/message-service.mjs";
import ScrollableViewPort from "../map/ScrollableViewPort";
import SurrenderDialog from "./dialogs/SurrenderDialog";
import {TOP_BAR_HEIGHT} from "../Constants";
import VerticalMapLegend from "../map/VerticalMapLegend";
import VerticalScrollBar from "../map/VerticalScrollBar";
import {useLoaderData} from "react-router-dom";

let timer = null;

function GamePage() {
    const [dialog, setDialog] = useState(null);
    const [state, setState] = useState('initializing');
    const stateRef = useRef();

    const gameState  = useLoaderData();
    const map = gameState.world();
    const dimensions = map.dimensions;
    const position = gameState.position();
    const [viewPort, setViewPort] = useState({startX: position.x, startY: position.y, deltaX: 0, deltaY: 0, width: dimensions.width, height: dimensions.height});
    console.log(gameState);
    stateRef.current = {state: state, viewPort: viewPort};

    const newTurn = (messages) => {
        setDialog({name: 'messages', messages: messages, hide: true});
    };

    useEffect(() => {
        console.log("REGISTER");
        MessageBus.register("new-turn", newTurn, this);
        return ()=>{
            console.log("DEREGISTER");
            MessageBus.revoke("new-turn", newTurn);
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
        },0);
    };

    useEffect(() => {
        if(state !== "ready") return;
        console.log("ONCE");
        MessageBus.send("new-turn", ["Welcome back. Enjoy the game!"]);

        focusOnTile(position);
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

    const renderDialog=(dialog)=>{
        const close = ()=>setDialog(null);
        if(dialog.name === 'surrender'){
            return <SurrenderDialog code={dialog.code} onClose={close}/>;
        }
        else if(dialog.name === 'messages'){
            return <FlashMessagesDialog messages={dialog.messages} onClose={close}/>;
        }
        return null;
    };

    return <>
        {dialog ? renderDialog(dialog) : null}
        <ScrollableViewPort
            dimensions={gameState.dimensions()}
            value={viewPort}
            onUpdate={(value, resize)=>{
                setViewPort(value);
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
                    <Button className="d-flex" variant={"danger"} size={"xs"} onClick={()=>setDialog({name: 'surrender', code: gameState.code})}>Surrender</Button>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    </>;
}

export default GamePage;