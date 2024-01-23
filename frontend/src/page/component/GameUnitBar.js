import {Button, ButtonGroup, Container, Navbar} from "react-bootstrap";
import {any, func} from "prop-types";
import {faChevronRight, faCrosshairs, faFlag, faForwardStep, faIndustry, faMapLocationDot, faPersonMilitaryRifle, faTents, faWater} from "@fortawesome/free-solid-svg-icons";
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

const SPECIAL_MAP = {
    'fortify': faTents,
    'activate': faTents,
    'surface': faWater,
    'dive': faWater
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
        const definition = unit.definition();

        return <span className={"bottom-bar-space"}>{unit.getName()}, health <u>{unit.health}/{unit.definition().health}</u>, moves left <u>{unit.movesLeft}</u>
            {definition.fuel?<span>{" "}fuel <u>{unit.fuel}</u>/{definition.fuel}</span>:null}
        </span>;
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

    const specialActions = (unit) => {
        const action = unit.specialAction?unit.specialAction():null;
        if(!action) return null;
        return <Button
            active={action.value}
            disabled={!action.enabled}
            variant={"outline-secondary"}
            size={"xs"}
            title={action.label}
            onClick={() => {
                unit[action.method]();
                MessageBus.send("screen-update", unit.derivedPosition());
            }}><FontAwesomeIcon icon={SPECIAL_MAP[action.method]}/></Button>;
    };

    const unitBar = (unit) => {
        if (!unit) return;
        const ownUnit = unit.player===currentPlayer.index;
        return <Navbar.Text className={"unit-bar"}>
            <ButtonGroup>
                <Button variant={"outline-secondary"} size={"xs"}
                    onClick={() => MessageBus.send("screen-update", selectedUnit.derivedPosition())}>
                    <FontAwesomeIcon icon={faCrosshairs}/>
                </Button>
                {ownUnit?<Button className="bottom-bar-space" disabled={!selectedUnit} variant={"outline-secondary"} size={"xs"}
                    onClick={() => {
                        gameState.currentPlayer().jumpToNextUnit(selectedUnit);
                    }}><FontAwesomeIcon icon={faChevronRight}/></Button>:null}
            </ButtonGroup>
            <div className={"unit-view "+TYPE_MAP[unit.type]}/>
            {unit.clazz === 'city' ? cityUnit(unit) : regularUnit(unit)}
            {ownUnit?
                <ButtonGroup className="bottom-bar-space">
                    {specialActions(unit)}
                    <Button variant={"outline-secondary"} size={"xs"} title={"move"}
                        onClick={() => MessageBus.send("move-to-mode")}>
                        <FontAwesomeIcon icon={faMapLocationDot}/>
                    </Button>
                    <Button variant={"outline-secondary"} size={"xs"} title={"patrol"}
                        onClick={() => MessageBus.send("patrol-to-mode")}>
                        <FontAwesomeIcon icon={faPersonMilitaryRifle}/>
                    </Button>
                </ButtonGroup>:null}
            {ownUnit?nestedUnits(unit):null}
            {unit.remark&&unit.remark()?" ("+unit.remark()+")":null}
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
                <ButtonGroup className="bottom-bar-space" >
                    <Button variant={"warning"} size={"xs"}
                        onClick={() => MessageBus.send("propose-end-turn")}><FontAwesomeIcon
                            icon={faForwardStep}/></Button>
                    <Button variant={"danger"} size={"xs"}
                        onClick={() => openDialog({name: 'surrender', code: gameState.code})}><FontAwesomeIcon
                            icon={faFlag}/></Button>
                </ButtonGroup>
            </Navbar.Collapse>
        </Container>
    </Navbar>;
}

GameUnitBar.propTypes = {
    gameState: any,
    openDialog: func
};
export default GameUnitBar;