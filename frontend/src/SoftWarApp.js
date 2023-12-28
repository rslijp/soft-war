import {LEGEND_SIZE, TILE_SIZE, TOP_BAR_HEIGHT} from "./Constants";
import React, {useEffect} from "react";
import AppHeader from "./AppHeader";
import GameComponent from "./GameComponent";


function SoftWarApp() {
    useEffect(() => {
        document.documentElement.style.setProperty(`--tile-size`, TILE_SIZE+"px");
        document.documentElement.style.setProperty(`--legend-size`, LEGEND_SIZE+"px");
        document.documentElement.style.setProperty(`--top-bar-height`, TOP_BAR_HEIGHT+"px");

    }, []);

    return <>
        <AppHeader/>
        <GameComponent/>
    </>;
}

export default SoftWarApp;