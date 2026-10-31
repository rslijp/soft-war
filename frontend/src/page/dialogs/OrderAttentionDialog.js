import {Button, Modal} from "react-bootstrap";
import {any, func} from "prop-types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import React from "react";
import {faCrosshairs} from "@fortawesome/free-solid-svg-icons";
import {useDialogFocus} from "./useDialogFocus";

function OrderAttentionDialog({unit, order, onClose}) {
    const dialogView = useDialogFocus();

    const position = unit.derivedPosition();

    return <Modal  show={true} >
        <Modal.Header closeButton>
            <Modal.Title>Attention requried</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"unit-dialog"}>
            <span className={"dialog-space"}>The {unit.getName()} at ({position.y}, {position.x}) can&apos;t execute {order.action}-orders to ({order.to?order.to.y:'-'}, {order.to?order.to.x:'-'}).</span>
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

OrderAttentionDialog.propTypes = {
    unit: any,
    order: any,
    onClose: func
};

export default OrderAttentionDialog;
