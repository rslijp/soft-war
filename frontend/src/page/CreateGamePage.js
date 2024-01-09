import {Button, Form, InputGroup, Modal} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {newGame} from "../api/GameStateApi";

const FIRST = ["Pig", "Blue", "Hawk", "Justice", "Glacier", "Doom", "Split", "Dragon"];
const SECOND = ["Den", "Sword", "Breach", "Assault", "Claw", "Light", "Storm"];
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function randomName() {
    var f = Math.floor(Math.random() * FIRST.length);
    var s = Math.floor(Math.random() * SECOND.length);
    return [FIRST[f], SECOND[s]].join(" ");

}

function CreateGamePage() {
    const [form, setForm] = useState({name: '', size: '64x64', type: 'REGULAR', players: ['']});
    const [errors, setErrors] = useState([]);

    const handleSubmit = (event) => {
        if (!isValid()) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        newGame(form.type, form.size, form.name, form.players).then(
            data => {
                if(data.status==='active') document.location.hash = `/game/${data.code}`;
                else if(data.status==='pending')  document.location.hash = 'pending-game';
            }
        );
    };

    const updatePlayer = (index, name) => {
        const players = [].concat(form.players);
        players[index] = name;
        setForm({...form, players: players});
    };

    const enablePlayer = (numberOfPlayers) => {
        if (form.players.length < numberOfPlayers) {
            const players = [].concat(form.players);
            players.push('');
            setForm({...form, players: players});
        } else if (form.players.length >= numberOfPlayers) {
            let players = form.players.slice(0, numberOfPlayers - 1);
            players = players.concat(form.players.slice(numberOfPlayers, form.players.length));
            setForm({...form, players: players});
        }
    };

    const validate = () => {
        const errors = [];
        errors.push({name: 'name', valid: !!form.name});
        const players = form.players||[];
        for(var i=0; i<players.length; i++){
            const email = players[i];
            const valid = !email || EMAIL_REGEX.test(email);
            errors.push({name: 'players'+i, valid: valid});
        }
        setErrors(errors);
    };

    const isValid = (name)=> {
        if(!name){
            return errors.every(e=>e.valid);
        }
        const error = errors.find(e=>e.name===name);
        if(!error) return null;
        return error.valid;
    };

    const hasError = (name)=> {
        var error = errors.find(e=>e.name===name);
        if(!error) return null;
        return !error.valid;
    };

    useEffect(() => {
        validate();
    }, [form]);

    return <Modal
        show={true}
        backdrop="static"
        keyboard={false}
        onHide={() => history.back()}
    >
        <Modal.Header closeButton>
            <Modal.Title>Start game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form >
                <Form.Group className="mb-3" controlId="formName">
                    <Form.Label>Name</Form.Label>
                    <InputGroup className="mb-3">
                        <Form.Control
                            placeholder="Name of your game"
                            aria-required={true}
                            value={form.name}
                            isValid={isValid('name')}
                            isInvalid={hasError('name')}
                            onChange={e => setForm({...form, name: e.target.value})}
                        />
                        <Button variant="outline-secondary" id="button-addon2"
                            onClick={() => setForm({...form, name: randomName()})}>
                            random
                        </Button>
                    </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formSize">
                    <Form.Label>Map size</Form.Label>
                    <Form.Select value={form.size}
                        onChange={(e => setForm({...form, size: e.target.value}))}
                    >
                        <option value="32x32">Tiny</option>
                        <option value="64x64">Small</option>
                        <option value="96x96">Medium</option>
                        <option value="128x64">Wide</option>
                        <option value="128x128">Large</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formType">
                    <Form.Label>Land type</Form.Label>
                    <Form.Select aria-label="Land type select"
                        value={form.type}
                        onChange={(e => setForm({...form, type: e.target.value}))}
                    >
                        <option value="REGULAR">Regular</option>
                        <option value="CONTINENTS">Continents</option>
                        <option value="ISLANDS">Islands</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="player2">
                    <Form.Label>2nd player</Form.Label>
                    <InputGroup className="mb-3">
                        <InputGroup.Checkbox checked={true} disabled={true}
                            aria-label="Checkbox for following text input"/>
                        <Form.Control aria-label="Text input with checkbox" placeholder={"AI"} value={form.players[0]}
                            isValid={isValid('players0')}
                            isInvalid={hasError('players0')}
                            onChange={e => updatePlayer(0, e.target.value)}/>
                    </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3" controlId="player3">
                    <Form.Label>3nd player</Form.Label>
                    <InputGroup className="mb-3">
                        <InputGroup.Checkbox checked={form.players.length >= 2} aria-label="Enable 3rd player"
                            onChange={() => enablePlayer(2)}/>
                        <Form.Control aria-label="Text input with checkbox" placeholder={"AI"}
                            value={form.players[1] || ''} disabled={form.players.length < 2}
                            isValid={isValid('players1')}
                            isInvalid={hasError('players1')}
                            onChange={e => updatePlayer(1, e.target.value)}/>
                    </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3" controlId="player4">
                    <Form.Label>4nd player</Form.Label>
                    <InputGroup className="mb-3">
                        <InputGroup.Checkbox checked={form.players.length >= 3} aria-label="Enable 4th player"
                            onChange={() => enablePlayer(3)}/>
                        <Form.Control aria-label="Text input with checkbox" placeholder={"AI"}
                            value={form.players[2] || ''} disabled={form.players.length < 3}
                            isValid={isValid('players2')}
                            isInvalid={hasError('players2')}
                            onChange={e => updatePlayer(2, e.target.value)}/>
                    </InputGroup>
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => history.back()}>
                Cancel
            </Button>
            <Button variant="success" disabled={!isValid()} onClick={handleSubmit}>Start</Button>
        </Modal.Footer>
    </Modal>;
}

export default CreateGamePage;
