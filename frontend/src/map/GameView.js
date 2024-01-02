import {any, number, shape} from "prop-types";
import React from "react";
import WorldMapView from "./WorldMapView";

function GameView({state, range}) {
    return <WorldMapView map={state.world()} range={range}/>;
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