import {Button, Modal} from "react-bootstrap";
import {func, string} from "prop-types";
import {React} from "react";
// import {surrenderGame} from "../../api/GameStateApi";

function EndTurnDialog({code, onClose}) {
    function endTurn() {
        console.log(code);
        // surrenderGame(code).then(() => {
        //     document.location.hash = "/#";
        // });
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
            <Button variant="warning" onClick={endTurn}>
                Yes, End turn
            </Button>
        </Modal.Footer>
    </Modal>;
}

EndTurnDialog.propTypes = {
    code: string,
    onClose: func
};

export default EndTurnDialog;
