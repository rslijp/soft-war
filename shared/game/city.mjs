import {unitTypes} from "./unit-types.mjs"
import {unit} from "./unit.mjs"
import MessageBus from "../services/message-service.mjs";
import {applyUnitTraitsOn} from "./trait/unit-traits.mjs";

export const CITY_NAMES = [
    "New York", "London","Hong Kong", "Paris", "Singapore", "Tokyo", "Sydney",
    "Milan", "Shanghai", "Beijing", "Madrid", "Moscow", "Seoul", "Toronto",
    "Brussels", "Buenos Aires", "Mumbai", "Bangalore", "Kuala Lumpur", "Chicago", "Warsaw", "S&atilde;o Paulo",
    "Z&uuml;rich", "Amsterdam", "Mexico City", "Jakarta", "Dublin", "Bangkok", "Taipei", "Istanbul",
    "Rome", "Lisbon", "Frankfurt am Main", "Stockholm", "Prague", "Vienna", "Budapest", "Athens",
    "Caracas", "Los Angeles", "Auckland", "Santiago","Washington", "Melbourne", "Johannesburg",
    "Tel Aviv", "Barcelona", "San Francisco", "Atlanta", "Manila", "Bogot&aacute;", "New Delhi",
    "Dubai", "Bucharest", "Oslo", "Berlin", "Helsinki", "Geneva", "Copenhagen", "Riyadh", "Hamburg",
    "Cairo", "Luxembourg", "Bangalore", "Dallas", "Kuwait City", "Boston", "Munich", "Jeddah", "Miami",
    "Lima", "Kiev", "Houston", "Guangzhou", "Beirut", "Karachi", "D&uuml;sseldorf", "Sofia", "Montevideo",
    "Nicosia", "Rio de Janeiro", "Ho Chi Minh City",
    "Montreal", "Nairobi", "Bratislava", "Panama City", "Chennai", "Brisbane", "Casablanca", "Denver",
    "Quito", "Stuttgart", "Vancouver", "Zagreb", "Manama", "Guatemala City", "Cape Town", "San Jos&eacute;",
    "Minneapolis", "Santo Domingo", "Seattle", "Ljubljana", "Shenzhen", "Perth", "Kolkata", "Guadalajara",
    "Antwerp", "Philadelphia", "Rotterdam", "Amman", "Portland", "Lagos","Detroit", "Manchester",
    "Wellington", "Riga", "Guayaquil", "Edinburgh", "Porto", "San Salvador", "St. Petersburg", "Tallinn",
    "Port Louis", "San Diego", "Islamabad", "Birmingham", "Doha", "Calgary", "Almaty", "Columbus"];

export function city(position, name, producing, production) {
    this.capacity = 8;
    this.position = position;
    this.nestedUnits = [];
    this.player = null;
    this.clazz = "city";
    this.name = name;
    this.producingType = producing ? producing.type : null;
    this.producing = () => {
        return this.producingType ? unitTypes[this.producingType] : null;
    };
    this.production = production || 0;
    this.sight = 4;

    applyUnitTraitsOn(this);

    this.canMove = () => {
        return false;
    };
    this.canLoad = function(unit, ignoreMoves) {
        if (this.nestedUnits.length >= this.capacity) {
            return false;
        }
        if (!ignoreMoves && !unit.canMove()) {
            return false;
        }
        if (unit.player !== this.player) {
            return false;
        }
        return true;
    };
    this.derivedPosition = () => {
        return {y: this.position.y, x: this.position.x};
    };
    this.initTurn = () => {
        _.each(this.nestedUnits, (unit) => {
            unit.heal();
        });
        this.internalInit();
        return this;
    };
    this.endTurn = () => {
        var producing = this.producing();
        if (producing) {
            this.production += 1;
            if (this.production >= producing.costs) {
                this.constructUnit();
            }
        } else {
            this.production = 0;
        }
        if (!this.producingType) {
            MessageBus.send("city-not-producing", this);
        }
    };
    this.produce = (type) => {
        if (type != this.producingType) {
            this.production = 0;
        }
        this.producingType = type;
    };
    this.conquered = (conquerer) => {
        this.produce(null);
        this.player = conquerer;
        MessageBus.send("city-conquered", this);
    };
    this.destroyed = (unit) => {
        this.internalUnload(unit);
    };
    this.constructUnit = () => {
        var producing = this.producing();
        if (this.production < producing.costs) {
            throw "Unit isn't finished yet";
        }
        if (this.nestedUnits.length >= this.capacity) {
            MessageBus.send("unit-creation-suspended", this, producing);
            return;
        }
        var unit = new unit(this.producingType);
        unit.player = this.player;
        this.internalLoad(unit);
        this.production = 0;
        MessageBus.send("unit-created", this, unit);
    };
    this.hasSight=function(){
        return true;
    }
    this.siege = () => {
        var position = this.derivedPosition();
        return {
            health: 1,
            city: this,
            player: this.player,
            clazz: "city-defense",
            derivedPosition: () => {
                return position;
            },
            modifiers: () => {
                return [];
            }
        };
    };
};