import MessageBus from "../services/message-service.mjs";
import {statistics} from "./statistics.mjs";
import {unitsMap} from "./units-map.mjs";

export function game (map, players) {
    this.turn = 1;
    this.players = players;
    this.currentPlayerIndex = 0;
    this.player = (index) => {
        return this.players[index];
    };
    this.currentPlayer = function() {
        return this.player(this.currentPlayerIndex);
    };
    this.position = function() {
        return this.currentPlayer().position;
    };
    this.unitsMap = new unitsMap(players, map);
    this.statistics=[];

    this.setPosition = (newposition) => {
        var currentPlayer = this.currentPlayer();
        if (currentPlayer.cursorUpdate(newposition)) {
            MessageBus.send("screen-update", currentPlayer.position);
            if (currentPlayer.selectedUnit) {
                MessageBus.send("infobar-update");
            }
        }
    };

    this.specialAction = function(unit, action) {
        var currentPlayer = this.currentPlayer();
        if (currentPlayer.specialAction(action)) {
            MessageBus.send("screen-update", currentPlayer.position);
            if (currentPlayer.selectedUnit == unit) {
                MessageBus.send("infobar-update");
            }
        }
    };

    this.nextUnit = function() {
        var currentPlayer = this.currentPlayer();
        var unit = currentPlayer.carrousel.next();
        this.selectUnit(unit);
        MessageBus.send("next-unit-updated", unit);
        this.executeOrders(unit);
        if (currentPlayer.autoNext() && unit === null) {
            MessageBus.send("end-turn");
        }
    };

    this.executeOrders = (unit) => {
        if (unit && unit.order) {
            var currentPlayer = this.player(unit.player);
            var orders = new Model.Orders(unit, this.unitsMap, currentPlayer);
            orders.executeOrders();
        }
    };

    this.giveOrder = function(action, path, direction, confirmed) {
        var currentPlayer = this.currentPlayer();
        var unit = currentPlayer.selectedUnit;
        if (unit && action) {
            var order = {action: action, queue: path, direction:direction};
            if (path) {
                order.from = path[0];
                order.to = path[path.length - 1];
            }
            if (confirmed) {
                unit.order = order;
                MessageBus.send("order-given", order);
                this.executeOrders(unit);
            } else {
                MessageBus.send("confirm-order", unit, order);
            }
        }
    };

    this.revokeOrder = (confirmed) => {
        var unit = this.currentPlayer().selectedUnit;
        if (!unit) {
            return;
        }
        if (confirmed) {
            unit.order = null;
            MessageBus.send("order-revoked");
        } else {
            MessageBus.send("confirm-order", unit);
        }
    };

    this.cursorSelect = (position) => {
        this.selectUnit(this.unitsMap.get(position));
    };

    this.selectUnit = (unit) => {
        var currentPlayer = this.currentPlayer();
        if (!unit || unit.player === this.currentPlayerIndex) {
            unit = currentPlayer.cursorSelect(unit);
            if (unit) {
                currentPlayer.position = unit.derivedPosition();
            }
        }
        MessageBus.send("screen-update", currentPlayer.position);
        MessageBus.send("unit-selected", unit);
    };

    this.moveInDirection = (direction) => {
        this.setPosition(map.move(direction, this.position()));
    };

    this.battle = function(attacker, defender, at, blitz) {
        var defenderPosition = defender.derivedPosition();
        var attackerPosition = attacker.derivedPosition();
        var attackerGround = map.position(attackerPosition);
        var defenderGround = map.position(defenderPosition);
        var battle = new Model.Battle(
            attacker,
            defender,
            attacker.modifiers(defender, attackerGround),
            defender.modifiers(attacker, defenderGround)
        );
        var result = battle.fight();
        MessageBus.send("battle-results", attacker, defender, result);
        if (attacker.health === 0) {
            MessageBus.send("unit-attacked", defender, result.defenderDamage);
            MessageBus.send("unit-destroyed", attacker, this.currentPlayer());
        } else {
            MessageBus.send(defender.clazz + "-destroyed", defender, this.currentPlayer());
            if (blitz) {
                MessageBus.send("move-unit", attacker, at, blitz);
            }
        }
        MessageBus.send("screen-update");

    };

    this.cityUnderSiege = function(attacker, city, at) {
        if (city.nestedUnits.length > 0) {
            this.battle(attacker, city.nestedUnits[0], at);
        } else {
            if (attacker.canConquerCities()) {
                this.battle(attacker, city.siege(), at, true);
            }
        }
    };

    this.nextTurn = function() {
        this.currentPlayer().endTurn();
        this.currentPlayerIndex += 1;
        if (this.currentPlayerIndex === this.players.length) {
            this.turn += 1;
            this.currentPlayerIndex = 0;
        }
        var currentPlayer = this.currentPlayer();
        currentPlayer.initTurn();
        MessageBus.send("new-turn", currentPlayer.readMessages(), currentPlayer.index);
    };
    this.world = ()=>map.world();
    this.cityConquered = function(cityDefence, conquerer) {
        var city = cityDefence.city;
        if (city.player !== null) {
            var defender = this.player(city.player);
            defender.fogOfWar.remove(city);
            defender.unregisterUnit(city);
        }
        city.conquered(conquerer.index);
        conquerer.registerUnit(null, city);
        conquerer.fogOfWar.add(city);

    };

    this.endTurn = function() {
        var currentPlayer = this.currentPlayer();
        var carrousel = currentPlayer.carrousel;
        if (carrousel.allOrdersFinished()) {
            MessageBus.send("end-turn");
            currentPlayer.endTurn();
        } else {
            currentPlayer.endTurnPhase = true;
            carrousel.dropNonOrderUnits();
            MessageBus.send("end-of-turn-phase");
        }
    };

    this.toggleAutoNext = function() {
        var player = this.currentPlayer();
        player.toggleAutoNext();
    };

    this.winOrLoose = function(player){
        var actor = this.players[player];
        if(!actor.hasAnyUnits()){
            actor.looses();
        } else if(!actor.hasAnyCities()) {
            actor.roaming();
        }
        var winner = this.winner();
        if(winner){
            winner.wins();
            return true;
        } else {
            return false;
        }
    };

    this.winner = function(){
        var candidates = this.players.filter((candidate) => {
            return !candidate.hasLost();
        });
        if(candidates.length==1){
            return candidates[0];
        } else {
            return null;
        }
    };

    this.init= () => {
        players.forEach((player) => {
            player.unitsMap = this.unitsMap;
            this.statistics.push(new statistics(player));
        });
    }

    this.init();
    MessageBus.register("cursor-direction", this.moveInDirection, this);
    MessageBus.register("cursor-select", this.cursorSelect, this);
    MessageBus.register("cursor-go-to", this.setPosition, this);
    MessageBus.register("battle", this.battle, this);
    MessageBus.register("city-under-siege", this.cityUnderSiege, this);
    MessageBus.register("next-turn", this.nextTurn, this);
    MessageBus.register("city-defense-destroyed", this.cityConquered, this);
    MessageBus.register("special-action", this.specialAction, this);
    MessageBus.register("next-unit", this.nextUnit, this);
    MessageBus.register("auto-next", this.toggleAutoNext, this);
    MessageBus.register("execute-orders", this.executeOrders, this);
    MessageBus.register("propose-end-turn", this.endTurn, this);
    MessageBus.register("game-state-changed", this.winOrLoose, this);
};