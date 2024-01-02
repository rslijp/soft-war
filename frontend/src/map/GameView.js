import {arrayOf, number, shape, string} from "prop-types";
import React from "react";
import WorldMapView from "./WorldMapView";

function GameView({state, range}) {
    return <WorldMapView map={state.map} range={range}/>;
}

GameView.propTypes = {
    state: shape({
        map: shape({
            dimension: shape({
                width: number,
                height: number
            }),
            cities: arrayOf(
                shape({
                    x: number,
                    y: number
                })
            ),
            world: arrayOf(
                arrayOf(
                    shape({
                        tile: string,
                        type: string
                    })
                )
            )
        })
    }),
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number
    })
};
export default GameView;