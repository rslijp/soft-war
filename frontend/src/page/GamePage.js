import React, {useEffect, useRef, useState} from "react";
import BattleResultsDialog from "./dialogs/BattleResultsDialog";
import ChangeCityProductionDialog from "./dialogs/ChangeCityProductionDialog";
import EndTurnDialog from "./dialogs/EndTurnDialog";
import FlashMessagesDialog from "./dialogs/FlashMessagesDialog";
import GameUnitBar from "./component/GameUnitBar";
import GameView from "./component/GameView";
import HorizontalMapLegend from "../map/HorizontalMapLegend";
import HorizontalScrollBar from "../map/HorizontalScrollBar";
import KeyBoardHandler from "./component/KeyBoardHandler";
import {MessageBus} from "softwar-shared";
import OrderAttentionDialog from "./dialogs/OrderAttentionDialog";
import OrderConfirmationDialog from "./dialogs/OrderConfirmationDialog";
import OutOfFuelDialog from "./dialogs/OutOfFuelDialog";
import ScrollableViewPort from "../map/ScrollableViewPort";
import SurrenderDialog from "./dialogs/SurrenderDialog";
import {TOP_BAR_HEIGHT} from "../Constants";
import VerticalMapLegend from "../map/VerticalMapLegend";
import VerticalScrollBar from "../map/VerticalScrollBar";
import {gameSounds} from "../sound/director";
import {isAiDebugView} from "../AiDebugView";
import {useLoaderData} from "react-router";
import {watchGame} from "../api/GameConnection";

let timer = null;

