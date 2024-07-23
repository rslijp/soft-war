import {Badge, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {MessageBus, PLAYER_COLORS} from "softwar-shared";
import {bool, shape, string} from "prop-types";
import React from "react";

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

function UnitView({unit, selected}) {
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {unit.getName()} {unit.remark&&unit.remark()?" ("+unit.remark()+")":null}
        </Tooltip>
    );
    const additionalStyle = {};
    if (unit.player!==undefined) additionalStyle['backgroundColor'] = PLAYER_COLORS[unit.player];
    const cssClasses = ["unit-view", TYPE_TILE_MAP[unit.type]];
    if(selected) cssClasses.push("selected-unit");
    const remark = unit.remark?unit.remark():null;
    return <OverlayTrigger
        placement="bottom"
        delay={{show: 250, hide: 400}}
        overlay={renderTooltip}
    >
        <div className={cssClasses.join(" ")}
            style={additionalStyle}
            onClick={() => MessageBus.send("cursor-select", unit.derivedPosition())}>
            {remark?<Badge className={"unit-remark"} pill bg={"dark"}>{remark[0].toUpperCase()}</Badge>:null}
        </div>
    </OverlayTrigger>;
}

UnitView.propTypes = {
    unit: shape({
        name: string,
        type: string
    }),
    selected: bool
};
export default UnitView;