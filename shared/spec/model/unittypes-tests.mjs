import {unit} from "../../game/unit.mjs";

describe("unittypes class", function(){
    describe("modifiers method", function(){
        describe("Infantry modifiers", function(){
            it("should return 50% for infantry on mountain", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "mountain");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("High ground");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for infantry in city", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Bunker");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 25% for fortification", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=true;

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "land");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Fortified");
                expect(modifiers[0].percentage).toEqual(25);
            });
        });
        describe("Tank modifiers", function(){
            it("should return 40% for tank in city", function(){
                //Given
                var infantry = new unit("T", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("T", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Cover");
                expect(modifiers[0].percentage).toEqual(40);
            });
        });
        describe("MPV modifiers", function(){
            it("should return 40% for MPV in city", function(){
                //Given
                var infantry = new unit("M", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("M", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Cover");
                expect(modifiers[0].percentage).toEqual(40);
            });
        });
        describe("Helicopter modifiers", function(){
            it("should return 25% when loaded", function(){
                //Given
                var infantry = new unit("H", {x: 5, y:6});
                infantry.nestedUnits=[new unit("T", {x: 5, y:6})]

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Slow transport");
                expect(modifiers[0].percentage).toEqual(-25);
            });
        });
        describe("Figher modifiers", function(){
            it("should return 25% for Fighter against Infantry", function(){
                //Given
                var infantry = new unit("F", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Air attack");
                expect(modifiers[0].percentage).toEqual(25);
            });
            it("should return 25% for Fighter against Tank", function(){
                //Given
                var infantry = new unit("F", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("T", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Air attack");
                expect(modifiers[0].percentage).toEqual(25);
            });
            it("should return 25% for Fighter against MPV", function(){
                //Given
                var infantry = new unit("F", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("M", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Air attack");
                expect(modifiers[0].percentage).toEqual(25);
            });
            it("should return 66% for Figher against submerged submarine", function(){
                //Given
                var infantry = new unit("F", {x: 5, y:6});

                //When
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=true;
                var modifiers = infantry.modifiers(submarine, "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Submerged target");
                expect(modifiers[0].percentage).toEqual(66);
            });
        });
        describe("Bomber modifiers", function(){
            it("should return 50% for Bomber against Infantry", function(){
                //Given
                var infantry = new unit("B", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Air attack");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for Bomber against Tank", function(){
                //Given
                var infantry = new unit("B", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("T", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Air attack");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for Bomber against MPV", function(){
                //Given
                var infantry = new unit("B", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("M", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Air attack");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 66% for Bomber against submerged submarine", function(){
                //Given
                var infantry = new unit("B", {x: 5, y:6});

                //When
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=true;
                var modifiers = infantry.modifiers(submarine, "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Submerged target");
                expect(modifiers[0].percentage).toEqual(66);
            });
        });
        describe("Submarine modifiers", function(){
            it("should return 66% for submerged submarine against boats", function(){
                //Given
                var infantry = new unit("S", {x: 5, y:6});
                infantry.submerged=true;

                //When
                var boats = ["D","S","t","c","A","b"];
                    for(var i=0; i<boats.length; i++){
                    var modifiers = infantry.modifiers(new unit(boats[i], {x: 5, y:6}), "sea");

                    //Then
                    expect(modifiers.length).toEqual(1);
                    expect(modifiers[0].reason).toEqual("Submerged");
                    expect(modifiers[0].percentage).toEqual(66);
                }
            });
        });
        describe("Cruiser modifiers", function(){
            it("should return 50% for Cruiser against Infantry", function(){
                //Given
                var infantry = new unit("c", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Ranged attacks");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for Cruiser against Tank", function(){
                //Given
                var infantry = new unit("c", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("T", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Ranged attacks");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for Cruiser against MPV", function(){
                //Given
                var infantry = new unit("c", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("M", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Ranged attacks");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 25% for Cruiser against Fighter", function(){
                //Given
                var infantry = new unit("c", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("F", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Radar guided missles");
                expect(modifiers[0].percentage).toEqual(25);
            });
            it("should return 25% for Cruiser against Bomber", function(){
                //Given
                var infantry = new unit("c", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("B", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Radar guided missles");
                expect(modifiers[0].percentage).toEqual(25);
            });
            it("should return -50% when heaviliy damaged", function(){
                //Given
                var infantry = new unit("c", {x: 5, y:6});
                infantry.health=1;
                //When
                var modifiers = infantry.modifiers(new unit("c", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Heavily damaged");
                expect(modifiers[0].percentage).toEqual(-50);
            });
        });
        describe("Battleship modifiers", function(){
            it("should return 50% for Battleship against Infantry", function(){
                //Given
                var infantry = new unit("b", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("I", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Ranged attacks");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for Battleship against Tank", function(){
                //Given
                var infantry = new unit("b", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("T", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Ranged attacks");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 50% for Battleship against MPV", function(){
                //Given
                var infantry = new unit("b", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("M", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Ranged attacks");
                expect(modifiers[0].percentage).toEqual(50);
            });
            it("should return 33% for Battleship against Fighter", function(){
                //Given
                var infantry = new unit("b", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("F", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Radar guided missles");
                expect(modifiers[0].percentage).toEqual(33);
            });
            it("should return 33% for Battleship against Bomber", function(){
                //Given
                var infantry = new unit("b", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("B", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Radar guided missles");
                expect(modifiers[0].percentage).toEqual(33);
            });
            it("should return -50% when heavily damaged", function(){
                //Given
                var infantry = new unit("b", {x: 5, y:6});
                infantry.health=1;
                //When
                var modifiers = infantry.modifiers(new unit("c", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Heavily damaged");
                expect(modifiers[0].percentage).toEqual(-50);
            });
        });
        describe("Aircraft carrier modifiers", function(){
            it("should return 33% for Aircraft Carrier against Fighter", function(){
                //Given
                var infantry = new unit("A", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("F", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Radar guided missles");
                expect(modifiers[0].percentage).toEqual(33);
            });
            it("should return 33% for Aircraft Carrier against Bomber", function(){
                //Given
                var infantry = new unit("A", {x: 5, y:6});

                //When
                var modifiers = infantry.modifiers(new unit("B", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Radar guided missles");
                expect(modifiers[0].percentage).toEqual(33);
            });
            it("should return -50% when heavily damaged", function(){
                //Given
                var infantry = new unit("A", {x: 5, y:6});
                infantry.health=1;
                //When
                var modifiers = infantry.modifiers(new unit("c", {x: 5, y:6}), "city");

                //Then
                expect(modifiers.length).toEqual(1);
                expect(modifiers[0].reason).toEqual("Heavily damaged");
                expect(modifiers[0].percentage).toEqual(-50);
            });
        });
    });
    describe("submarine type", function(){
        it("should add dive and submerge method", function(){
                //Given
                var other = new unit("A", {x: 5, y:6});
                expect(other["dive"]).toBeUndefined();
                expect(other["surface"]).toBeUndefined();

                //When
                var submarine = new unit("S", {x: 5, y:6});

                //Then
                expect(submarine["dive"]).toBeDefined();
                expect(submarine["surface"]).toBeDefined();
        });
        it("should not have a default of submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6});

            //When
            var result = submarine.submerged;

            //Then
            expect(result).toEqual(false);
        });
        it("should allow unit to submerge when not submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=false;
            //When
            var result = submarine.specialAction();

            //Then
            expect(result).toEqual({label: "Submerge", method: "dive", enabled: true, value: false});
        });
        it("should allow unit to surface when submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=true;
            //When
            var result = submarine.specialAction();

            //Then
            expect(result).toEqual({label: "Surface", method: "surface", enabled: true, value: true});
        });
        it("should disable submerge when can't submerge", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=false;
            spyOn(submarine, "canDive").and.returnValue(false);
            //When
            var result = submarine.specialAction();

            //Then
            expect(result).toEqual({label: "Submerge", method: "dive", enabled: false, value: false});
        });
        it("should allow unit to surface when submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=true;
            spyOn(submarine, "canSurface").and.returnValue(false);

            //When
            var result = submarine.specialAction();

            //Then
            expect(result).toEqual({label: "Surface", method: "surface", enabled: false, value: true});
        });
        it("should allow to surface a submerged unit", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=true;
            //When
            submarine.surface();

            //Then
            expect(submarine.submerged).toEqual(false);
        });
        it("should allow to submerge a surfaced unit", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=false;
            //When
            submarine.dive();

            //Then
            expect(submarine.submerged).toEqual(true);
        });
        it("should add submerged remark to position when unit is submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.submerged=false;
            expect(submarine.remark()).toBeUndefined();

            //When
            submarine.dive();


            //Then
            expect(submarine.remark()).toEqual("submerged");
        });
        it("should not submerge when unit is out of moves", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.movesLeft=0;

            //When
            try {
                submarine.dive();
                expect(true).toBeFalsy();
            } catch(e){
                //Then
                expect(e).toEqual("Unit can't dive in this turn");
            }
        });
        it("should not surface when unit is out of moves", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            submarine.movesLeft=0;

            //When
            try {
                submarine.surface();
                expect(true).toBeFalsy();
            } catch(e){
                //Then
                expect(e).toEqual("Unit can't surface in this turn");
            }
        });
        it("should reduce sight when submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            var sight = submarine.sight;
            //When
            submarine.dive();

            //Then
            expect(submarine.sight).toEqual(sight-1);
        });
        it("should reduce sight when submerged", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            var sight = submarine.sight;
            submarine.dive();

            //When
            submarine.surface();

            //Then
            expect(submarine.sight).toEqual(sight);
        });
        it("should cost one movement point to submerge a unit", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            var oldMoves = submarine.movesLeft;
            submarine.submerged=false;

            //When
            submarine.dive();

            //Then
            expect(submarine.movesLeft).toEqual(oldMoves-1);
        });
        it("should cost one movement point to surface a unit", function(){
            //Given
            var submarine = new unit("S", {x: 5, y:6}).initTurn();
            var oldMoves = submarine.movesLeft;
            submarine.submerged=true;

            //When
            submarine.surface();

            //Then
            expect(submarine.movesLeft).toEqual(oldMoves-1);
        });
        describe("canDive", function(){
            it("should be true when the unit can move and isn't submerged already", function(){
                //Given
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=false;
                spyOn(submarine, "canMove").and.returnValue(true);

                //When
                var result = submarine.canDive()

                //Then
                expect(result).toBeTruthy();
            });
            it("should be false when the unit can't move and isn't submerged", function(){
                //Given
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=false;
                spyOn(submarine, "canMove").and.returnValue(false);

                //When
                var result = submarine.canDive()

                //Then
                expect(result).toBeFalsy();
            });
            it("should be false when the unit can move but is submerged already", function(){
                //Given
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=true;
                spyOn(submarine, "canMove").and.returnValue(true);

                //When
                var result = submarine.canDive()

                //Then
                expect(result).toBeFalsy();
            });
        });
        describe("canSurface", function(){
            it("should be true when the unit can move and isn't surfaced already", function(){
                //Given
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=true;
                spyOn(submarine, "canMove").and.returnValue(true);

                //When
                var result = submarine.canSurface()

                //Then
                expect(result).toBeTruthy();
            });
            it("should be false when the unit can't move and isn't surfaced", function(){
                //Given
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=true;
                spyOn(submarine, "canMove").and.returnValue(false);

                //When
                var result = submarine.canSurface()

                //Then
                expect(result).toBeFalsy();
            });
            it("should be false when the unit can move but is surfaced already", function(){
                //Given
                var submarine = new unit("S", {x: 5, y:6});
                submarine.submerged=false;
                spyOn(submarine, "canMove").and.returnValue(true);

                //When
                var result = submarine.canSurface()

                //Then
                expect(result).toBeFalsy();
            });
        });
    });
    describe("infantry type", function(){
        it("should add fortify and breakUp method", function(){
                //Given
                var other = new unit("A", {x: 5, y:6});
                expect(other["fortify"]).toBeUndefined();
                expect(other["activate"]).toBeUndefined();

                //When
                var infantry = new unit("I", {x: 5, y:6});

                //Then
                expect(infantry["fortify"]).toBeDefined();
                expect(infantry["activate"]).toBeDefined();
        });
        it("should not have a default of fortified", function(){
            //Given
            var submarine = new unit("I", {x: 5, y:6});

            //When
            var result = submarine.fortified;

            //Then
            expect(result).toEqual(false);
        });
        it("should allow unit to fortify when not fortified", function(){
            //Given
            var infantry = new unit("I", {x: 5, y:6}).initTurn();
            infantry.fortified=false;
            //When
            var result = infantry.specialAction();

            //Then
            expect(result).toEqual({label: "Fortify", method: "fortify", enabled: true, value: false});
        });
        it("should allow unit to activate when fortified", function(){
            //Given
            var infantry = new unit("I", {x: 5, y:6});
            infantry.fortified=true;
            //When
            var result = infantry.specialAction();

            //Then
            expect(result).toEqual({label: "Activate", method: "activate", enabled: true, value: true});
        });
        describe("fortify method", function(){
            it("should not allow unit to fortify when cant fortify", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                infantry.fortified=false;
                spyOn(infantry, "canFortify").and.returnValue(false)
                //When
                var result = infantry.specialAction();

                //Then
                expect(result).toEqual({label: "Fortify", method: "fortify", enabled: false, value: false});
            });
            it("should allow unit to activate when fortified", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=true;
                spyOn(infantry, "canActivate").and.returnValue(false)

                //When
                var result = infantry.specialAction();

                //Then
                expect(result).toEqual({label: "Activate", method: "activate", enabled: false, value: true});
            });
            it("should fortify unit", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                infantry.fortified=false;

                //When
                infantry.fortify();

                //Then
                expect(infantry.fortified).toEqual(true);
            });
            it("should cost one movement point to fortify a unit", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                var oldMoves = infantry.movesLeft;
                infantry.fortified=false;

                //When
                infantry.fortify();

                //Then
                expect(infantry.movesLeft).toEqual(oldMoves-1);
            });
            it("should add fortified remark to position when unit is fortified", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                infantry.fortified=false;
                expect(infantry.remark()).toBeUndefined();

                //When
                infantry.fortify();

                //Then
                expect(infantry.remark()).toEqual("fortified");
            });
            it("should not allow fortification of unit when out of moves", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                infantry.movesLeft=0;

                //When
                try {
                    infantry.fortify();
                    expect(true).toBeFalsy();
                } catch(e){
                    //Then
                    expect(e).toEqual("Unit can't fortify in this turn");
                }
            });
            it("should not allow unit to move when fortified", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=true;

                //When
                infantry.initTurn();

                //Then
                expect(infantry.movesLeft).toEqual(0);
            });
        });
        describe("activate method", function(){
            it("should cost no movement points to activate a unit", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                var oldMoves = infantry.movesLeft;
                infantry.fortified=true;

                //When
                infantry.activate();

                //Then
                expect(infantry.movesLeft).toEqual(oldMoves);
            });
            it("should activate unit", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=true;

                //When
                infantry.activate();

                //Then
                expect(infantry.fortified).toEqual(false);
            });
            it("should not allow activation of unit when already active", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6}).initTurn();
                infantry.fortified=false;

                //When
                try {
                    infantry.activate();
                    expect(true).toBeFalsy();
                } catch(e){
                    //Then
                    expect(e).toEqual("Unit can't activate in this turn");
                }
            });
        });
        describe("canFortify", function(){
            it("should be true when the unit can move and isn't fortified already", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=false;
                spyOn(infantry, "canMove").and.returnValue(true);
                
                //When
                var result = infantry.canFortify()

                //Then
                expect(result).toBeTruthy();
            });
            it("should be false when the unit can move and isn't fortified already but is loaded", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=false;
                infantry.inside="unit"
                spyOn(infantry, "canMove").and.returnValue(true);

                //When
                var result = infantry.canFortify()

                //Then
                expect(result).toBeFalsy();
            });
            it("should be false when the unit can't move and isn't fortified", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=false;
                spyOn(infantry, "canMove").and.returnValue(false);

                //When
                var result = infantry.canFortify()

                //Then
                expect(result).toBeFalsy();
            });
            it("should be false when the unit can move but is fortified already", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=true;
                spyOn(infantry, "canMove").and.returnValue(true);

                //When
                var result = infantry.canFortify()

                //Then
                expect(result).toBeFalsy();
            });
        });
        describe("canActivate", function(){
            it("should be true when the unit is fortified", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=true;
                
                //When
                var result = infantry.canActivate();

                //Then
                expect(result).toBeTruthy();
            });
            it("should be false when the unit isn't fortified", function(){
                //Given
                var infantry = new unit("I", {x: 5, y:6});
                infantry.fortified=false;

                //When
                var result = infantry.canActivate()

                //Then
                expect(result).toBeFalsy();
            });            
        });
    });
    describe("Cruiser type", function(){
        it("should not limit movement when more than one health", function(){
            //Given
            var ship = new unit("c", {x: 5, y:6});
            ship.health = 2;

            //When
            ship.initTurn();

            //Then
            expect(ship.movesLeft).toEqual(ship.definition().moves);
        });
        it("should  limit movement when only one health left", function(){
            //Given
            var ship = new unit("c", {x: 5, y:6});
            ship.health = 1;

            //When
            ship.initTurn();

            //Then
            expect(ship.movesLeft).toEqual(1);
        });
    });
    describe("Aircraft carrier type", function(){
        it("should not limit movement when more than one health", function(){
            //Given
            var ship = new unit("A", {x: 5, y:6});
            ship.health = 2;

            //When
            ship.initTurn();

            //Then
            expect(ship.movesLeft).toEqual(ship.definition().moves);
        });
        it("should  limit movement when only one health left", function(){
            //Given
            var ship = new unit("A", {x: 5, y:6});
            ship.health = 1;

            //When
            ship.initTurn();

            //Then
            expect(ship.movesLeft).toEqual(1);
        });
    });
    describe("Battleship type", function(){
        it("should not limit movement when more than one health", function(){
            //Given
            var ship = new unit("b", {x: 5, y:6});
            ship.health = 2;

            //When
            ship.initTurn();

            //Then
            expect(ship.movesLeft).toEqual(ship.definition().moves);
        });
        it("should  limit movement when only one health left", function(){
            //Given
            var ship = new unit("b", {x: 5, y:6});
            ship.health = 1;

            //When
            ship.initTurn();

            //Then
            expect(ship.movesLeft).toEqual(1);
        });
    });
});