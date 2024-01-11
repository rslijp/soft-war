import {Button, Modal} from "react-bootstrap";
import {React, useEffect, useRef} from "react";
import {MessageBus} from "softwar-shared";
import {func} from "prop-types";

function EndTurnDialog({onClose}) {
    const dialogView = useRef();

    const focusView = () => {
        if(dialogView.current) dialogView.current.blur();
        setTimeout(()=>dialogView.current.focus(),0);
    };

    useEffect(() => {
        setTimeout(()=>focusView(), 0);
    }, []);

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
