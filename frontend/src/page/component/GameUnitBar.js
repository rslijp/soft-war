import {Button, ButtonGroup, Container, Navbar} from "react-bootstrap";
import {any, func} from "prop-types";
import {
    faChevronRight,
    faCrosshairs,
    faFlag,
    faForwardStep,
    faIndustry
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import GameUnitActionsToolTip from "./GameUnitActionsToolTip";
import GameUnitNestedUnitsToolTip from "./GameUnitNestedUnitsToolTip";
import {MessageBus} from "softwar-shared";
import React from "react";
import {TYPE_MAP} from "./UnitTypesConstants";



function GameUnitBar({gameState, openDialog}) {
    const currentPlayer = gameState.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;

    const onKeyPress = (e) => {
        var key = e.charCode === 0 ? e.keyCode : e.charCode;
        MessageBus.sendLockable("keyboard-key-pressed", key);
    };


    const cityUnit = (unit) => {
        const production = unit.producing();
        const ownUnit = unit.player===currentPlayer.index;
        return <>
            <span className={"bottom-bar-space"}><span className={"responsive-show"}>{unit.getShortName()}</span><span className={"responsive-hide"}>{unit.getName()}</span>, <span className={"responsive-hide"}>producing</span>  {" "}
                <u>{production ? (production.name + " " + selectedUnit.production + "/" + production.costs) : "nothing"}</u>
            </span>
            {ownUnit?<ButtonGroup className="bottom-bar-space">
                <Button variant={"outline-secondary"} size={"xs"}
                    onClick={() => openDialog({name: "change-city-production", city: unit})}>
                    <FontAwesomeIcon icon={faIndustry}/>
                </Button>
                <GameUnitNestedUnitsToolTip unit={unit}/>
            </ButtonGroup>:null}
        </>;
    };

    const regularUnit = (unit) => {
        const definition = unit.definition();

        return <span className={"bottom-bar-space"}><u>{unit.getShortName()}</u> <span className={"responsive-hide"}>army</span>, <span className={"responsive-show"}>h</span><span className={"responsive-hide"}>health</span> <u>{unit.health}/{unit.definition().health}</u>, <span className={"responsive-show"}>m</span><span className={"responsive-hide"}>moves </span> <u>{unit.movesLeft}</u>
            {definition.fuel?<span className={"responsive-hide"}>{" "}fuel <u>{unit.fuel}</u>/{definition.fuel}</span>:null}
        </span>;
    };


    const noUnitBar = ()=> {
        return <Navbar.Text className={"unit-bar"}>
            <ButtonGroup>
                <Button variant={"outline-secondary"} size={"xs"} title={"show on map"} disabled={true}
                    onClick={()=>{}}>
                    <FontAwesomeIcon icon={faCrosshairs}/>
                </Button>
                <Button className="bottom-bar-space" title={"next unit"} variant={"outline-secondary"} size={"xs"}
                    onClick={() => {
                        MessageBus.send("next-unit", true);
                        // gameState.currentPlayer().jumpToNextUnit(selectedUnit);
                    }}><FontAwesomeIcon icon={faChevronRight}/></Button>

            </ButtonGroup>
        </Navbar.Text>;
    };
    const unitBar = (unit) => {
        if (!unit) return noUnitBar();
        const ownUnit = unit.player===currentPlayer.index;
        return <Navbar.Text className={"unit-bar"}>
            <ButtonGroup>
                <Button variant={"outline-secondary"} size={"xs"} title={"show on map"}
                    onClick={() => MessageBus.send("screen-update", selectedUnit.derivedPosition())}>
                    <FontAwesomeIcon icon={faCrosshairs}/>
                </Button>
                <Button className="bottom-bar-space" title={"next unit"} variant={"outline-secondary"} size={"xs"}
                    onClick={() => {
                        MessageBus.send("next-unit", true);
                        // gameState.currentPlayer().jumpToNextUnit(selectedUnit);
                    }}><FontAwesomeIcon icon={faChevronRight}/></Button>
            </ButtonGroup>
            <div className={"unit-view "+TYPE_MAP[unit.type]}/>
            {unit.clazz === 'city' ? cityUnit(unit) : regularUnit(unit)}
            {ownUnit && unit.clazz === 'unit'? <GameUnitActionsToolTip unit={unit} selectedUnit={selectedUnit}/>:null}
        </Navbar.Text>;
    };


    return <Navbar sticky="bottom" bg="dark" data-bs-theme="dark" className={"bottom-bar"}  onKeyPress={(e) => onKeyPress(e)} tabIndex={999}>
        <Container fluid>
            <Navbar.Collapse className="justify-content-start">
                {unitBar(selectedUnit)}
            </Navbar.Collapse>
            <Navbar.Collapse className="justify-content-end">
                <ButtonGroup className="bottom-bar-space" style={{"marginRight": "0px"}}>
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