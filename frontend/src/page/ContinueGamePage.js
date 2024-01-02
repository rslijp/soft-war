import {Badge, Button, ListGroup, Modal} from "react-bootstrap";
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
            {(games||[]).length > 0?
                <>
                    <p>Select the game you want to resume</p>
                    <ListGroup>
                        {games.map(game=><ListGroup.Item
                            action
                            active={code===game.code}
                            key={game.code}
                            onClick={()=>setCode(game.code)}
                            className={"d-flex justify-content-between align-items-start"}
                        >{game.name} <Badge bg={game.waitingOnYou?"primary":"secondary"} pill>#{game.turn}</Badge></ListGroup.Item>)}
                    </ListGroup>
                </>:<p>No game found</p>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={()=>history.back()}>
                Cancel
            </Button>
            <Button disabled={!code} variant="success" onClick={handleSubmit}>Continue</Button>
        </Modal.Footer>
    </Modal>;
}

export default ContinueGamePage;
