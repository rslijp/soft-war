import {Button, Container, Navbar} from "react-bootstrap";
import {any, func} from "prop-types";
import {faCrosshairs, faFlag, faForwardStep, faIndustry} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import React from "react";

function GameUnitBar({gameState, openDialog}) {
    const currentPlayer = gameState.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;

    const cityUnit = (unit) => {
        const production = unit.producing();
        return <>
            <span className={"bottom-bar-space"}>{unit.getName()}, producing{" "}
                <u>{production ? (production.name + " " + selectedUnit.production + "/" + production.costs) : null}</u>
            </span>
            <Button variant={"outline-secondary"} size={"xs"}
                onClick={() => openDialog({name: "change-city-production", city: unit})}>
                <FontAwesomeIcon icon={faIndustry}/>
            </Button>
        </>;
    };

    const regularUnit = (unit) => {
        return <span className={"bottom-bar-space"}>{unit.getName()}, moves left <u>{unit.movesLeft}</u></span>;
    };

    const unitBar = (unit) => {
        if (!unit) return;
        return <Navbar.Text className={"unit-bar"}>
            <Button variant={"outline-secondary"} size={"xs"}
                onClick={() => MessageBus.send("cursor-select", selectedUnit.derivedPosition())}>
                <FontAwesomeIcon icon={faCrosshairs}/>
            </Button>
            {unit.clazz === 'city' ? cityUnit(unit) : regularUnit(unit)}
        </Navbar.Text>;
    };


    return <Navbar sticky="bottom" bg="dark" data-bs-theme="dark" className={"bottom-bar"}>
        <Container fluid>
            <Navbar.Collapse className="justify-content-start">
                {unitBar(selectedUnit)}
            </Navbar.Collapse>
            <Navbar.Collapse className="justify-content-end">
                <Navbar.Text className="bottom-bar-space">
                    Turn{" "}<u>{gameState.turn}</u>
                </Navbar.Text>
                <Button className="d-flex bottom-bar-space" variant={"warning"} size={"xs"}
                    onClick={() => MessageBus.send("propose-end-turn")}><FontAwesomeIcon
                        icon={faForwardStep}/></Button>
                <Button className="d-flex bottom-bar-space" variant={"danger"} size={"xs"}
                    onClick={() => openDialog({name: 'surrender', code: gameState.code})}><FontAwesomeIcon
                        icon={faFlag}/></Button>
            </Navbar.Collapse>
        </Container>
    </Navbar>;
}

GameUnitBar.propTypes = {
    gameState: any,
    openDialog: func
};
export default GameUnitBar;