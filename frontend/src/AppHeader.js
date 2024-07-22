import {Badge, Button, Container, Form, NavDropdown, Navbar} from "react-bootstrap";
import React, {useEffect, useRef, useState} from "react";
import {loadUser, logoutUser} from "./api/UserApi";
import {MessageBus} from "softwar-shared";

let timeOutHandle=null;

function AppHeader() {
    const [state, setState] = useState('');
    const [gameState, setGameState] = useState('');
    const [user, setUser] = useState(null);
    const [timer, setTimer] = useState(0);
    const [renderIteration, setRenderIteration] = useState(0);
    const stateRef = useRef();
    stateRef.current = {renderIteration: renderIteration};

    const scheduleRefresh = (seconds)=>{
        if (timeOutHandle) clearTimeout(timeOutHandle);
        timeOutHandle = setInterval(() => setTimer(timer + 1), seconds * 1000);
    };

    const requestRefresh = ()=>{
        setInterval(() => setTimer(timer + 1), 0);
    };

    const onKeyPress = (e) => {
        var key = e.charCode === 0 ? e.keyCode : e.charCode;
        MessageBus.sendLockable("keyboard-key-pressed", key);
    };

    useEffect(() => {
        setState('loading');
        MessageBus.register("refresh-badge", requestRefresh, this, true);

        loadUser().then(user => {
            if (!user) {
                document.location.redirect("/public/auth/");
                return;
            }
            setUser(user);
            setState('ready');
        }).catch(error => {
            console.error(error);
            setState("error");
        });
        return ()=>{
            MessageBus.revoke("refresh-badge", requestRefresh);
        };
    }, [timer]);
    scheduleRefresh(60);

    useEffect(() => {
        const handles = [
            MessageBus.register("update-game-state",setGameState , this, true),
            MessageBus.register("new-turn", render, this, true),
            MessageBus.register("next-turn", render, this, true),
            MessageBus.register("screen-update", render, this, true),
        ];
        return ()=>{
            MessageBus.revokeByHandles(handles);
        };
    }, []);

    const render = ()=>{
        setRenderIteration(stateRef.current.renderIteration+1);
    };

    const logout = () => {
        logoutUser();
        setState('logout');
    };

    function userName(user) {
        return <>{user.picture ? <img src={user.picture} className={"profile-picture"}/> : null}<span className={"responsive-hide"}>Welcome</span> {user.name}</>;
    }

    const pendingActions = () => {
        return user.pendingActions?<Badge bg={"danger"} pill>{user.pendingActions}</Badge>:null;
    };

    console.log(">", renderIteration, gameState);

    return  <Navbar bg="dark" data-bs-theme="dark" className={"top-bar ustify-content-between"} onKeyPress={(e) => onKeyPress(e)} tabIndex={999}>
        <Container fluid>
            <Navbar.Brand href="#/">{state !== "ready" ? "..." : userName(user)}</Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
                {gameState?
                    <Navbar.Text className={"d-flex top-bar-game-control"}>
                        <span className={"turn-info"}><span className={"responsive-hide"}>Turn{" "}</span><span className={"responsive-show"}>#</span><u>{gameState.turn}</u></span>
                        <Form.Check
                            disabled={gameState.currentPlayer().type!="Human"}
                            className={"toggle-auto-next"}
                            type="switch"
                            id="custom-switch"
                            label={<>auto <span className={"responsive-hide"}> play</span></>}
                            checked={gameState.currentPlayer().autoNextFlag}
                            onChange={()=>{
                                gameState.currentPlayer().toggleAutoNext();
                                render();
                            }}
                        />
                    </Navbar.Text>
                    : null}
                {state === "ready" ? <><Navbar.Toggle aria-controls="basic-navbar-nav" className={"justify-content-end top-menu"}/>
                    <NavDropdown title={<>Menu {pendingActions()}</>} align={"end"}>
                        <NavDropdown.Item href={'#/new-game'}>Start a new game</NavDropdown.Item>
                        <NavDropdown.Item href={'#/your-games'}>Continue a game {pendingActions()}</NavDropdown.Item>
                        <NavDropdown.Item href="/public/about">About this game</NavDropdown.Item>
                        <NavDropdown.Divider/>
                        <NavDropdown.Item onClick={logout}> <Button variant="danger">Logout</Button></NavDropdown.Item>
                    </NavDropdown>
                </>: null}
            </Navbar.Collapse>

        </Container>
    </Navbar>;
}

export default AppHeader;