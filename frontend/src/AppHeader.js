import {Badge, Button, Container, NavDropdown, Navbar} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {loadUser, logoutUser} from "./api/UserApi";
import {MessageBus} from "softwar-shared";

let timeOutHandle=null;

function AppHeader() {
    const [state, setState] = useState('');
    const [user, setUser] = useState(null);
    const [timer, setTimer] = useState(0);

    const scheduleRefresh = (seconds)=>{
        if (timeOutHandle) clearTimeout(timeOutHandle);
        timeOutHandle = setInterval(() => setTimer(timer + 1), seconds * 1000);
    };

    const requestRefresh = ()=>{
        setInterval(() => setTimer(timer + 1), 0);
    };


    useEffect(() => {
        setState('loading');
        MessageBus.register("refresh-badge", requestRefresh, this);

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

    const logout = () => {
        logoutUser();
        setState('logout');
    };

    function userName(user) {
        return <>{user.picture ? <img src={user.picture} className={"profile-picture"}/> : null}Welcome {user.name}</>;
    }

    const pendingActions = () => {
        return user.pendingActions?<Badge bg={"danger"} pill>{user.pendingActions}</Badge>:null;
    };

    return <Navbar bg="dark" data-bs-theme="dark" className={"top-bar"}>
        <Container fluid>
            <Navbar.Brand href="#/">{state !== "ready" ? "..." : userName(user)}</Navbar.Brand>
            {state === "ready" ? <><Navbar.Toggle aria-controls="basic-navbar-nav" className={"justify-content-end top-menu"}/>
                <NavDropdown title={<>Menu {pendingActions()}</>} align={"end"}>
                    <NavDropdown.Item href={'#/new-game'}>Start a new game</NavDropdown.Item>
                    <NavDropdown.Item href={'#/your-games'}>Continue a game {pendingActions()}</NavDropdown.Item>
                    <NavDropdown.Item href="/public/about">About this game</NavDropdown.Item>
                    <NavDropdown.Divider/>
                    <NavDropdown.Item onClick={logout}> <Button variant="danger">Logout</Button></NavDropdown.Item>
                </NavDropdown>
            </>
                : null}
        </Container>
    </Navbar>;
}

export default AppHeader;