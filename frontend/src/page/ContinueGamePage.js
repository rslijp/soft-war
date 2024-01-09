/* eslint-disable react/prop-types */
import {Button, ButtonGroup, ListGroup, Modal} from "react-bootstrap";
import React, {useState} from "react";
import {acceptGame, declineGame} from "../api/GameStateApi";
import {useLoaderData, useRevalidator} from "react-router-dom";
import {MessageBus} from "softwar-shared";
import {func} from "prop-types";


function ContinueGamePage() {
    const games = useLoaderData();
    let revalidator = useRevalidator();

    const [code, setCode] = useState('');

    const handleSubmit = () => {
        document.location.hash = `/game/${code}`;
    };

    const acceptInvite = (code) => {
        acceptGame(code).then(() => {
            revalidator.revalidate();
            MessageBus.send("refresh-badge");
        });
    };

    const declineInvite = (code) => {
        declineGame(code).then(() => {
            revalidator.revalidate();
            MessageBus.send("refresh-badge");
        });
    };

    const RenderGame = ({game}) => {
        const badge = () => {
            if (game.status === 'active') {
                return <Button size={"xs"} variant={game.waitingOnYou ? "primary" : "secondary"}
                >#{game.turn}: {game.players[game.currentPlayer].name}</Button>;
            } else if (game.status === 'pending') {
                const pendingPlayers = game.players.filter(p => p.status === 'pending');
                if (pendingPlayers.some(p => p.isYou)) {
                    return <ButtonGroup>
                        <Button size={"xs"} variant={"success"} onClick={() => acceptInvite(game.code)}
                            style={{"fontSize": "small"}}>accept</Button>
                        <Button size={"xs"} variant={"danger"} onClick={() => declineInvite(game.code)}
                            style={{"fontSize": "small"}}>decline</Button>
                    </ButtonGroup>;
                } else {
                    return <Button size={"xs"} variant={"warning"} disabled={true}>
                        {game.players.length - pendingPlayers.length}/{game.players.length} accepted
                    </Button>;
                }
            }
            return null;
        };
        return <ListGroup.Item
            action={game.status === 'active'}
            as={"li"}
            active={code === game.code}
            onClick={game.status === 'active' ? () => setCode(game.code) : null}
            className={"d-flex justify-content-between align-items-start"}
        >{game.name} {badge()}
        </ListGroup.Item>;
    };

    return <Modal
        show={true}
        backdrop="static"
        keyboard={false}
        onHide={() => history.back()}
    >
        <Modal.Header closeButton>
            <Modal.Title>Continue game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {(games || []).length > 0 ?
                <>
                    <p>Select the game you want to resume</p>
                    <ListGroup as={"ul"}>
                        {games.map(game => <RenderGame key={game.code}
                            game={game}/>)}
                    </ListGroup>
                </> : <p>No game found.<a href={"#/new-game"}>Start a game?</a></p>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => history.back()}>
                Cancel
            </Button>
            <Button disabled={!code} variant="success" onClick={handleSubmit}>Continue</Button>
        </Modal.Footer>
    </Modal>;
}
ContinueGamePage.protoTypes = {
    badgeDecrease: func
};
export default ContinueGamePage;
