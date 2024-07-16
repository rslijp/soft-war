import {Button, Modal} from "react-bootstrap";
import {React, useEffect, useRef} from "react";
import {any, func} from "prop-types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageBus} from "softwar-shared";
import {faCrosshairs} from "@fortawesome/free-solid-svg-icons";

function OrderConfirmationDialog({unit, order, onClose}) {
    const dialogView = useRef();

    const focusView = () => {
        if(dialogView.current) dialogView.current.blur();
        setTimeout(()=>dialogView.current.focus(),0);
    };

    function confirmAndClose() {
        if(order) {
            MessageBus.send("give-order", order.action, order.queue, null, true);
        } else {
            MessageBus.send("clear-order");
        }
        onClose();
    }

    useEffect(() => {
        setTimeout(()=>focusView(), 0);
    }, []);

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
