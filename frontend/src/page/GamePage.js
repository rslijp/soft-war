import React, {useEffect, useRef, useState} from "react";
import BattleResultsDialog from "./dialogs/BattleResultsDialog";
import ChangeCityProductionDialog from "./dialogs/ChangeCityProductionDialog";
import EndTurnDialog from "./dialogs/EndTurnDialog";
import FlashMessagesDialog from "./dialogs/FlashMessagesDialog";
import GameUnitBar from "./component/GameUnitBar";
import GameView from "./component/GameView";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import MessageBus from "softwar-shared/services/message-service.mjs";
import OrderAttentionDialog from "./dialogs/OrderAttentionDialog";
import OrderConfirmationDialog from "./dialogs/OrderConfirmationDialog";
import OutOfFuelDialog from "./dialogs/OutOfFuelDialog";
import ScrollableViewPort from "../map/ScrollableViewPort";
import SurrenderDialog from "./dialogs/SurrenderDialog";
import {TOP_BAR_HEIGHT} from "../Constants";
import VerticalMapLegend from "../map/VerticalMapLegend";
import VerticalScrollBar from "../map/VerticalScrollBar";
import {saveGame} from "../api/GameStateApi";
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
        console.log(messages);
        setDialog({name: 'messages', messages: messages, hide: true});
        focusOnTile(gameState.position());
    };

    const autoSaveGame = () => {
        console.log("Auto save");
        saveGame(gameState);
    };

    const render = (position)=>{
        if(position) {
            focusOnTile(position);
            return;
        }
        setRenderIteration(stateRef.current.renderIteration+1);
    };

    const unitSelected = (unit) => {
        if(unit) focusOnTile(unit.derivedPosition());
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
        if (unit.player != gameState.currentPlayerIndex) {
            return;
        }
        setDialog({name: 'unit-out-of-fuel', unit: unit});
    };

    const orderAttention = (unit, order) => {
        if (unit.player != gameState.currentPlayerIndex) {
            return;
        }
        setDialog({name: 'order-attention', unit: unit, order: order});
    };

    const confirmOrder = (unit, order) => {
        if (unit.player != gameState.currentPlayerIndex) {
            return;
        }
        setDialog({name: 'confirm-order', unit: unit, order: order});
    };

    const battleResults = (attacker, defender, result) => {
        if (attacker.player != gameState.currentPlayerIndex) {
            return;
        }
        setDialog({name: 'battle-results', attacker: attacker, defender: defender, result: result});
    };

    useEffect(() => {
        const handles = [
            MessageBus.register("new-turn", newTurn, this),
            MessageBus.register("next-turn", autoSaveGame, this),
            MessageBus.register("screen-update", render, this),
            MessageBus.register("cursor-select", focusOnTile, this),
            MessageBus.register("unit-selected", unitSelected, this),
            MessageBus.register("battle-results", battleResults, this),
            MessageBus.register("unit-order-attention", orderAttention, this),
            MessageBus.register("confirm-order", confirmOrder, this),


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
            'battle-results': () => <BattleResultsDialog attacker={dialog.attacker} defender={dialog.defender} result={dialog.result} player={gameState.currentPlayer()} onClose={close}/>,
            'change-city-production': () => <ChangeCityProductionDialog city={dialog.city} onClose={close}/>,
            'order-attention': () => <OrderAttentionDialog unit={dialog.unit}  order={dialog.order} onClose={close}/>,
            'confirm-order': () => <OrderConfirmationDialog unit={dialog.unit}  order={dialog.order} onClose={close}/>
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