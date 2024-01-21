import {Button, Modal} from "react-bootstrap";
import {MessageBus, PLAYER_COLORS} from "softwar-shared";
import {React, useEffect, useRef} from "react";
import {any, func} from "prop-types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCrosshairs} from "@fortawesome/free-solid-svg-icons";

const TYPE_TILE_MAP = {
    'C' : 'city',
    'I' : 'infantry',
    'T' : 'tank',
    'M' : 'truck',
    'F' : 'fighter',
    'B' : 'bomber',
    'H' : 'helicopter',
    'D' : 'destroyer',
    'c' : 'cruiser',
    'A' : 'aircraftcarrier',
    'S' : 'submarine',
    'm' : 'missile',
    't' : 'transport',
    'b' : 'battleship'
};


function BattleResultsDialog({attacker, defender, result, player, onClose}) {
    const dialogView = useRef();
    const focusView = () => {
        if(dialogView.current) dialogView.current.blur();
        setTimeout(()=>dialogView.current.focus(),0);
    };

    useEffect(() => {
        setTimeout(()=>focusView(), 0);
    }, []);

    const position = attacker.derivedPosition();

    const renderUnit = (unit) => {
        const additionalStyle = {};
        if (unit.player!==undefined) additionalStyle['backgroundColor'] = PLAYER_COLORS[unit.player];
        return <div className={"unit-view "+TYPE_TILE_MAP[unit.type]} style={additionalStyle}

        />;
    };

    const renderBonus =(bonusses) => {
        if(bonusses && bonusses.length>0){
            let totalBonus = 0;
            return <table className="bonusses">
                <tbody>
                    {bonusses.map((bonus,i)=> {
                        totalBonus += bonus.percentage;
                        return <tr key={i}><td>{bonus.reason}</td><td>{bonus.percentage}%</td></tr>;
                    })}
                    {bonusses.length>1?<tr><td></td><td className="bonussesTotal">{totalBonus}%</td></tr>:null}
                </tbody>
            </table>;
        } else {
            return <i>No bonuses are applicable</i>;
        }
    };

    const renderRounds = (rounds)=>{
        // console.log(rounds, result);
        // return null;
        return <tr>
            <td id='battle-defender'>
                {rounds.filter(r=>r==="defender").map((r,i)=><img key={r+i} src={"/content/units/45x45/explosionv2.png"}/>)}
            </td>
            <td id='battle-attacker'>
                {rounds.filter(r=>r==="attacker").map((r,i)=><img key={r+i} src={"/content/units/45x45/explosionv2.png"}/>)}
            </td>
        </tr>;
    };

    return <Modal  show={true} >
        <Modal.Header closeButton>
            <Modal.Title>Battle result</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"unit-dialog"}>
            <table>
                <tbody>
                    <tr>
                        <th>Attacker {attacker.player===player.index?"(you)":null}</th>
                        <th>Defender {defender.player===player.index?"(you)":null}</th>
                    </tr>
                    <tr>
                        <td>{renderUnit(attacker)}<br/>{attacker.getName()}</td>
                        <td>{renderUnit(defender)}<br/>{defender.getName()}</td>
                    </tr>
                    <tr>
                        <td>{renderBonus(result.attackerBonus)}</td>
                        <td>{renderBonus(result.defenderBonus)}</td>
                    </tr>
                    {renderRounds(result.rounds)}
                    <tr>
                        <td>{attacker.isAlive()?"Won!":"Lost!"}</td>
                        <td>{defender.isAlive()?"Won!":"Lost!"}</td>
                    </tr>
                </tbody>
            </table>
        </Modal.Body>
        <Modal.Footer>
            <Button variant={"outline-secondary"} size={"xs"}
                onClick={() => MessageBus.send("cursor-select", position)}>
                <FontAwesomeIcon icon={faCrosshairs}/>
            </Button>
            <Button variant="secondary" onClick={onClose} ref={dialogView} >
                Close
            </Button>
        </Modal.Footer>
    </Modal>;
}

BattleResultsDialog.propTypes = {
    attacker: any,
    defender: any,
    player: any,
    result: any,
    onClose: func
};

export default BattleResultsDialog;
