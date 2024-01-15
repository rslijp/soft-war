import {Alert, Badge, Button, ListGroup, Modal} from "react-bootstrap";
import {React, useEffect, useRef, useState} from "react";
import {any, func} from "prop-types";
import {MessageBus} from "softwar-shared";
import {unitTypes} from "softwar-shared/game/unit-types.mjs";

const TYPE_MAP = {
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

function ChangeCityProducion({city, onClose}) {
    const dialogView = useRef();
    const [producing, setProducing] = useState(city.producingType||'');

    const focusView = () => {
        if(dialogView.current) dialogView.current.blur();
        setTimeout(()=>dialogView.current.focus(),0);
    };

    useEffect(() => {
        setTimeout(()=>focusView(), 0);
    }, []);

    function changeProduction() {
        city.produce(producing);
        MessageBus.send("infobar-update");
        onClose();
    }

    const position = city.derivedPosition();

    function unitSelection() {
        return Object.keys(unitTypes).map(typeKey=>{
            const type = unitTypes[typeKey];
            return <ListGroup.Item
                key={typeKey}
                as={"li"}
                active={typeKey === producing}
                onClick={()=>setProducing(typeKey)}
                className={"d-flex justify-content-between align-items-start"}
            ><div className={"unit-view "+TYPE_MAP[typeKey]}/> {type.name} <Badge bg="secondary" pill>{typeKey === city.producingType?type.costs-city.production:type.costs}</Badge>
            </ListGroup.Item>;
        });
    }
    const production = city.producing();

    return <Modal  show={true} >
        <Modal.Header closeButton>
            <Modal.Title>Aircraft lost</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"unit-dialog"}>
            <span className={"dialog-space"}>Change the production of {city.name} ({position.y}, {position.x}). It is currently producing <u>{production ? (production.name + " " + city.production + "/" + production.costs) : null}</u></span>
            <ListGroup as={"ul"}>
                <ListGroup.Item
                    as={"li"}
                    active={!producing}
                    onClick={()=>setProducing('')}
                    className={"d-flex justify-content-between align-items-start"}
                ><div className={"unit-view"}/> none <Badge bg="secondary" pill>-</Badge>
                </ListGroup.Item>
                {unitSelection()}
            </ListGroup>
            <br/>
            {city.producingType!=='' && city.producingType!==producing?
                <Alert variant={"warning"}>
                    Current build progress will be lost!
                </Alert>:null}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onClose} ref={dialogView} >
                Close
            </Button>
            <Button variant="primary" onClick={changeProduction} >
                Change
            </Button>
        </Modal.Footer>
    </Modal>;
}

ChangeCityProducion.propTypes = {
    city: any,
    onClose: func
};

export default ChangeCityProducion;