function GamePage() {
    const [dialog, setDialog] = useState(null);
    // the dialog on screen right now (also before React rendered it) and the ones waiting for it
    const dialogRef = useRef(null);
    const pendingDialogs = useRef([]);
    const showDialog = (next) => {
        dialogRef.current = next;
        setDialog(next);
    };
    const queueDialog = (next) => {
        if (dialogRef.current) pendingDialogs.current.push(next);
        else showDialog(next);
    };
    const [state, setState] = useState('initializing');
    const [connection, setConnection] = useState('open');
    const [renderIteration, setRenderIteration] = useState(0);
    const stateRef = useRef();

    const gameState  = useLoaderData();
    gameState.setDebugView(isAiDebugView());
    const map = gameState.world();
    const dimensions = map.dimensions;
    const position = gameState.position();
    const [viewPort, setViewPort] = useState({startX: position.x, startY: position.y, deltaX: 0, deltaY: 0, width: dimensions.width, height: dimensions.height});

    stateRef.current = {state: state, viewPort: viewPort, renderIteration: renderIteration};

    // whose screen this is (gameState.viewer) and whose turn it is can differ in a game between humans
    const myTurn = () => gameState.currentPlayerIndex === gameState.viewer;

    const newTurn = (messages) => {
        // a new turn may propose to end it right away; then that waits until the messages are read
        const current = dialogRef.current;
        pendingDialogs.current = current && current.name === 'end-turn' ? [current] : [];
        showDialog({name: 'messages', messages: messages, hide: true});
        focusOnTile(gameState.position());
    };

    const render = (position)=>{
        if(position) {
            focusOnTile(position);
            return;
        }
        setRenderIteration(stateRef.current.renderIteration+1);
    };

    const focusOnTile = ({x, y}) => {
        // don't follow the AI where the spectator can't see
        const spectator = gameState.spectator();
        if (spectator.index !== gameState.currentPlayerIndex && !spectator.fogOfWar.visible({x, y})) return;
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

    // the game itself ends an AI's turn; this is the question for a human
    const endTurn = () => {
        queueDialog({name: 'end-turn', code: gameState.code});
    };

    const outOfFuel = (unit) => {
        if (unit.player != gameState.viewer) {
            return;
        }
        showDialog({name: 'unit-out-of-fuel', unit: unit});
    };

    const orderAttention = (unit, order) => {
        if (unit.player != gameState.viewer) {
            return;
        }
        showDialog({name: 'order-attention', unit: unit, order: order});
    };

    const confirmOrder = (unit, order) => {
        if (unit.player != gameState.viewer) {
            return;
        }
        showDialog({name: 'confirm-order', unit: unit, order: order});
    };

    const battleResults = (attacker, defender, result) => {
        if (attacker.player != gameState.viewer) {
            return;
        }
        showDialog({name: 'battle-results', attacker: attacker, defender: defender, result: result});
    };

    useEffect(() => {
        const handles = [
            // what the game tells this screen (see api/GameConnection.js)
            MessageBus.register("event:new-turn", newTurn, this),
            MessageBus.register("event:focus", focusOnTile, this),
            MessageBus.register("event:battle-results", battleResults, this),
            MessageBus.register("event:unit-order-attention", orderAttention, this),
            MessageBus.register("event:confirm-order", confirmOrder, this),
            MessageBus.register("event:propose-end-turn", endTurn, this),
            MessageBus.register("event:unit-out-of-fuel", outOfFuel, this),
            MessageBus.register("event:connection-lost", () => setConnection('lost'), this),
            MessageBus.register("event:connection-open", () => setConnection('open'), this),
            MessageBus.register("event:game-closed", gameClosed, this),
            // and what the screen asks itself
            MessageBus.register("screen-update", render, this),
            MessageBus.register("cursor-select", focusOnTile, this),
            MessageBus.register("confirm-order", confirmOrder, this),
            MessageBus.register("propose-end-turn", endTurn, this),
        ];
        return ()=>{
            MessageBus.revokeByHandles(handles);
        };
    }, []);

    useEffect(() => watchGame(), []);
    useEffect(() => gameSounds(gameState), []);


    useEffect(() => {
        if(state !== "ready") return;
        const messages =  [{variant: "danger", text: "But be aware IT IS UNDER CONSTRUCTION"}];
        messages.push("Welcome back. Enjoy the game!");
        gameState.players.forEach((p,i) => messages.push(`Player ${i+1} ${p.name} (${p.type})`));
        if (myTurn()) {
            // starting the turn also selects the first unit
            MessageBus.send("new-turn", messages);
        } else {
            messages.push({variant: "info", text: `It's ${gameState.currentPlayer().name}'s turn. You'll get a dispatch when it's yours.`});
            showDialog({name: 'messages', messages: messages, hide: true});
        }
        focusOnTile(gameState.position(position));
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

    // the game ended or was closed elsewhere (everybody else surrendered, or you're not in it)
    function gameClosed(code, reason) {
        pendingDialogs.current = [];
        showDialog({name: 'game-closed', messages: [{variant: "warning", text: reason || "This game is not available any more."}]});
    }

    const renderDialog=(dialog)=>{
        const close = ()=>{
            // e.g. ending the turn can already have opened the next turn's messages
            if (dialogRef.current !== dialog) return;
            const next = pendingDialogs.current.shift() || null;
            showDialog(next);
            if (!next) MessageBus.send("game-view-focus");
        };
        if (dialog.name === 'game-closed') {
            return <FlashMessagesDialog messages={dialog.messages} onClose={() => document.location.hash = "#/your-games"}/>;
        }
        if(gameState.currentPlayer().type==='AI') return;
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


    const waitingFor = myTurn() ? null : gameState.currentPlayer();
    return <>
        {dialog ? renderDialog(dialog) : null}
        {connection === 'lost' ? <div className={"turn-banner turn-banner-alert"} role={"status"}>Connection lost <span>Reconnecting…</span></div> :
            waitingFor ? <div className={"turn-banner"} role={"status"}>Waiting for {waitingFor.name} <span>{waitingFor.type === 'AI' ? "the AI is moving" : "it's their turn"}</span></div> : null}
        <KeyBoardHandler state={gameState}/>
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
        <GameUnitBar gameState={gameState} openDialog={showDialog}/>
    </>;
}

export default GamePage;