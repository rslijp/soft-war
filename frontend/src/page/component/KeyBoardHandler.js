import MessageBus from "softwar-shared/services/message-service.mjs";
import {any} from "prop-types";
import {useEffect} from "react";

function KeyBoardHandler({state}) {
    const currentPlayer = state.currentPlayer();
    const selectedUnit = currentPlayer.selectedUnit;

    useEffect(() => {
        const handles = [
            MessageBus.register("keyboard-key-pressed", onKeyPress, this),
        ];
        return () => {
            MessageBus.revokeByHandles(handles);
        };
    }, []);

    const onNumericKeyPressed = (key) => {
        if (!selectedUnit) {
            return;
        }
        var index = key - 49;
        var selected = selectedUnit.nestedUnits[index];
        if (selected) {
            state.selectUnit(selected);
        }

    };

    const onKeyPress = (key) => {
        // console.log("onKeyPress", key);
        if (key > 48 && key < 58) {
            return onNumericKeyPressed(key);
        }

        switch (key) {
        case 13:
            MessageBus.sendLockable("next-unit");
            break;
        case 32: //space
            MessageBus.sendLockable("cursor-select", state.position());
            break;
        case 113: //q
        case 81: //Q
            MessageBus.sendLockable("cursor-direction", "NW");
            break;
        case 38: //up arrow key
        case 119: //w
        case 87: //W
            MessageBus.sendLockable("cursor-direction", "N");
            break;
        case 101: //e
        case 69: //E
            MessageBus.sendLockable("cursor-direction", "NE");
            break;
        case 39: //right arrow key
        case 100: //d
        case 68: //D
            MessageBus.sendLockable("cursor-direction", "E");
            break;
        case 99: //c
        case 67: //C
            MessageBus.sendLockable("cursor-direction", "SE");
            break;
        case 40: //down arrow key
        case 120: //x
        case 88: //X
            MessageBus.sendLockable("cursor-direction", "S");
            break;
        case 122: //z
        case 90: //Z
            MessageBus.sendLockable("cursor-direction", "SW");
            break;
        case 37: //left arrow key
        case 97: //a
        case 65: //A
            MessageBus.sendLockable("cursor-direction", "W");
            break;
        case 115: //s
        case 83: //S
            var unit = state.currentPlayer().selectedUnit;
            if (unit && unit.specialAction) {
                MessageBus.sendLockable("special-action", unit, unit.specialAction().method);
            }
            break;
        case 109: //m
        case 77: //M
            MessageBus.send("move-to-mode");
            break;
        case 112: //p
        case 80: //P
            MessageBus.send("patrol-to-mode");
            break;
        default:
            console.log(key);
        }

    };

}

KeyBoardHandler.propTypes = {
    state: any
};
export default KeyBoardHandler;