import React, {useEffect, useRef, useState} from "react";
import ChangeCityProductionDialog from "./dialogs/ChangeCityProductionDialog";
import EndTurnDialog from "./dialogs/EndTurnDialog";
import FlashMessagesDialog from "./dialogs/FlashMessagesDialog";
import GameUnitBar from "./component/GameUnitBar";
import GameView from "./component/GameView";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import MessageBus from "softwar-shared/services/message-service.mjs";
import OutOfFuelDialog from "./dialogs/OutOfFuelDialog";
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

    const outOfFuel = (unit) => {
        if (unit.player != gameState.currentPlayer()) {
            return;
        }
        setDialog({name: 'unit-out-of-fuel', unit: unit});
    };

    useEffect(() => {
        const handles = [
            MessageBus.register("new-turn", newTurn, this),
            MessageBus.register("screen-update", render, this),
            MessageBus.register("cursor-select", focusOnTile, this),
            MessageBus.register("propose-end-turn", endTurn, this),
            MessageBus.register("unit-out-of-fuel", outOfFuel, this),
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
        const dialogs = {
            'surrender': () => <SurrenderDialog code={dialog.code} onClose={close}/>,
            'end-turn': () => <EndTurnDialog onClose={close}/>,
            'messages': () => <FlashMessagesDialog messages={dialog.messages} onClose={close}/>,
            'unit-out-of-fuel': () => <OutOfFuelDialog unit={dialog.unit} onClose={close}/>,
            'change-city-production': () => <ChangeCityProductionDialog city={dialog.city} onClose={close}/>
        };
        const builder = dialogs[dialog.name];
        return builder?builder(dialog):null;
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
        <GameUnitBar gameState={gameState} openDialog={setDialog}/>
    </>;
}

export default GamePage;