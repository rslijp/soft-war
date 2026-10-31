import {Button, ListGroup, Modal} from "react-bootstrap";
import {any, func} from "prop-types";
import {React} from "react";
import {useDialogFocus} from "./useDialogFocus";

function FlashMessageDialog({messages, onClose}) {
    const dialogView = useDialogFocus();

    return <Modal  show={true} onHide={onClose}>
        <Modal.Header closeButton>
            <Modal.Title>Flash messaged</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <ListGroup>
                {messages.map((message, i) => {
                    if ((typeof message) === 'string') {
                        message = {text: message};
                    }
                    return <ListGroup.Item
                        key={i}
                        variant={message.variant||null}
                        className={"d-flex justify-content-between align-items-start"}>{message.text}
                    </ListGroup.Item>;
                })}
            </ListGroup>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onClose} ref={dialogView} >
                Close
            </Button>
        </Modal.Footer>
    </Modal>;
}

FlashMessageDialog.propTypes = {
    messages: any,
    onClose: func
};

export default FlashMessageDialog;
