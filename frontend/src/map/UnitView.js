import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {shape, string} from "prop-types";
import {PLAYER_COLORS} from "softwar-shared";
import React from "react";

function UnitView({unit}) {
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {unit.name}
        </Tooltip>
    );
    const additionalStyle = {};
    if (unit.player!==undefined) additionalStyle['backgroundColor'] = PLAYER_COLORS[unit.player];

    return <OverlayTrigger
        placement="bottom"
        delay={{show: 250, hide: 400}}
        overlay={renderTooltip}
    >
        <div className={"unit-view " + unit.clazz}
            style={additionalStyle}
            onClick={() => alert('x')}>

        </div>
    </OverlayTrigger>;
}

UnitView.propTypes = {
    unit: shape({
        name: string,
        type: string
    })
};
export default UnitView;