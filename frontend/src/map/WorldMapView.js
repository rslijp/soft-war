import {any, number, shape} from "prop-types";
import {MessageBus} from "softwar-shared";
import React from "react";
import {TILE_SIZE} from "../Constants";
import UnitView from "./UnitView";

function WorldMapView({map, range, selectedUnit, fogOfWar}) {
    const dimensions = map.dimensions;

    function normalizedRange(range){
        const r = {...range, startX: Math.floor(range.startX), startY:  Math.floor(range.startY)};
        if(r.startX-range.startX!==0){
            r.deltaX++;
        }
        if(r.startY-range.startY!==0){
            r.deltaY++;
        }
        return r;
    }

    const hudMap = {};
    if(selectedUnit && selectedUnit.canMove()){
        const world = map.world;
        const pos = selectedUnit.derivedPosition();
        const allowed = (y,x) => selectedUnit.canMoveOn(world[y][x].type);
        if(allowed(pos.y-1,pos.x-1)) hudMap[`${pos.y-1}_${pos.x-1}`] = {className: "hud-move-top-left", action: ()=>MessageBus.sendLockable("cursor-direction", "NW")};
        if(allowed(pos.y-1,pos.x)) hudMap[`${pos.y-1}_${pos.x}`]= {className: "hud-move-top", action: ()=>MessageBus.sendLockable("cursor-direction", "N")};
        if(allowed(pos.y-1,pos.x+1)) hudMap[`${pos.y-1}_${pos.x+1}`]= {className: "hud-move-top-right", action: ()=>MessageBus.sendLockable("cursor-direction", "NE")};
        if(allowed(pos.y,pos.x-1)) hudMap[`${pos.y}_${pos.x-1}`]= {className: "hud-move-left", action: ()=>MessageBus.sendLockable("cursor-direction", "W")};
        if(allowed(pos.y,pos.x+1)) hudMap[`${pos.y}_${pos.x+1}`]= {className: "hud-move-right", action: ()=>MessageBus.sendLockable("cursor-direction", "E")};
        if(allowed(pos.y+1,pos.x-1)) hudMap[`${pos.y+1}_${pos.x-1}`]= {className: "hud-move-down-left", action: ()=>MessageBus.sendLockable("cursor-direction", "SW")};
        if(allowed(pos.y+1,pos.x)) hudMap[`${pos.y+1}_${pos.x}`]= {className: "hud-move-down", action: ()=>MessageBus.sendLockable("cursor-direction", "S")};
        if(allowed(pos.y+1,pos.x+1)) hudMap[`${pos.y+1}_${pos.x+1}`]={className: "hud-move-down-right", action: ()=>MessageBus.sendLockable("cursor-direction", "SE")};
    }

    function cell(key, x, y, entry){
        const position = {x, y};
        const positionKey = `${y}_${x}`;
        const selected = selectedUnit&&selectedUnit.isOn(position);
        let unit = selected?selectedUnit:map.unitAt(position);
        if(fogOfWar && !fogOfWar.visible(position)){
            unit=null;
        }
        const hud =hudMap[positionKey];
        let  detail =(entry.detail || entry.type);
        if (fogOfWar && !fogOfWar.discovered(position)) {
            detail="fog";
        }
        const clazzes = ["land-tile","land-tile-type-" + detail];
        return <td key={key} className={clazzes.join(" ")}>
            {unit?<UnitView unit={unit} selected={selected}/>:null}
            {hud?<div className={(unit?"hud-action with-unit ":"hud-action ")+hud.className} onClick={hud.action}></div>:null}
        </td>;
    }

    function viewport(range, world) {
        const deltaX = range.deltaX;
        const deltaY = range.deltaY;
        return <table style={{width: `${deltaX*TILE_SIZE}px`, height: `${deltaY*TILE_SIZE}px`}}>
            <tbody>
                {[...Array(deltaY)].map((_, y) => {
                    let ly = (range.startY + y) % dimensions.height;
                    if(ly<0) ly+=dimensions.height;
                    const line = world[ly];
                    return <tr key={`row-${y}`}>
                        {[...Array(deltaX)].map((_, x) => {
                            let lx = (range.startX + x) % dimensions.width;
                            if(lx<0) lx+=dimensions.width;
                            return cell(`cell-${y}x${x}`,lx,ly, line[lx]);
                        })}
                    </tr>;
                })}
            </tbody>
        </table>;
    }

    return viewport(normalizedRange(range), map.world);
}

WorldMapView.propTypes = {
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number
    }),
    map: any,
    selectedUnit: any,
    fogOfWar: any
};
export default WorldMapView;