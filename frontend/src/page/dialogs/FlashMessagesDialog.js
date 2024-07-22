import {Button, ListGroup, Modal} from "react-bootstrap";
import {React, useEffect, useRef} from "react";
import {any, func} from "prop-types";

function FlashMessageDialog({messages, onClose}) {
    const dialogView = useRef();

    const focusView = () => {
        if(dialogView.current) dialogView.current.blur();
        setTimeout(()=>dialogView.current.focus(),0);
    };

    useEffect(() => {
        setTimeout(()=>focusView(), 0);
    }, []);

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
