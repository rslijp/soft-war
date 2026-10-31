import {Button, Modal} from "react-bootstrap";
import {any, func} from "prop-types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import {React} from "react";
import {faCrosshairs} from "@fortawesome/free-solid-svg-icons";
import {useDialogFocus} from "./useDialogFocus";

function OutOfFuelDialog({unit, onClose}) {
    const dialogView = useDialogFocus();

    const definition = unit.definition();
    const position = unit.derivedPosition();

    return <Modal  show={true} >
        <Modal.Header closeButton>
            <Modal.Title>Aircraft lost</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"unit-dialog"}>
            <span className={"dialog-space"}>The {definition.name} at ({position.y}, {position.x}) ran out of fuel and crashed.</span>
        </Modal.Body>
        <Modal.Footer>
            <Button variant={"outline-secondary"} size={"xs"}
                onClick={() => MessageBus.send("cursor-select", position)}>
                <FontAwesomeIcon icon={faCrosshairs}/>
            </Button>
            <Button variant="secondary" onClick={onClose} ref={dialogView} >
                Close
            </Button>
        </Modal.Footer>
    </Modal>;
}

OutOfFuelDialog.propTypes = {
    unit: any,
    onClose: func
};

export default OutOfFuelDialog;
