import {Button, Container, Navbar} from "react-bootstrap";
import {any, func} from "prop-types";
import {faCrosshairs, faFlag, faForwardStep, faIndustry} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import React from "react";

const TYPE_MAP = {
    'C' : 'city',
    'I' : 'infantry',
    'T' : 'tank',
    'M' : 'truck',
    'F' : 'fighter',
    'B' : 'bomber',
    'H' : 'helicopter',
    'D' : 'destroyer',
    'c' : 'cruiser',
    'A' : 'aircraftcarrier',
    'S' : 'submarine',
    'm' : 'missile',
    't' : 'transport',
    'b' : 'battleship',
};


function GameUnitBar({gameState, openDialog}) {
    const currentPlayer = gameState.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;

    const cityUnit = (unit) => {
        const production = unit.producing();
        return <>
            <span className={"bottom-bar-space"}>{unit.getName()}, producing{" "}
                <u>{production ? (production.name + " " + selectedUnit.production + "/" + production.costs) : "nothing"}</u>
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

    const nestedUnits = (unit) => {
        if (!unit || !unit.capacity) return;
        var slots = new Array(unit.capacity);
        for(var i=0; i<slots.length; i++){
            slots[i]=unit.nestedUnits[i]||null;
        }
        return <div className={"nested-unit-slots"}>
            {slots.map((s,i)=><div key={i} className={"nested-unit-slot"}>{
                s?<div className={"unit-view "+TYPE_MAP[s.type]}
                    onClick={() => MessageBus.send("select-unit", s)}
                />:null}
            </div>)}
        </div>;
    };

    const unitBar = (unit) => {
        if (!unit) return;
        return <Navbar.Text className={"unit-bar"}>
            <div className={"unit-view "+TYPE_MAP[unit.type]}/>
            <Button variant={"outline-secondary"} size={"xs"}
                onClick={() => MessageBus.send("cursor-select", selectedUnit.derivedPosition())}>
                <FontAwesomeIcon icon={faCrosshairs}/>
            </Button>
            {unit.clazz === 'city' ? cityUnit(unit) : regularUnit(unit)}
            {nestedUnits(unit)}
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
                <Button className="bottom-bar-space" variant={"warning"} size={"xs"}
                    onClick={() => MessageBus.send("propose-end-turn")}><FontAwesomeIcon
                        icon={faForwardStep}/></Button>
                <Button className="bottom-bar-space" variant={"danger"} size={"xs"}
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