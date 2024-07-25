import {ButtonGroup, Overlay} from "react-bootstrap";
import React, {useRef, useState} from "react";
import {faBolt, faCancel, faMapLocationDot, faPersonMilitaryRifle} from "@fortawesome/free-solid-svg-icons";
import Button from 'react-bootstrap/Button';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import GameUnitNestedUnitsToolTip from "./GameUnitNestedUnitsToolTip";
import {MessageBus} from "softwar-shared";
import {SPECIAL_MAP} from "./UnitTypesConstants";
import Tooltip from 'react-bootstrap/Tooltip';
import {any} from "prop-types";

function GameUnitActionsToolTip({unit, selectedUnit}) {
    const [show, setShow] = useState(false);
    const target = useRef(null);

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

    function slotNodes () {
        return <ButtonGroup>
            {specialActions(unit)}
            {unit.clazz === 'unit' ?
                <Button variant={"outline-secondary"} size={"xs"} title={"Move"}
                    onClick={() => MessageBus.send("move-to-mode")}>
                    <FontAwesomeIcon icon={faMapLocationDot}/>
                </Button> : null}
            {unit.clazz === 'unit' ?
                <Button variant={"outline-secondary"} size={"xs"} title={"Patrol"}
                    onClick={() => MessageBus.send("patrol-to-mode")}>
                    <FontAwesomeIcon icon={faPersonMilitaryRifle}/>
                </Button> : null}
            {unit.order ?
                <Button variant={"outline-secondary"} size={"xs"} title={"Clear orders"}
                    onClick={() => MessageBus.send("confirm-order", selectedUnit, null)}>
                    <FontAwesomeIcon icon={faCancel}/>
                </Button> : null}
        </ButtonGroup>;
    }


    const nestedUnits = (unit) => {
        if (!unit || !unit.capacity) return;
        return <GameUnitNestedUnitsToolTip unit={unit}/>;
    };


    return (<>
        <ButtonGroup className="bottom-bar-space">
            <Button ref={target}
                variant={"outline-secondary"}
                size={"xs"}
                onClick={() => setShow(!show)}
                onBlur={() => setShow(false)}>
                <FontAwesomeIcon icon={faBolt}/>
            </Button>
            {nestedUnits(unit)}
        </ButtonGroup>
        <Overlay target={target.current} show={show} placement="top">
            {(props) => (
                <Tooltip id="special-actions-unit" {...props} className={"special-action-unit-tooltip"}>
                    {slotNodes()}
                </Tooltip>
            )}
        </Overlay>
    </>);
}

GameUnitActionsToolTip.propTypes = {
    unit: any,
    selectedUnit: any
};
export default GameUnitActionsToolTip;