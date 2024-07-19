export const unitTypes = {
    "I": {
        name: "Infantry",
        health: 1,
        html: "I",
        moves: 1,
        sight: 2,
        allowed: ["L", "M"],
        costs: 3,
        groundForce: true,
        modifiers: [
            {reason: "High ground", percentage: 50, applicable: function(self, opponent, ground) {
                    return ground == "mountain";
                }},
            {reason: "Bunker", percentage: 50, applicable: function(self, opponent, ground) {
                    return ground == "city";
                }},
            {reason: "Fortified", percentage: 25, applicable: function(self) {
                    return self.fortified;
                }}
        ],
        mixin: {
            fortified: false,
            canFortify: function() {
                return this.canMove() && !this.fortified && !(this.inside && this.inside.type!='C');
            },
            canActivate: function() {
                return this.fortified;
            },
            fortify: function() {
                if (!this.canFortify()) {
                    throw "Unit can't fortify in this turn";
                }
                this.movesLeft = 0;
                this.sight += 1;
                this.fortified = true;
            },
            activate: function() {
                if (!this.canActivate()) {
                    throw "Unit can't activate in this turn";
                }
                this.sight -= 1;
                this.fortified = false;
            },
            specialAction: function() {
                if (this.fortified) {
                    return {label: "Activate", method: "activate", enabled: this.canActivate(), value: true};
                }
                else {
                    return {label: "Fortify", method: "fortify",enabled: this.canFortify(), value: false};
                }
            },
            remark: function() {
                if (this.fortified) {
                    return "fortified";
                }
                else {
                    return this.innerRemark();
                }
            },
            specialInit: function() {
                if (this.fortified) {
                    this.movesLeft = 0;
                }
            }
        }
    },
    "T": {
        name: "Tank",
        health: 2,
        html: "T",
        moves: 2,
        sight: 3,
        allowed: ["L"],
        costs: 5,
        groundForce: true,
        modifiers: [
            {reason: "Cover", percentage: 40, applicable: function(self, opponent, ground) {
                    return ground == "city";
                }}
        ],
        mixin: {
            fortified: false,
            canFortify: function() {
                return this.canMove() && !this.fortified && !(this.inside && this.inside.type!='C');
            },
            canActivate: function() {
                return this.fortified;
            },
            fortify: function() {
                if (!this.canFortify()) {
                    throw "Unit can't fortify in this turn";
                }
                this.movesLeft = 0;
                this.sight += 1;
                this.fortified = true;
            },
            activate: function() {
                if (!this.canActivate()) {
                    throw "Unit can't activate in this turn";
                }
                this.sight -= 1;
                this.fortified = false;
            },
            specialAction: function() {
                if (this.fortified) {
                    return {label: "Activate", method: "activate", enabled: this.canActivate(), value: true};
                }
                else {
                    return {label: "Fortify", method: "fortify",enabled: this.canFortify(), value: false};
                }
            },
            remark: function() {
                if (this.fortified) {
                    return "fortified";
                }
                else {
                    return this.innerRemark();
                }
            },
            specialInit: function() {
                if (this.fortified) {
                    this.movesLeft = 0;
                }
            }
        }

    },
    "M": {
        name: "Truck",
        health: 1,
        html: "M",
        moves: 3,
        sight: 3,
        allowed: ["L"],
        capacity: 2,
        canLoadUnits: ["I"],
        costs: 5,
        groundAttackForces: false,
        modifiers: [
            {reason: "Cover", percentage: 40, applicable: function(self, opponent, ground) {
                    return ground == "city";
                }}
        ]
    },
    "F": {
        name: "Fighter",
        html: "F",
        health: 2,
        moves: 8,
        sight: 4,
        fuel: 16,
        allowed: ["L","M","S"],
        costs: 8,
        groundAttackForces: false,
        modifiers: [
            {reason: "Air attack", percentage: 25, applicable: function(self, opponent) {
                    return ["I","T","M"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Submerged target", percentage: 66, applicable: function(self, opponent) {
                    return opponent.submerged;
                }}
        ]
    },
    "H": {
        name: "Helicopter",
        health: 2,
        html: "H",
        moves: 5,
        fuel: 20,
        sight: 4,
        allowed: ["L","M","S"],
        capacity: 1,
        canLoadUnits: ["I", "T"],
        costs: 10,
        groundAttackForces: false,
        modifiers: [
            {reason: "Slow transport", percentage: -25, applicable:(self) => {
                    return self.nestedUnits.length>0;
                }}
        ]
    },
    "B": {
        name: "Bomber",
        html: "B",
        health: 4,
        moves: 6,
        sight: 4,
        fuel: 24,
        allowed: ["L","M","S"],
        costs: 12,
        groundAttackForces: false,
        modifiers: [
            {reason: "Air attack", percentage: 50, applicable: function(self, opponent) {
                    return ["I","T","M"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Submerged target", percentage: 66, applicable: function(self, opponent) {
                    return opponent.submerged;
                }}

        ]
    },
    "D": {
        name: "Destroyer",
        html: "D",
        health: 3,
        moves: 3,
        sight: 3,
        allowed: ["S"],
        costs: 12,
        groundAttackForces: false
    },
    "S": {
        name: "Submarine",
        html: "S",
        health: 2,
        moves: 2,
        sight: 3,
        allowed: ["S"],
        costs: 12,
        groundAttackForces: false,
        modifiers: [
            {reason: "Submerged", percentage: 66, applicable: function(self, opponent) {
                    return ["D","S","t","c","A","b"].indexOf(opponent.type) >= 0 && self.submerged;
                }}
        ],
        mixin: {
            submerged: false,
            canDive: function() {
                return this.canMove() && !this.submerged;
            },
            canSurface: function() {
                return this.canMove() && this.submerged;
            },
            dive: function() {
                if (!this.canDive()) {
                    throw "Unit can't dive in this turn";
                }
                this.movesLeft -= 1;
                this.sight -= 1;
                this.submerged = true;
                this.stealth = true;
            },
            surface: function() {
                if (!this.canSurface()) {
                    throw "Unit can't surface in this turn";
                }
                this.movesLeft -= 1;
                this.sight += 1;
                this.submerged = false;
                this.stealth = false;
            },
            specialAction: function() {
                if (this.submerged) {
                    return {label: "Surface", method: "surface", enabled: this.canSurface(), value: true};
                }
                else {
                    return {label: "Submerge", method: "dive", enabled: this.canDive(), value: false};
                }
            },
            remark: function() {
                if (this.submerged) {
                    return "submerged";
                }
                else {
                    return this.innerRemark();
                }
            }
        }
    },
    "t": {
        name: "Transporter",
        html: "t",
        health: 3,
        moves: 3,
        sight: 2,
        allowed: ["S"],
        capacity: 6,
        canLoadUnits: ["I", "T","M"],
        costs: 12,
        groundAttackForces: false
    },
    "c": {
        name: "Cruiser",
        html: "C",
        health: 5,
        moves: 2,
        sight: 3,
        allowed: ["S"],
        costs: 18,
        groundAttackForces: false,
        modifiers: [
            {reason: "Ranged attacks", percentage: 50, applicable: function(self, opponent) {
                    return ["I","T","M"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Radar guided missles", percentage: 25, applicable: function(self, opponent) {
                    return ["F", "B"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Heavily damaged", percentage: -50, applicable: function(self) {
                    return self.health == 1;
                }}
        ],
        mixin: {
            specialInit: function() {
                if (this.health == 1) {
                    this.movesLeft = 1;
                }
            }
        }
    },
    "A": {
        name: "Aircraft carrier",
        html: "A",
        health: 6,
        moves: 3,
        sight: 3,
        allowed: ["S"],
        capacity: 8,
        canLoadUnits: ["F", "B"],
        costs: 21,
        groundAttackForces: false,
        modifiers: [
            {reason: "Radar guided missles", percentage: 33, applicable: function(self, opponent) {
                    return ["F", "B"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Heavily damaged", percentage: -50, applicable: function(self) {
                    return self.health == 1;
                }}
        ],
        mixin: {
            specialInit: function() {
                if (this.health == 1) {
                    this.movesLeft = 1;
                }
            }
        }
    },
    "b": {
        name: "Battle ship",
        html: "*",
        health: 8,
        moves: 2,
        sight: 3,
        allowed: ["S"],
        costs: 24,
        groundAttackForces: false,
        modifiers: [
            {reason: "Ranged attacks", percentage: 50, applicable: function(self, opponent) {
                    return ["I","T","M"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Radar guided missles", percentage: 33, applicable: function(self, opponent) {
                    return ["F", "B"].indexOf(opponent.type) >= 0;
                }},
            {reason: "Heavily damaged", percentage: -50, applicable: function(self) {
                    return self.health == 1;
                }}
        ],
        mixin: {
            specialInit: function() {
                if (this.health == 1) {
                    this.movesLeft = 1;
                }
            }
        }
    }
};