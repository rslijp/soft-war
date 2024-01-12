import {battle} from "../../game/battle.mjs";

describe("map class", function(){
    describe("fight method", function(){
        it("should stop the battle when the attacker is destroyed", function(){
            //Given
            var attacker = {health: 1};
            var defender = {health: 1};
            var battleInstance = new battle(attacker, defender);
            spyOn(battleInstance, "round").and.returnValue("defender");

            //When
            battleInstance.fight();

            //Then
            expect(battleInstance.round).toHaveBeenCalled();
            expect(battleInstance.round.calls.count()).toEqual(1);
            expect(attacker.health).toEqual(0);
            expect(defender.health).toEqual(1);
        });
        it("should stop the battle when defender unit is destroyed", function(){
            //Given
            var attacker = {health: 1};
            var defender = {health: 1};
            var battleInstance = new battle(attacker, defender);
            spyOn(battleInstance, "round").and.returnValue("attacker");

            //When
            battleInstance.fight();

            //Then
            expect(battleInstance.round).toHaveBeenCalled();
            expect(battleInstance.round.calls.count()).toEqual(1);
            expect(attacker.health).toEqual(1);
            expect(defender.health).toEqual(0);
        });
        it("should keep doing rounds until one unit is destroyed", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender);
            spyOn(battleInstance, "round").and.returnValue("defender");

            //When
            battleInstance.fight();

            //Then
            expect(battleInstance.round).toHaveBeenCalled();
            expect(battleInstance.round.calls.count()).toEqual(3);
            expect(defender.health).toEqual(3);
            expect(attacker.health).toEqual(0);
        });
        it("should keep track of the dealt blows", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender);
            spyOn(battleInstance, "round").and.returnValue("defender");

            //When
            var result = battleInstance.fight();

            //Then
            expect(battleInstance.round).toHaveBeenCalled();
            expect(battleInstance.round.calls.count()).toEqual(3);
            expect(result.rounds).toEqual(["defender", "defender", "defender"]);
        });
        it("should keep track of the defender damage blows", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender);
            spyOn(battleInstance, "round").and.returnValue("attacker");

            //When
            var result = battleInstance.fight();

            //Then
            expect(battleInstance.round).toHaveBeenCalled();
            expect(battleInstance.round.calls.count()).toEqual(3);
            expect(result.defenderDamage).toEqual(3);
        });
        it("should keep track of the attacker damage blows", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender);
            spyOn(battleInstance, "round").and.returnValue("defender");

            //When
            var result = battleInstance.fight();

            //Then
            expect(battleInstance.round).toHaveBeenCalled();
            expect(battleInstance.round.calls.count()).toEqual(3);
            expect(result.attackerDamage).toEqual(3);
        });
    });
    describe("round method", function(){
        it("should win the round for rhs when throwing a 1 to 50", function(){
            //Given
            for(var dice=1; dice<=50; dice++){
                var attacker = {health: 3};
                var defender = {health: 3};
                var battleInstance = new battle(attacker, defender);
                spyOn(battleInstance, "dice").and.returnValue(dice);

                //When
                var wonby = battleInstance.round();

                //Then
                expect(battleInstance.dice).toHaveBeenCalled();
                expect(battleInstance.dice.calls.count()).toEqual(1);
                expect(wonby).toEqual("defender");
            }
        });
        it("should win the round for attacker when throwing a 51 to 100", function(){
            for(var dice=51; dice<=100; dice++){
                var attacker = {health: 3};
                var defender = {health: 3};
                var battleInstance = new battle(attacker, defender);
                spyOn(battleInstance, "dice").and.returnValue(dice);

                //When
                var wonby = battleInstance.round();

                //Then
                expect(battleInstance.dice).toHaveBeenCalled();
                expect(battleInstance.dice.calls.count()).toEqual(1);
                expect(wonby).toEqual("attacker");
            }
        });
    });
    describe("dice method", function(){
        it("should return numbers 1 to 6", function(){
            //Given
            var battleInstance = new battle();

            for(var i=0;i<100; i++){
                //When
                var result = battleInstance.dice();

                //Then
                expect(result).toBeLessThan(101);
                expect(result).toBeGreaterThan(0);
            }
        });
    });
    describe("should apply modifiers", function(){
        it("should apply moddifier for defender", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender, [], [{percentage: 25, reason: "test"}]);
            spyOn(battleInstance, "dice").and.returnValue(55);

            //When
            var wonby = battleInstance.round();

            //Then
            expect(battleInstance.dice).toHaveBeenCalled();
            expect(battleInstance.dice.calls.count()).toEqual(1);
            expect(wonby).toEqual("defender");
            expect(Math.round(battleInstance.defenderTreshold)).toEqual(56);
        });
        it("should apply all moddifiers", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender, [], [{percentage: 25, reason: "test"},{percentage: 25, reason: "test"}]);
            spyOn(battleInstance, "dice").and.returnValue(60);

            //When
            var wonby = battleInstance.round();

            //Then
            expect(battleInstance.dice).toHaveBeenCalled();
            expect(battleInstance.dice.calls.count()).toEqual(1);
            expect(wonby).toEqual("defender");
            expect(Math.round(battleInstance.defenderTreshold)).toEqual(61);
        });
        it("should apply moddifier for attacker", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender, [{percentage: 25, reason: "test"}], []);
            spyOn(battleInstance, "dice").and.returnValue(44);

            //When
            var wonby = battleInstance.round();

            //Then
            expect(battleInstance.dice).toHaveBeenCalled();
            expect(battleInstance.dice.calls.count()).toEqual(1);
            expect(wonby).toEqual("defender");
            expect(Math.round(battleInstance.defenderTreshold)).toEqual(44);
            
        });
        it("should apply all moddifiers", function(){
            //Given
            var attacker = {health: 3};
            var defender = {health: 3};
            var battleInstance = new battle(attacker, defender, [{percentage: 25, reason: "test"}],[{percentage: 25, reason: "test"}]);
            spyOn(battleInstance, "dice").and.returnValue(50);

            //When
            var wonby = battleInstance.round();

            //Then
            expect(battleInstance.defenderTreshold).toEqual(50);
        });
    });
});