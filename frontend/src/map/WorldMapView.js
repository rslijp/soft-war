import React, {useEffect, useRef, useState} from "react";
import {any, number, shape} from "prop-types";
import {MessageBus} from "softwar-shared";
import {TILE_SIZE} from "../Constants";
import UnitView from "./UnitView";
import {navigationAStar} from "softwar-shared/game/navigationAStar.mjs";

function WorldMapView({map, range, selectedUnit, fogOfWar}) {
    const [state, setState] = useState({mode: 'regular', path: null});
    const dimensions = map.dimensions;
    const stateRef = useRef();
    stateRef.current = {mode: state.mode, path: state.path};

    function moveToMode(){
        const state = stateRef.current.mode;
        if(selectedUnit && state!=='move-to'){
            setState({...state, mode: 'move-to'});
        } else {
            setState({...state, mode: 'regular'});
        }
    }

    function patrolToMode(){
        const state = stateRef.current.mode;
        if(selectedUnit && state!=='patrol-to'){
            setState({...state, mode: 'patrol-to'});
        } else {
            setState({...state, mode: 'regular'});
        }
    }


    useEffect(() => {
        const handles = [
            MessageBus.register("move-to-mode", moveToMode, this),
            MessageBus.register("patrol-to-mode", patrolToMode, this)
        ];
        return ()=>{
            MessageBus.revokeByHandles(handles);
        };
    }, []);

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
            const collision = map.unitAt(pos);
            if(collision) {
                if(collision.player === selectedUnit.player){
                    return collision.canLoad(selectedUnit, false);
                } else if(collision.clazz==='city'){
                    return selectedUnit.definition().groundForce; //attack
                } else {
                    return true;
                }
            }
            return selectedUnit.canMoveOn(world[pos.y][pos.x].type);
        };
        const hudPoint = (pos, dy , dx, direction) => {
            const dp = map.normalize({y: pos.y+dy,x: pos.x+dx});
            if(allowed(dp)) hudMap[`${dp.y}_${dp.x}`] = {
                className: "hud-move-"+direction,
                action: () => MessageBus.sendLockable("cursor-direction", direction)
            };

        };

        const hudPath = (path, action) => {
            path.forEach((pos,i)=>{
                if(i!==path.length-1) {
                    hudMap[`${pos.y}_${pos.x}`] = {
                        className: "hud-move-" + pos.direction
                    };
                } else {
                    hudMap[`${pos.y}_${pos.x}`] = {
                        className: "hud-move-X"
                    };
                    if(action){
                        hudMap[`${pos.y}_${pos.x}`].action = () => {
                            setState({...state, mode: 'regular', path: null});
                            MessageBus.send("give-order", action, state.path, null, false);
                        };
                    }
                }
            });
        };

        if(state.mode === 'regular') {
            if(selectedUnit.order){
                hudPath(selectedUnit.order.queue);
            } else if(selectedUnit.canMove()){
                hudPoint(pos, -1, -1, "NW");
                hudPoint(pos, -1, 0, "N");
                hudPoint(pos, -1, +1, "NE");
                hudPoint(pos, 0, -1, "W");
                hudPoint(pos, 0, +1, "E");
                hudPoint(pos, +1, -1, "SW");
                hudPoint(pos, +1, 0, "S");
                hudPoint(pos, +1, +1, "SE");
            }
        }
        if(state.mode === 'move-to' && state.path) {
            hudPath(state.path, "move");
        }
        if(state.mode === 'patrol-to' && state.path) {
            hudPath(state.path, "patrol");
        }
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
    } else if(selectedUnit){
        unitHud(hudMap);
    }


    function onMouseOver(position){
        if(state.mode==='regular') return;
        const result = new navigationAStar(map.gameMap, selectedUnit, fogOfWar, false).route(position, false);
        let path = (result && result.route)?result.route:null;
        setState({...state, path: path});

    }
    // console.log(fogOfWar.prettyPrint());

    function cell(key, x, y, entry){
        const position = {y, x};
        const positionKey = `${y}_${x}`;
        const selected = selectedUnit&&
                        (!selectedUnit.isAlive||selectedUnit.isAlive())&&
                         selectedUnit.isOn(position);
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
        return <td key={key} className={clazzes.join(" ")} onMouseOver={()=>onMouseOver(position)}>
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