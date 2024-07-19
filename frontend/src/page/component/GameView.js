import React, {useEffect, useRef} from "react";
import {any, number, shape} from "prop-types";
import {MessageBus} from "softwar-shared";
import WorldMapView from "../../map/WorldMapView";

function GameView({state, range}) {
    const currentPlayer = state.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;
    const gameView = useRef();

    const focusView = () => {
        if(gameView.current) gameView.current.blur();
        setTimeout(()=>gameView.current.focus(),0);
    };

    useEffect(() => {
        const handles = [
            MessageBus.register("game-view-focus", focusView, this),
            // MessageBus.register("unit-select", focusOnTile, this),
        ];
        return ()=>{
            MessageBus.revokeByHandles(handles);
        };
    }, []);

    const onKeyPress = (e) => {
        var key = e.charCode === 0 ? e.keyCode : e.charCode;
        MessageBus.sendLockable("keyboard-key-pressed", key);
    };

    return <div ref={gameView} onKeyPress={(e) => onKeyPress(e)} tabIndex={0}>
        <WorldMapView map={state.world()} range={range} selectedUnit={selectedUnit} fogOfWar={currentPlayer.fogOfWar}/>
    </div>;
}

GameView.propTypes = {
    state: any,
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number
    })
};
export default GameView;