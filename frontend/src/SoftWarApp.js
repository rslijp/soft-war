import {DEV_MODE, applyCssConstants} from "./Constants";
import React, {useEffect} from "react";
import {RouterProvider, createHashRouter} from "react-router";
import {loadGameState, loadYourGames} from "./api/GameStateApi";
import AppHeader from "./AppHeader";
import ContinueGamePage from "./page/ContinueGamePage";
import CreateGamePage from "./page/CreateGamePage";
import DemoPage from "./page/DemoPage";
import ErrorPage from "./page/ErrorPage";
import GamePage from "./page/GamePage";
import PendingGamePage from "./page/PendingGamePage";
import {devGameLoader} from "./api/DevGameLoader";
import {installAudioUnlock} from "./sound/audio";
import {installClickSounds} from "./sound/director";
import {installMusic} from "./sound/music";
import {localDemoLoader} from "./api/DemoLoader";

// sound starts on the first click or key press (browsers don't allow it before)
installAudioUnlock();
installMusic();
installClickSounds();

const router = createHashRouter([
    {
        path: "/",
        element: <DemoPage/>,
        loader: localDemoLoader,
        errorElement: <ErrorPage />
    },
    {
        path: "new-game",
        element: <CreateGamePage/>,
        errorElement: <ErrorPage />
    },
    {
        path: "pending-game",
        element: <PendingGamePage/>,
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
    },
    // a local game without backend, see DevGameLoader
    ...(DEV_MODE ? [{
        path: "dev-game",
        element: <GamePage/>,
        loader: devGameLoader,
        errorElement: <ErrorPage />
    }] : [])
]);

function SoftWarApp() {
    useEffect(() => {
        applyCssConstants();
    }, []);

    return <>
        <React.StrictMode>
            <AppHeader/>
            <RouterProvider router={router} />
        </React.StrictMode>
    </>;
}

export default SoftWarApp;