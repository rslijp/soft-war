import MessageBus from "../services/message-service.mjs";
import {fogOfWar} from "./fog-of-war.mjs";
import {applyPlayerTraitsOn} from "./trait/player-traits.mjs";
import {navigationAStar} from "./navigationAStar.mjs";
import {orders} from "./orders.mjs";
import {NAVIGATIONS_OFFSETS} from "./navigtion.mjs";

const INTEREST = new Set(['land', 'mountain']);
const AI_PARAMETERS = [
    {
        type: 'land',
        units: new Set(['C']),
    },
    {
        type: 'land',
        units: new Set(['I', 'T', 'M']),
    },
    {
        type: 'air',
        units: new Set(['F', 'B', 'H']),
    },
    {
        type: 'sea',
        units: new Set(['D', 'S', 't', 'c', 'a', 'b']),
    }

]


export function aiPlayer(index, id, name, color, units, map) {
    this.state="START";
    this.fogOfWar = new fogOfWar([], map);
    this.index = index;
    this.units = units;
    this.unitsMap = null;
    this.id = id;
    this.name = name;
    this.color = color;
    this.type="AI";
    this.position={y:0, x:0};
    this.intelligence=[];
    this.attention=new Set();
    this.embarking={};
    this.activeOrders={};

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
            if(u.order){
                sweep.goals[u.order.purpose]++;
            }
            AI_PARAMETERS.forEach(param => {
                if(param.units.has(u.type)) sweep.ownStats[param.type]++;
            });
        } else {
            sweep.enemies[k]=u;
            if(u.clazz==='city') {
                sweep.enemyCities[k]=u;
            } else {
                sweep.enemyUnits[k]=u;
            }
            AI_PARAMETERS.forEach(param => {
               if(param.units.has(u.type)) sweep.foeStats[param.type]++;
            });
        }
    }

    this.intelligenceSweep = (mainUnit)=> {
        const unitPos = mainUnit.derivedPosition();
        const unitKey = toKey(unitPos);
        const aiParam = AI_PARAMETERS.find(param => param.units.has(mainUnit.type));
        let sweepType = aiParam.type;
        console.log(mainUnit.type, sweepType, this.embarking);
        if(sweepType==='sea' && this.embarking[mainUnit.id]!==undefined){
            sweepType='land';
        }

        let sweep = this.intelligence.find(c=>c.ids[mainUnit.id]);
        if(!sweep && mainUnit.inside){
            sweep = this.intelligence.find(c=>c.ids[mainUnit.inside.id]);
        }
        if(!sweep){
            sweep={ids: {},
                   type: sweepType,
                   transport: false,
                   landmass: {},
                   undiscovered: {},
                   friendlyCities:{},
                   friendlyUnits:{},
                   enemies:{},
                   enemyCities:{},
                   enemyUnits:{},
                   typeStats: {},
                   ownStats: {land: 0, air: 0, sea: 0},
                   foeStats: {land: 0, air: 0, sea: 0},
                   goals: {attack:0, discover: 0, transport: 0}
            };
            this.intelligence.push(sweep);
        }

        const ensureUnitStats = (type) => {
            if(sweep.typeStats[mainUnit.type]) return sweep.typeStats[mainUnit.type];
            const unitStats = {count: 0, construction: 0};
            sweep.typeStats[mainUnit.type] = unitStats;
            return unitStats;
        }
        const unitStats = ensureUnitStats(mainUnit.type);
        unitStats.count++;
        if(mainUnit.type==='C' && mainUnit.producingType){
            const producingStats = ensureUnitStats(mainUnit.producingType);
            producingStats.construction++;
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

        let sweep = this.intelligence.find(c => c.ids[mainUnit.id]);
        if(mainUnit.isAlive()){
            const newPos = mainUnit.derivedPosition();
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

    this.makeOrderBasedOnIntelligence = (mainUnit, foes)=> {
        if(foes && foes.length>0){
            const unitPosition = mainUnit.derivedPosition();
            for(var i=0;i<foes.length; i++){
                const target = foes[i];
                const targetPos = target.derivedPosition();
                if(map.distance(unitPosition, targetPos) == 1){
                    // mainUnit.order=null;
                    // delete this.activeOrders[mainUnit.id];
                    this.unitsMap.move(mainUnit, targetPos, false);
                    return {
                        action: "attack",
                        hash: "attack"
                    }
                }
            }
            console.log("Continue approach");
        }

        let sweep = this.intelligence.find(c => c.ids[mainUnit.id]);
        const aStar = new navigationAStar(map, mainUnit, this.fogOfWar, false, this.attention.has(mainUnit.id)?this.unitsMap:null);
        const plan = (name, targets, toPos, ignoreFogOfWar)=> {
            let navigation = null;
            Object.keys(targets).forEach(d => {
                const to = targets[d];
                const result = aStar.route(toPos(to), ignoreFogOfWar);
                if (!result || !result.route) {
                    return
                }
                if (navigation === null ||
                    result.route.length < navigation.route.length) {
                    result.purpose = name;
                    result.target = d;
                    navigation = result;
                }
            });
            return navigation;
        };

        const loadSpot = (name) => {
            if(sweep.type !== 'land') return null;
            if(!mainUnit.type === 't') return null;
            if(this.embarking[mainUnit.id]) return null;
            if(!this.inside || this.inside.type !== 'C') return null;
            const pos = mainUnit.derivedPosition();
            const directions = NAVIGATIONS_OFFSETS.filter(offSet => this.unitsMap.canMoveOn(mainUnit, map.normalize({
                y: pos.y+offSet.y,
                x: pos.x+offSet.x
            })));
            if(directions.length===0) return null;
            const i = Math.floor(Math.random()*directions.length);
            const direction = directions[i];
            const to = map.normalize({
                y: pos.y+direction.y,
                x: pos.x+direction.x
            });
            return {
                route: [to],
                purpose: name,
                target: to
            }
        };

        const transports = Object.values(sweep.friendlyUnits).filter(u=>u.type==='t' && this.embarking[u.id]<=2);
        let path = loadSpot("load") ||
            plan("attack",sweep.enemies, n=>n.derivedPosition(), false) ||
            plan("load",transports, n=>n.derivedPosition(), false) ||
            plan("discover", sweep.undiscovered , n=>n, true);

        if(path) {
            sweep.goals[path.purpose]++;
            if(path.purpose==="load"){
                const transporter = path.target;
                this.embarking[transporter.id]++;
            }
        } else {
            sweep.goals['transport']++;
        }

        // if(path) console.log("move", mainUnit.derivedPosition(), JSON.stringify(path))
        // else console.log("roam");

        return path ? {
            action: "move",
            queue: path.route,
            from: path.route[0],
            to: path.route[path.route.length - 1],
            hash: path.hash
        } : {
            action: "roam",
            hash: "roam"
        }
    }

    this.unitOrderStep=()=>{
        const unit = this.selectedUnit;
        if(unit) {
            this.updateIntelligence(unit);
        }
    };

    this.conquerTheWorld=()=>{
        console.log("Thinking...");

        const attackOrder = (unit) => {
            unit.order = null;
            this.attention.delete(unit.id);
            delete this.activeOrders[unit.id];
            this.scheduleConquerTheWorld();
            return;
        }

        this.conquerHandle = null;
        if(this.selectedUnit && this.selectedUnit.clazz==='city'){
            if(!this.selectedUnit.producingType) this.selectedUnit.produce('T');
            MessageBus.send("next-unit");
        }
        else if(this.selectedUnit &&
                this.selectedUnit.canMove()){
            const unit = this.selectedUnit;
            if(this.embarking[unit.id] !== undefined){
                if(unit.nestedUnits.length == this.embarking[unit.id]){
                    this.embarking[unit.id]=undefined;
                } else {
                    unit.movesLeft=0;
                }
            }
            if(!unit.order) {
                delete this.activeOrders[unit.id];
            }
            let activeOrders = this.activeOrders[unit.id];
            if(activeOrders && this.attention.has(unit.id)){
                console.log("Possible reassignment of orders", unit.getName(), unit.order.foes, activeOrders.hash);
                const order = this.makeOrderBasedOnIntelligence(unit, unit.order.foes);
                if(order.action === 'attack') {
                    attackOrder(unit);
                    console.log("AFTER",this.activeOrders);
                    return;
                }
                if(order.hash!==activeOrders.hash) {
                    unit.order = order;
                    delete this.activeOrders[unit.id];
                    console.log("Reassignment", unit.getName(), order.hash);
                } else {
                    console.log("Roam");
                    this.attention.delete(unit.id);
                }
            } else
            if(!unit.order) {
                console.log("Assigning orders", unit.getName());
                const order = this.makeOrderBasedOnIntelligence(unit);
                if(order.action === 'attack') {
                    attackOrder(unit);
                    return;
                }
                console.log("ORDERS", !!order);
                unit.order = order;
            }
            if(unit.order) {
                if (!this.activeOrders[unit.id]) {
                    this.activeOrders[unit.id] = new orders(unit, this.unitsMap, this);
                }
                this.activeOrders[unit.id].lockedExecuteOrders();
                if (unit.isAlive()) {
                    // this.fogOfWar.add(unit);
                    this.position = unit.derivedPosition();
                }

                this.updateIntelligence(unit);
                MessageBus.send("screen-update");
                this.scheduleConquerTheWorld();
            } else {
                MessageBus.send("next-unit");
            }
        } else {
            MessageBus.send("next-unit");
        }
    }

    this.onEndTurn = ()=>{
        this.units.filter(u=>u.clazz==='city').forEach(city=>{
            let sweep = this.intelligence.find(c => c.ids[city.id]);
            console.log("OWN STATS",Object.keys(sweep.landmass).length, sweep.ownStats, sweep.ownStats['land'] / Object.keys(sweep.landmass).length);

            if(!city.producingType || city.production == 0) {
                console.log(">>>>>>>",city.getName())
                console.log(this.intelligence[0].ids[city.id]);
                let sweep = this.intelligence.find(c => c.ids[city.id]);
                console.log("OWN STATS",sweep.ownStats, sweep.ownStats['land'] / Object.keys(sweep.landmass).length);
                console.log("FOE STATS",sweep.foeStats);
                if(sweep.goals.transport>0 && sweep.ownStats.land > 2){
                    console.log("transport");
                    city.produce('t');
                } else if(sweep.goals.attack==0 && sweep.ownStats.land > 4) {
                    var transport = Math.random()>0.8;
                    console.log("transport", transport);
                    city.produce(transport?'t':'T');
                } else if((sweep.goals.attack>0 || sweep.goals.transport>0)  && sweep.ownStats.land > 4) {
                    var fighter = Math.random()>0.8;
                    console.log("fighter", fighter);
                    city.produce(fighter?'f':city.producingType);
                } else {
                    console.log("default tank")
                    city.produce('T');
                }
                console.log("SELECT",city.producingType,"FOR PRODUCTION", city.getName())
            }
        });
        console.log("===========")
        this.units.forEach(u=>{
            if(u.clazz==='city') {
                console.log(u.getName(), u.producingType, u.production);
            } else {
                const postfix = "("+u.type+")";
                console.log(u.getName(),postfix, u.derivedPosition(), u.order);
            }
        });
    }

    this.scheduleConquerTheWorld = (unit) => {
       if(this.conquerHandle) {
            return;
        }
        this.conquerHandle = setTimeout(()=>this.conquerTheWorld(), 250);
    }

    this.autoNext=()=>{
        if(this.selectedUnit && this.selectedUnit.canMove()) this.scheduleConquerTheWorld();
        return true;
    };

    this.cursorSelect=(unit)=>{
        this.selectedUnit = unit;
    }

    this.unitAttention=(unit)=>{
        console.log(unit.getName(), "requires attention", unit.order.foes);
        this.attention.add(unit.id);
    }

    this.onRegisterUnit = (unit)=>{
        if(unit.type === 't'){
            this.embarking[unit.id]=0;
        }
    }

    applyPlayerTraitsOn(this);
    const _super =  {initTurn: this.initTurn.bind(this)};
    this.initTurn = () => {
        _super.initTurn();
        this.attention=new Set();
        this.activeOrders={};
        this.intelligence=[];
        this.scheduleConquerTheWorld();
        this.units.forEach(u=>{
            if(u.inside) this.intelligenceSweep(u.inside);
            this.intelligenceSweep(u);
        });
        this.intelligence.forEach(sweep=>{
            console.log("OWN STATS",sweep.ownStats);
            console.log("FOE STATS",sweep.foeStats);
        })
    }
    this.init();

    MessageBus.register("next-unit", this.autoNext, this);
    MessageBus.register("unit-order-attention", this.unitAttention, this);
    // MessageBus.register("unit-order-step", this.unitOrderStep, this)
    MessageBus.register("enemy-spotted", this.enemySpotted, this);
    MessageBus.register("unit-created", this.registerUnit, this);
    // MessageBus.register("city-defense-destroyed", this.enemyCityConquered, this);
}