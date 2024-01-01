import {Button, Modal} from "react-bootstrap";
import {func, string} from "prop-types";
import {React} from "react";
import {surrenderGame} from "../../api/GameStateApi";

function SurrenderDialog({code, onClose}) {
    function surrender() {
        surrenderGame(code).then(() => {
            document.location.hash = "/#";
        });
    }

    return <Modal show={true}>
        <Modal.Header closeButton>
            <Modal.Title>Surrender?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you really surrendering?</Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button variant="danger" onClick={surrender}>
                Yes, Surrender
            </Button>
        </Modal.Footer>
    </Modal>;
}

SurrenderDialog.propTypes = {
    code: string,
    onClose: func
};

export default SurrenderDialog;
