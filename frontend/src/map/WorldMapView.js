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

    function unitHud(hudMap){
        const world = map.world;
        const pos = selectedUnit.derivedPosition();
        const allowed = (pos) => {
            pos=map.normalize(pos);
            return selectedUnit.canMoveOn(world[pos.y][pos.x].type);
        };
        if(allowed({y: pos.y-1,x: pos.x-1})) hudMap[`${pos.y-1}_${pos.x-1}`] = {className: "hud-move-top-left", action: ()=>MessageBus.sendLockable("cursor-direction", "NW")};
        if(allowed({y: pos.y-1,x: pos.x})) hudMap[`${pos.y-1}_${pos.x}`]= {className: "hud-move-top", action: ()=>MessageBus.sendLockable("cursor-direction", "N")};
        if(allowed({y: pos.y-1,x: pos.x+1})) hudMap[`${pos.y-1}_${pos.x+1}`]= {className: "hud-move-top-right", action: ()=>MessageBus.sendLockable("cursor-direction", "NE")};
        if(allowed({y: pos.y,x:   pos.x-1})) hudMap[`${pos.y}_${pos.x-1}`]= {className: "hud-move-left", action: ()=>MessageBus.sendLockable("cursor-direction", "W")};
        if(allowed({y: pos.y,x:   pos.x+1})) hudMap[`${pos.y}_${pos.x+1}`]= {className: "hud-move-right", action: ()=>MessageBus.sendLockable("cursor-direction", "E")};
        if(allowed({y: pos.y+1,x: pos.x-1})) hudMap[`${pos.y+1}_${pos.x-1}`]= {className: "hud-move-down-left", action: ()=>MessageBus.sendLockable("cursor-direction", "SW")};
        if(allowed({y: pos.y+1,x: pos.x})) hudMap[`${pos.y+1}_${pos.x}`]= {className: "hud-move-down", action: ()=>MessageBus.sendLockable("cursor-direction", "S")};
        if(allowed({y: pos.y+1,x: pos.x+1})) hudMap[`${pos.y+1}_${pos.x+1}`]={className: "hud-move-down-right", action: ()=>MessageBus.sendLockable("cursor-direction", "SE")};
    }

    function intelligenceHud(hudMap){
        const decorate = (map, clazz) => {
            if(!map) return;
            Object.keys(map).forEach(key=>{
                hudMap[key]=hudMap[key]?hudMap[key]:{className: clazz};
            });
        };
        const showPath = (unit,clazz) => {
            if(unit.order){
                const order = unit.order;
                const key = (pos) => `${pos.y}_${pos.x}`;
                hudMap[key(order.from)]={className: clazz};
                hudMap[key(order.to)]={className: clazz};
                order.queue.forEach(p=>hudMap[key(p)]={className: clazz});
            }
        };
        map.intelligence.forEach(cluster=>{
            decorate(cluster.enemyCities, "hud-intelligence-enemy-city");
            decorate(cluster.enemyUnits, "hud-intelligence-enemy-unit");
            decorate(cluster.friendlyCities, "hud-intelligence-friendly-city");
            decorate(cluster.friendlyUnits, "hud-intelligence-friendly-unit");
            decorate(cluster.landmass, "hud-intelligence-same-island");
            decorate(cluster.undiscovered, "hud-intelligence-to-discover");
            if(selectedUnit) showPath(selectedUnit, "hud-intelligence-route");
        });
    }

    const hudMap = {};
    if(map.intelligence){
        intelligenceHud(hudMap);
    } else if(selectedUnit && selectedUnit.canMove()){
        unitHud(hudMap);
    }


    // console.log(fogOfWar.prettyPrint());

    function cell(key, x, y, entry){
        const position = {x, y};
        const positionKey = `${y}_${x}`;
        const selected = selectedUnit&&selectedUnit.isOn(position);
        let unit = selected?selectedUnit:map.unitAt(position);

        const hud =hudMap[positionKey];
        let  detail =(entry.detail || entry.type);
        const clazzes = ["land-tile"];
        if (!fogOfWar || fogOfWar.discovered(position)) {
            clazzes.push("land-tile-type-" + detail);
        }
        if(fogOfWar && !fogOfWar.visible(position)){
            unit=null;
            clazzes.push("land-fog-of-war");
        }
        return <td key={key} className={clazzes.join(" ")}>
            {unit?<UnitView unit={unit} selected={selected}/>:null}
            {hud?<div className={(unit?"hud-action with-unit ":"hud-action ")+hud.className} onClick={hud.action}></div>:null}
        </td>;
    }

    function viewport(range, world) {
        const deltaX = range.deltaX;
        const deltaY = range.deltaY;
        return <table  className={"world-map"} style={{width: `${deltaX*TILE_SIZE}px`, height: `${deltaY*TILE_SIZE}px`}}>
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