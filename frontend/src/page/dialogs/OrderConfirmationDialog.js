import {Button, Modal} from "react-bootstrap";
import {any, func} from "prop-types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import {React} from "react";
import {faCrosshairs} from "@fortawesome/free-solid-svg-icons";
import {useDialogFocus} from "./useDialogFocus";

function OrderConfirmationDialog({unit, order, onClose}) {
    const dialogView = useDialogFocus();

    function confirmAndClose() {
        if(order) {
            MessageBus.send("give-order", order.action, order.queue, null, true);
        } else {
            MessageBus.send("clear-order");
        }
        onClose();
    }

    const position = unit.derivedPosition();
    return <Modal  show={true} >
        <Modal.Header closeButton>
            <Modal.Title>{order?"Confirm order":"Confirm clear order"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"unit-dialog"}>
            {order ?
                <span className={"dialog-space"}>The {unit.getName()} at ({position.y}, {position.x}) received {order.action}-orders to ({order.to.y}, {order.to.x}) ?</span> :
                <span className={"dialog-space"}>Clear the orders of {unit.getName()} at ({position.y}, {position.x})</span>
            }
        </Modal.Body>
        <Modal.Footer>
            <Button variant={"outline-secondary"} size={"xs"}
                onClick={() => MessageBus.send("cursor-select", position)}>
                <FontAwesomeIcon icon={faCrosshairs}/>
            </Button>
            <Button variant="secondary" onClick={onClose} ref={dialogView} >
                Close
            </Button>
            <Button variant="primary" onClick={confirmAndClose} ref={dialogView} >
                Confirm
            </Button>
        </Modal.Footer>
    </Modal>;
}

OrderConfirmationDialog.propTypes = {
    unit: any,
    order: any,
    onClose: func
};

export default OrderConfirmationDialog;
