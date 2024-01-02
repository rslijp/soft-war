import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {shape, string} from "prop-types";
import React from "react";

const UNIT_CSS = {
    'C': 'city'
};

function UnitView({unit}) {
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {unit.name}
        </Tooltip>
    );

    const additionalStyle = {};
    if (unit.color) additionalStyle['backgroundColor'] = unit.color;

    return <OverlayTrigger
        placement="bottom"
        delay={{show: 250, hide: 400}}
        overlay={renderTooltip}
    >
        <div className={"unit-view " + UNIT_CSS[unit.type]}
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