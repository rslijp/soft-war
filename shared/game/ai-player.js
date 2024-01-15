import MessageBus from "../services/message-service.mjs";
import {fogOfWar} from "./fog-of-war.mjs";
import {applyPlayerTraitsOn} from "./trait/player-traits.mjs";
import {navigationAStar} from "./navigationAStar.mjs";
import {orders} from "./orders.mjs";

const INTEREST = new Set(['land', 'mountain']);

export function aiPlayer(index, name, color, units, map) {
    this.state="START";
    this.fogOfWar = new fogOfWar([], map);
    this.index = index;
    this.units = units;
    this.unitsMap = null;
    this.name = name;
    this.color = color;
    this.type="AI";
    this.position={y:0, x:0};
    this.intelligence=[];

    const toKey = (pos) => `${pos.y}_${pos.x}`;
    const addUnit = (u, sweep)=>{
        if(!u) return;
        const p = u.derivedPosition();
        const k = toKey(p);
        sweep.ids[u.id]=p;
        if(u.player===this.index){
            if(u.clazz==='city') {
                sweep.friendlyCities[k]=u;
            } else {
                sweep.friendlyUnits[k]=u;
            }
        } else {
            sweep.enemies[k]=u;
            if(u.clazz==='city') {
                sweep.enemyCities[k]=u;
            } else {
                sweep.enemyUnits[k]=u;
            }
        }
    }

    this.intelligenceSweep = (mainUnit)=> {
        const unitPos = mainUnit.derivedPosition();
        const unitKey = toKey(unitPos);

        let sweep = this.intelligence.find(c=>c.ids[mainUnit.id]);
        if(!sweep && mainUnit.inside){
            sweep = this.intelligence.find(c=>c.ids[mainUnit.inside.id]);
        }
        if(!sweep){
            sweep={ids: {}, landmass: {}, undiscovered: {}, friendlyCities:{}, friendlyUnits:{}, enemies:{}, enemyCities:{}, enemyUnits:{}};
            this.intelligence.push(sweep);
        }


        addUnit(mainUnit, sweep);

        if(INTEREST.has(map.position(unitPos))){
            const seen = new Set([unitKey]);
            sweep.landmass[toKey(unitPos)]=unitPos;
            const scanPos = (pos)=>{
                const r = [];
                const offsets = [
                    {y: pos.y-1,x: pos.x-1},
                    {y: pos.y-1,x: pos.x},
                    {y: pos.y-1,x: pos.x+1},

                    {y: pos.y,x: pos.x-1},
                    {y: pos.y,x: pos.x+1},

                    {y: pos.y+1,x: pos.x-1},
                    {y: pos.y+1,x: pos.x},
                    {y: pos.y+1,x: pos.x+1}
                ];
                offsets.forEach(offset=>{
                    const c = map.normalize(offset);
                    const k = toKey(c);
                    if(seen.has(k)) return;
                    if(!this.fogOfWar.discovered(c)) {
                        sweep.undiscovered[k]=c;
                        return;
                    }
                    delete sweep.undiscovered[k];
                    seen.add(k);
                    if(this.fogOfWar.visible(c)){
                        const u = this.unitsMap.get(c)
                        addUnit(u, sweep);
                    }
                    if(INTEREST.has(map.position(c))) {
                        r.push(c);
                    }
                })
                return r;
            }
            const scanHead = (head) => {
                return head.map(scanPos).
                    flat().
                    filter(p=>!sweep.landmass[toKey(p)]);
            }
            let head = [unitPos];
            while((head=scanHead(head)).length>0){
                head.forEach(p=>sweep.landmass[toKey(p)]=p);
            }
        }
        return sweep;
    }

    this.updateIntelligence = (mainUnit)=> {
        const toKey = (pos) => `${pos.y}_${pos.x}`;
        console.log(mainUnit);
        const newPos = mainUnit.derivedPosition();

        let sweep = this.intelligence.find(c => c.ids[mainUnit.id]);
        if(mainUnit.isAlive()){
            const oldPos = sweep.ids[mainUnit.id];
            // console.log(oldPos,"==>",newPos);
            if(toKey(newPos) === toKey(oldPos)) return;
            sweep.ids[mainUnit.id]=newPos;
            if(oldPos) {
                delete sweep.friendlyUnits[toKey(oldPos)];
            }
            const newPosKey = toKey(newPos);
            sweep.friendlyUnits[newPosKey]=mainUnit;
            delete sweep.enemies[newPosKey];
            delete sweep.enemyCities[newPosKey];
            delete sweep.enemyUnits[newPosKey];

            const viewRange = this.fogOfWar.range(newPos);
            viewRange.forEach(p=>{
                const k = toKey(p);
                delete sweep.undiscovered[k];
                const u = this.unitsMap.get(c)
                addUnit(u, sweep);
                if(INTEREST.has(map.position(p))) sweep.landmass[k]=p;
            });
        } else {
            const oldPos = sweep.ids[mainUnit.id];
            delete sweep.ids[mainUnit.id];
            if(oldPos) sweep.friendlyUnits[toKey(oldPos)]=null;
        }
    }

    this.makeOrderBasedOnIntelligence = (mainUnit)=> {
        let sweep = this.intelligence.find(c => c.ids[mainUnit.id]);
        const aStar = new navigationAStar(map, mainUnit, this.fogOfWar);
        const plan = (name, targets, toPos, ignoreFogOfWar)=> {
            let path = null;
            Object.keys(targets).forEach(d => {
                const to = targets[d];
                const result = aStar.route(toPos(to), ignoreFogOfWar);
                if (!result || !result.route) {
                    return
                }
                if (path === null ||
                    result.route.length < path.length) {
                    path = result.route;
                }
            });
            return path;
        }

        const path = plan("enemy",sweep.enemies, n=>n.derivedPosition(), false) ||
                     plan("discover", sweep.undiscovered , n=>n, true);

        if(path) console.log("move", path)
        else console.log("roam");

        return path ? {
            action: "move",
            queue: path,
            from: path[0],
            to: path[path.length - 1]
        } : {
            action: "roam"
        }
    }

    this.unitOrderStep=()=>{
        if(this.selectedUnit) {
            this.updateIntelligence(this.selectedUnit);
        }
    };

    this.conquerTheWorld=()=>{
        if(this.selectedUnit && this.selectedUnit.clazz==='city'){
            MessageBus.send("next-unit");
        }
        else if(this.selectedUnit && this.selectedUnit.canMove()){
            const unit = this.selectedUnit;
            if(!unit.order) {
                const order = this.makeOrderBasedOnIntelligence(unit);
                unit.order = order;
            }
            const r = new orders(unit, this.unitsMap, this).lockedExecuteOrders();
            if(unit.isAlive()){
                // this.fogOfWar.add(unit);
                this.position = unit.derivedPosition();
            }

            this.updateIntelligence(unit);
            MessageBus.send("screen-update");
            this.scheduleConquerTheWorld();
        } else {
            MessageBus.send("next-unit");
        }
    }

    this.scheduleConquerTheWorld = () => {
        setTimeout(()=>this.conquerTheWorld(), 250);
    }

    this.autoNext=()=>{
        if(this.selectedUnit) this.scheduleConquerTheWorld();
        return true;
    };

    this.cursorSelect=(unit)=>{
        this.selectedUnit = unit;
    }

    applyPlayerTraitsOn(this);
    const _super =  {initTurn: this.initTurn.bind(this)};
    this.initTurn = () => {
        _super.initTurn();
        this.intelligence=[];
        this.scheduleConquerTheWorld();
        this.units.forEach(u=>{
            if(u.inside) this.intelligenceSweep(u.inside);
            this.intelligenceSweep(u);
        });
    }
    this.init();

    MessageBus.register("unit-order-step", this.unitOrderStep, this)
    MessageBus.register("enemy-spotted", this.enemySpotted, this);
    MessageBus.register("unit-created", this.registerUnit, this);
    // MessageBus.register("city-defense-destroyed", this.enemyCityConquered, this);
}