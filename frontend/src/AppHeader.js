import {Button, Container, NavDropdown, Navbar} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {loadUser, logoutUser} from "./api/UserLoader";

function AppHeader() {
    const [state, setState] = useState('');
    const [user, setUser] = useState(null);
    useEffect(() => {
        setState('loading');
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
    }, []);

    const logout = () => {
        logoutUser();
        setState('logout');
    };

    function userName(user) {
        return <>{user.picture ? <img src={user.picture} className={"profile-picture"}/> : null}Welcome {user.name}</>;
    }

    return <Navbar bg="dark" data-bs-theme="dark" className={"top-bar"}>
        <Container>
            <Navbar.Brand href="#/">{state !== "ready" ? "..." : userName(user)}</Navbar.Brand>
            {state === "ready" ? <><Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <NavDropdown title="Menu" id="basic-nav-dropdown" className={"justify-content-end"}
                    drop={"down-centered"} style={{"marginRight": "5rem"}}>
                    <NavDropdown.Item href={'#/new-game'}>Start a new game</NavDropdown.Item>
                    <NavDropdown.Item href={'#/your-games'}>Continue a game</NavDropdown.Item>
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