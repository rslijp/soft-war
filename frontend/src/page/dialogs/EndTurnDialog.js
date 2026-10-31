import {Button, Modal} from "react-bootstrap";
import {MessageBus} from "softwar-shared";
import React from "react";
import {func} from "prop-types";
import {useDialogFocus} from "./useDialogFocus";

function EndTurnDialog({onClose}) {
    const dialogView = useDialogFocus();

    function endTurn() {
        MessageBus.send("next-turn");
        onClose();
    }

    return <Modal show={true}>
        <Modal.Header closeButton>
            <Modal.Title>End turn?</Modal.Title>
        </Modal.Header>
        <Modal.Body>You are ready to end your turn?</Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button variant="warning" onClick={endTurn} ref={dialogView} >
                Yes, End turn
            </Button>
        </Modal.Footer>
    </Modal>;
}

EndTurnDialog.propTypes = {
    onClose: func
};

export default EndTurnDialog;
