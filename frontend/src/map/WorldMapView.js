import React, {useEffect, useRef, useState} from "react";
import {any, number, shape} from "prop-types";
import {MessageBus} from "softwar-shared";
import {NAVIGATIONS_OFFSETS} from "softwar-shared/game/navigation.mjs";
import {TILE_SIZE} from "../Constants";
import UnitView from "./UnitView";
import {city} from "softwar-shared/game/city.mjs";
import {navigationAStar} from "softwar-shared/game/navigationAStar.mjs";

function WorldMapView({map, range, selectedUnit, fogOfWar}) {
    const [state, setState] = useState({mode: 'regular', path: null});
    const dimensions = map.dimensions;
    // the bus handlers below are registered once, so they read the latest values through this ref
    const stateRef = useRef();
    stateRef.current = {mode: state.mode, path: state.path, selectedUnit};

    function toggleMode(mode){
        const current = stateRef.current;
        if(current.selectedUnit && current.mode!==mode){
            setState({mode: mode, path: null});
        } else {
            setState({mode: 'regular', path: null});
        }
    }
    const moveToMode = () => toggleMode('move-to');
    const patrolToMode = () => toggleMode('patrol-to');


    // Escape: first cancel the order being given, then let go of the selected unit
    function escape(){
        if(stateRef.current.mode !== 'regular') {
            setState({mode: 'regular', path: null});
        } else if(stateRef.current.selectedUnit) {
            MessageBus.send("select-unit", null);
        }
    }

    useEffect(() => {
        const handles = [
            MessageBus.register("move-to-mode", moveToMode, this),
            MessageBus.register("patrol-to-mode", patrolToMode, this),
            MessageBus.register("escape-pressed", escape, this)
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
        // a tile the unit can step to: a short line from the unit and a ring to click
        const hudPoint = (pos, dy , dx, direction) => {
            const dp = map.normalize({y: pos.y+dy,x: pos.x+dx});
            if(allowed(dp)) hudMap[`${dp.y}_${dp.x}`] = {
                className: "hud-step hud-arrow-"+direction,
                action: (e) => {
                    MessageBus.sendLockable("cursor-direction", direction);
                    e.stopPropagation();
                    return true;
                }
            };

        };

        // the direction of one step between two neighbouring tiles (the map wraps around)
        const directionBetween = (from, to) => {
            const wrap = (d, size) => d > 1 ? d - size : d < -1 ? d + size : d;
            const dy = wrap(to.y - from.y, dimensions.height);
            const dx = wrap(to.x - from.x, dimensions.width);
            const offset = NAVIGATIONS_OFFSETS.find(o => o.y === dy && o.x === dx);
            return offset ? offset.direction : null;
        };

        // a route: a line through the centres of the tiles, a dot on every step and a ring at the end
        // kind: "move" or "patrol", which look different; action: the order a click on the end gives
        const hudPath = (path, action, kind = action) => {
            path.forEach((pos,i)=>{
                const classes = ["hud-path", "hud-route-" + (kind || "move")];
                if (i === 0 && selectedUnit.isOn(pos)) classes.push("hud-start");
                const cameFrom = i > 0 ? path[i-1].direction : directionBetween(selectedUnit.derivedPosition(), pos);
                if (cameFrom && cameFrom !== "X") classes.push("hud-in-" + cameFrom);
                if(i!==path.length-1) {
                    classes.push("hud-out-" + pos.direction);
                    hudMap[`${pos.y}_${pos.x}`] = {
                        className: classes.join(" ")
                    };
                } else {
                    classes.push("hud-end");
                    hudMap[`${pos.y}_${pos.x}`] = {
                        className: classes.join(" ")
                    };
                    if(action){
                        hudMap[`${pos.y}_${pos.x}`].action = (e) => {
                            setState({...state, mode: 'regular', path: null});
                            MessageBus.send("give-order", action, state.path, null, false);
                            e.stopPropagation();
                            return true;
                        };
                    }
                }
            });
        };

        if(state.mode === 'regular') {
            if(selectedUnit.order){
                if(selectedUnit.order.action==='move') {
                    hudPath(selectedUnit.order.queue, null, selectedUnit.order.action);
                } else if(selectedUnit.order.action==='patrol') {
                    hudPath(selectedUnit.order.queue, null, selectedUnit.order.action);
                }
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
            if(unit.order && unit.order.queue){
                const order = unit.order;
                const key = (pos) => `${pos.y}_${pos.x}`;
                // An order with an empty route has no from/to
                [order.from, order.to, ...order.queue]
                    .filter(Boolean)
                    .forEach(p=>hudMap[key(p)]={className: clazz});
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

    // Round the corners of the discovered area: a corner is rounded when both
    // neighbours along it and the diagonal one are still undiscovered.
    function fogBorder(position){
        const undiscovered = (dy, dx) => !fogOfWar.discovered(map.normalize({y: position.y+dy, x: position.x+dx}));
        const n = undiscovered(-1, 0), e = undiscovered(0, 1), s = undiscovered(1, 0), w = undiscovered(0, -1);
        const layers = [];
        if (n) layers.push("fog-edge-n");
        if (e) layers.push("fog-edge-e");
        if (s) layers.push("fog-edge-s");
        if (w) layers.push("fog-edge-w");
        // two undiscovered sides round off the corner between them
        if (n && w && undiscovered(-1, -1)) layers.push("fog-corner-nw");
        if (n && e && undiscovered(-1, 1)) layers.push("fog-corner-ne");
        if (s && w && undiscovered(1, -1)) layers.push("fog-corner-sw");
        if (s && e && undiscovered(1, 1)) layers.push("fog-corner-se");
        // only the diagonal neighbour is undiscovered: the fray continues around its corner
        if (!n && !w && undiscovered(-1, -1)) layers.push("fog-outer-nw");
        if (!n && !e && undiscovered(-1, 1)) layers.push("fog-outer-ne");
        if (!s && !w && undiscovered(1, -1)) layers.push("fog-outer-sw");
        if (!s && !e && undiscovered(1, 1)) layers.push("fog-outer-se");
        if (layers.length) layers.push("fog-border");
        return layers;
    }

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
            if (fogOfWar) clazzes.push(...fogBorder(position));
        }
        if(fogOfWar && !fogOfWar.visible(position)){
            if(unit && unit.clazz==='city' && fogOfWar.discovered(position)) unit=new city(unit.derivedPosition(), unit.getName());
            else unit=null;
            clazzes.push("land-fog-of-war");
        }
        return <td key={key} className={clazzes.join(" ")} onMouseOver={()=>onMouseOver(position)} onClick={unit?null:()=>MessageBus.send("cursor-select", position)}>
            {unit?<UnitView unit={unit} selected={selected}/>:null}
            {hud?<div className={(unit?"hud-action with-unit ":"hud-action ")+hud.className} onClick={hud.action}></div>:null}
        </td>;
    }

    function viewport(range, world) {
        const deltaX = range.deltaX;
        const deltaY = range.deltaY;
        return <table  className={"world-map world-map-mode-" + state.mode} style={{width: `${deltaX*TILE_SIZE}px`, height: `${deltaY*TILE_SIZE}px`}}>
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

    const orderBanner = {
        'move-to': <>Move order <span>Click a destination · M to cancel</span></>,
        'patrol-to': <>Patrol order <span>Click the far end of the route · P to cancel</span></>
    }[state.mode];

    return <>
        {orderBanner && selectedUnit ? <div className={"order-mode-banner"} role={"status"}>{orderBanner}</div> : null}
        {viewport(normalizedRange(range), map.world)}
    </>;
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