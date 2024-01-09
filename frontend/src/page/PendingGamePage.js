import {Button, Modal} from "react-bootstrap";
import React from "react";

function PendingGamePage() {

    const handleSubmit = () => {
        document.location.hash = `/`;
    };


    return <Modal
        show={true}
        backdrop="static"
        keyboard={false}
        onHide={() => history.back()}
    >
        <Modal.Header>
            <Modal.Title>Game started</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>The game is created, but some players still need to accept. Once this is done you will receive a mail that you can play this game.</p>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleSubmit}>
                Continue
            </Button>
        </Modal.Footer>
    </Modal>;
}

export default PendingGamePage;
