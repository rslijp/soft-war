import {LEGEND_SIZE, TILE_SIZE, TOP_BAR_HEIGHT} from "./Constants";
import React, {useEffect} from "react";
import {
    RouterProvider,
    createHashRouter,
} from "react-router-dom";
import {loadGameState, loadYourGames} from "./api/GameStateLoader";
import AppHeader from "./AppHeader";
import ContinueGamePage from "./page/ContinueGamePage";
import CreateGamePage from "./page/CreateGamePage";
import DemoPage from "./page/DemoPage";
import ErrorPage from "./page/ErrorPage";
import GamePage from "./page/GamePage";
import {demoLoader} from "./api/DemoLoader";

const router = createHashRouter([
    {
        path: "/",
        element: <DemoPage/>,
        loader: demoLoader,
        errorElement: <ErrorPage />
    },
    {
        path: "new-game",
        element: <CreateGamePage/>,
        errorElement: <ErrorPage />
    },
    {
        path: "your-games",
        element: <ContinueGamePage/>,
        loader: loadYourGames,
        errorElement: <ErrorPage />
    },
    {
        path: "game/:code",
        element: <GamePage/>,
        loader: (context)=>loadGameState(context.params.code),
        errorElement: <ErrorPage />
    }
]);

function SoftWarApp() {
    useEffect(() => {
        document.documentElement.style.setProperty(`--tile-size`, TILE_SIZE+"px");
        document.documentElement.style.setProperty(`--legend-size`, LEGEND_SIZE+"px");
        document.documentElement.style.setProperty(`--top-bar-height`, TOP_BAR_HEIGHT+"px");

    }, []);

    return <>
        <React.StrictMode>
            <AppHeader/>
            <RouterProvider router={router} />
        </React.StrictMode>
    </>;
}

export default SoftWarApp;