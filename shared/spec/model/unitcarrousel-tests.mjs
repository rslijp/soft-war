import {unitCarrousel} from "../../game/unit-carrousel.mjs";
import {unit} from "../../game/unit.mjs";
import {city} from "../../game/city.mjs";

function times(n, func){
    for(var i=0; i<n; i++){
        func.apply(this);
    }
}

describe("unitCarrousel clazz", function(){
    var tank = new unit("T", {y: 1, x: 1}).initTurn();
    var fighter = new unit("F", {y: 2, x: 2}).initTurn();
    var bomber = new unit("B", {y: 3, x: 3}).initTurn();
    var infantry = new unit("I", {y: 4, x: 4}).initTurn();
    var joker = new unit("b", {y: 5, x: 5}).initTurn();

    var units = [];
    beforeEach(function(){
        units = [
            tank.initTurn(),
            fighter.initTurn(),
            bomber.initTurn(),
            infantry.initTurn()
        ]
    });
    describe("next method", function(){
        it("should start with the first unit from the original list", function(){
            //Given
            var carrousel = new unitCarrousel(units);

            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toEqual(tank);
            expect(carrousel.hasMore()).toBeTruthy();
        });
        it("should return the second unit from the original list on the second call", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toEqual(fighter);
            expect(carrousel.hasMore()).toBeTruthy();
        });
        it("should return the third unit from the original list on the third call", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            carrousel.next();
            carrousel.next();

            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toEqual(bomber);
            expect(carrousel.hasMore()).toBeTruthy();
        });
        it("should return the last unit from the original list on the fourth call", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            carrousel.next();
            carrousel.next();
            carrousel.next();

            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toEqual(infantry);
            expect(carrousel.hasMore()).toBeFalsy();
        });
        it("should return null from the original list on the fifth call", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            carrousel.next();
            carrousel.next();
            carrousel.next();
            carrousel.next();

            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toBeFalsy()
            expect(carrousel.hasMore()).toBeFalsy();
        });
        it("should work on a copy of the orignal list", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            units[0]=joker
            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toEqual(tank);
            expect(units.length).toEqual(4);
        });
        it("should skip unmovable units", function(){
            //Given
            fighter.movesLeft=0;
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var unit = carrousel.next();

            //Then
            expect(unit).toEqual(bomber);
        });
        it("should skip loaded units in a unit", function(){
            //Given
            fighter.inside=joker;
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var unit = carrousel.next();
            fighter.inside=null;
            //Then
            expect(unit).toEqual(bomber);
        });
        it("should skip fortified units", function(){
            //Given
            fighter.fortified=true;
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var unit = carrousel.next();
            fighter.fortified=false;
            //Then
            expect(unit).toEqual(bomber);
        });
        it("should skip fortified units", function(){
            //Given
            fighter.health=0;
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var unit = carrousel.next();
            fighter.health=2;
            //Then
            expect(unit).toEqual(bomber);
        });
        it("should not skip loaded units in a city", function(){
            //Given
            fighter.inside=new city("Tiel", {y: 3, x: 2});
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var unit = carrousel.next();
            fighter.inside=null;
            //Then
            expect(unit).toEqual(fighter);
        });
    });
    describe("reschedule method", function(){
        it("should reschedule to end of queue", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            var unit = carrousel.next();
            expect(carrousel.current()).toEqual(unit)

            //When
            carrousel.reschedule(unit);
            times(4, carrousel.next);

            //Then
            expect(carrousel.current()).toEqual(unit);
        });
        it("should clear the current when the current is being rescheduled", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            var unit = carrousel.next();
            expect(carrousel.current()).toEqual(unit)

            //When
            carrousel.reschedule(unit);

            //Then
            expect(carrousel.current()).toBeUndefined();
        });
        it("should reschdule units on queue", function(){
            //Given
            var carrousel = new unitCarrousel(units);

            //When
            carrousel.reschedule(fighter);
            times(4, function(){
                carrousel.next();
            });

            //Then
            expect(carrousel.current()).toEqual(fighter);
        });
    });
    describe("hasMore method", function(){
        it("should return true on after init when there are moveable untis", function(){
            //Given
            var carrousel = new unitCarrousel(units);

            //When
            var hasMore = carrousel.hasMore();

            //Then
            expect(hasMore).toBeTruthy();
        });
        it("should return true when there are more moveable units", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            carrousel.next();

            //When
            var hasMore = carrousel.hasMore();

            //Then
            expect(hasMore).toBeTruthy();
        });
        it("should return true when down the queue there are more moveable units", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            fighter.movesLeft=0;
            bomber.movesLeft=0;
            tank.movesLeft=1;
            carrousel.next();

            //When
            var hasMore = carrousel.hasMore();

            //Then
            expect(hasMore).toBeTruthy();
        });
        it("should return false when down the queue doesn't contain moveable units", function(){
            //Given
            var carrousel = new unitCarrousel(units);
            fighter.movesLeft=0;
            bomber.movesLeft=0;
            tank.movesLeft=0;
            carrousel.next();

            //When
            var hasMore = carrousel.hasMore();

            //Then
            expect(hasMore).toBeFalsy();
        });
    });
});