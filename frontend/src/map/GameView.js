import {any, number, shape} from "prop-types";
import React from "react";
import WorldMapView from "./WorldMapView";

function GameView({state, range}) {
    const currentPlayer = state.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;
    return <div onKeyUp={()=>alert('y')} tabIndex={0}>
        <WorldMapView map={state.world()} range={range} selectedUnit={selectedUnit}/>
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