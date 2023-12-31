import {Button, ListGroup, Modal} from "react-bootstrap";
import React, {useState} from "react";
import {useLoaderData} from "react-router-dom";


function ContinueGamePage() {
    const games  = useLoaderData();
    const [code, setCode] = useState('');

    const handleSubmit = () => {
        document.location.hash=`/game/${code}`;
    };

    return <Modal
        show={true}
        backdrop="static"
        keyboard={false}
        onHide={()=>history.back()}
    >
        <Modal.Header closeButton>
            <Modal.Title>Start game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {games?
                <ListGroup>
                    {games.map(game=><ListGroup.Item
                        action
                        active={code===game.code}
                        key={game.code}
                        onClick={()=>setCode(game.code)}
                    >{game.name}</ListGroup.Item>)}
                </ListGroup>:<p>No game found</p>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={()=>history.back()}>
                Cancel
            </Button>
            <Button disabled={!code} variant="primary" onClick={handleSubmit}>Start</Button>
        </Modal.Footer>
    </Modal>;
}

export default ContinueGamePage;
