import {Badge, Overlay} from "react-bootstrap";
import React, {useRef, useState} from "react";
import Button from 'react-bootstrap/Button';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import {TILE_SIZE} from "../../Constants";
import {TYPE_MAP} from "./UnitTypesConstants";
import Tooltip from 'react-bootstrap/Tooltip';
import {any} from "prop-types";
import {faTruckRampBox} from "@fortawesome/free-solid-svg-icons";

function GameUnitNestedUnitsToolTip({unit}) {
    const [show, setShow] = useState(false);
    const target = useRef(null);

    function slotNodes () {
        var slots = new Array(unit.capacity);
        for(var i=0; i<slots.length; i++){
            slots[i]=unit.nestedUnits[i]||null;
        }

        return <div className={"nested-unit-slots"} style={{"width": unit.capacity*TILE_SIZE+unit.capacity+(unit.capacity-1)*2}}>
            {slots.map((s, i) => <div key={i} className={"nested-unit-slot"}>{
                s ? <div className={"unit-view " + TYPE_MAP[s.type]}
                    onClick={() => MessageBus.send("select-unit", s)}
                /> : null}
            </div>)}
        </div>;
    }

    return (<>
        <Button ref={target}
            variant={"outline-secondary"}
            size={"xs"}
            onClick={() => setShow(!show)}
            onBlur={() => setShow(false)}
        >
            {unit.nestedUnits.length>0?
                <>
                    <FontAwesomeIcon style={{"marginTop": "9px"}} icon={faTruckRampBox}/>
                    <Badge bg="warning" style={{"top": "-36px", "left": "10px" }}>{unit.nestedUnits.length}</Badge>
                </>:<FontAwesomeIcon icon={faTruckRampBox}/>
            }
        </Button>
        <Overlay target={target.current} show={show} placement="top">
            {(props) => (
                <Tooltip id="nested-unit" {...props} className={"nested-unit-tooltip"}>
                    {slotNodes()}
                </Tooltip>
            )}
        </Overlay>
    </>);
}

GameUnitNestedUnitsToolTip.propTypes = {
    unit: any
};
export default GameUnitNestedUnitsToolTip;