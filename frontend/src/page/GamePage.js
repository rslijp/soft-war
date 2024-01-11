import {Button, Container, Navbar} from "react-bootstrap";
import React, {useEffect, useRef, useState} from "react";
import { faCrosshairs, faFlag, faForwardStep } from '@fortawesome/free-solid-svg-icons';
import EndTurnDialog from "./dialogs/EndTurnDialog";
import FlashMessagesDialog from "./dialogs/FlashMessagesDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
    const [renderIteration, setRenderIteration] = useState(0);
    const stateRef = useRef();

    const gameState  = useLoaderData();
    const map = gameState.world();
    const dimensions = map.dimensions;
    const position = gameState.position();
    const [viewPort, setViewPort] = useState({startX: position.x, startY: position.y, deltaX: 0, deltaY: 0, width: dimensions.width, height: dimensions.height});

    stateRef.current = {state: state, viewPort: viewPort, renderIteration: renderIteration};

    const newTurn = (messages) => {
        setDialog({name: 'messages', messages: messages, hide: true});
        focusOnTile(gameState.position());
    };

    const render = ()=>{
        setRenderIteration(stateRef.current.renderIteration+1);
    };

    const focusOnTile = ({x, y}) => {
        clearTimeout(timer);
        timer=setTimeout(()=>{
            // console.log({y,x}, currentPlayer.selectedUnit.id);
            const state = stateRef.current.state;
            const viewPort = stateRef.current.viewPort;
            if(state !== "ready") return;
            const sx = x - Math.floor(viewPort.deltaX/2);
            const sy = y - Math.floor(viewPort.deltaY/2)+1;
            setViewPort({...viewPort, startX: sx, startY: sy});
        },0);
    };

    const endTurn = () => {
        setDialog({name: 'end-turn', code: gameState.code});
    };

    useEffect(() => {
        const handles = [
            MessageBus.register("new-turn", newTurn, this),
            MessageBus.register("screen-update", render, this),
            MessageBus.register("cursor-select", focusOnTile, this),
            MessageBus.register("propose-end-turn", endTurn, this)
        ];
        return ()=>{
            MessageBus.revokeByHandles(handles);
        };
    }, []);


    useEffect(() => {
        if(state !== "ready") return;
        const messages =  [{variant: "danger", text: "But be aware IT IS UNDER CONSTRUCTION"}];
        messages.push("Welcome back. Enjoy the game!");
        gameState.players.forEach((p,i) => messages.push(`Player ${i+1} ${p.name} (${p.type})`));
        MessageBus.send("new-turn", messages);
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
        const close = ()=>{
            setDialog(null);
            MessageBus.send("game-view-focus");
        };
        if(dialog.name === 'surrender'){
            return <SurrenderDialog code={dialog.code} onClose={close}/>;
        }
        if(dialog.name === 'end-turn'){
            return <EndTurnDialog onClose={close}/>;
        }
        else if(dialog.name === 'messages'){
            return <FlashMessagesDialog messages={dialog.messages} onClose={close}/>;
        }
        return null;
    };

    const currentPlayer = gameState.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;
    // console.log(selectedUnit);

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
                    {selectedUnit?<Navbar.Text>
                        <Button variant={"outline-secondary"} size={"xs"} onClick={()=>focusOnTile(selectedUnit.derivedPosition())}><FontAwesomeIcon icon={faCrosshairs}/></Button> {selectedUnit.getName()}, moves left <u>{selectedUnit.movesLeft}</u>
                    </Navbar.Text>:null}
                </Navbar.Collapse>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text className="bottom-bar-space">
                        Turn{" "}<u>{ gameState.turn}</u>
                    </Navbar.Text>
                    <Button className="d-flex bottom-bar-space" variant={"warning"} size={"xs"} onClick={()=>MessageBus.send("propose-end-turn")}><FontAwesomeIcon icon={faForwardStep} /></Button>
                    <Button className="d-flex bottom-bar-space" variant={"danger"} size={"xs"} onClick={()=>setDialog({name: 'surrender', code: gameState.code})}><FontAwesomeIcon icon={faFlag} /></Button>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    </>;
}

export default GamePage;