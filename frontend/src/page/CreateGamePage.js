import {Button, Form, InputGroup, Modal} from "react-bootstrap";
import React, {useState} from "react";
import {newGame} from "../api/GameStateApi";

const FIRST = ["Pig", "Blue", "Hawk", "Justice", "Glacier", "Doom", "Split", "Dragon"];
const SECOND = ["Den", "Sword", "Breach", "Assault", "Claw", "Light", "Storm"];


function randomName(){
    var f = Math.floor(Math.random()*FIRST.length);
    var s = Math.floor(Math.random()*SECOND.length);
    return [FIRST[f], SECOND[s]].join(" ");

}

function CreateGamePage() {
    const [form, setForm] = useState({name:'', size: '64x64', type: 'REGULAR'});
    const [validated, setValidated] = useState(false);
    let formRef = React.createRef();

    const handleSubmit = (event) => {
        console.log(formRef.current.checkValidity());
        const valid = formRef.current.checkValidity();
        if (valid === false) {
            event.preventDefault();
            event.stopPropagation();
        }

        setValidated(true);
        if(valid){
            newGame(form.type, form.size, form.name).then(
                data=>document.location.hash=`/game/${data.code}`
            );
        }
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
            <Form noValidate validated={validated} ref={formRef}>
                <Form.Group className="mb-3" controlId="formName">
                    <Form.Label>Name</Form.Label>
                    <InputGroup className="mb-3">
                        <Form.Control
                            required
                            placeholder="Name of your game"
                            aria-required={true}
                            value={form.name}
                            onChange={e=>setForm({...form, name: e.target.value})}
                        />
                        <Button variant="outline-secondary" id="button-addon2"
                            onClick={()=>setForm({...form, name: randomName()})}>
                            random
                        </Button>
                    </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formSize">
                    <Form.Label>Map size</Form.Label>
                    <Form.Select value={form.size}
                        onChange={(e=>setForm({...form,size: e.target.value}))}
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
                    <Form.Select aria-label="Default select example"
                        value={form.type}
                        onChange={(e=>setForm({...form,type: e.target.value}))}
                    >
                        <option value="REGULAR">Regular</option>
                        <option value="CONTINENTS">Continents</option>
                        <option value="ISLANDS">Islands</option>
                    </Form.Select>
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={()=>history.back()}>
                Cancel
            </Button>
            <Button variant="success" onClick={handleSubmit}>Start</Button>
        </Modal.Footer>
    </Modal>;
}

export default CreateGamePage;
