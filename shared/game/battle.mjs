export function battle (attacker, defender, attackerBonus, defenderBonus) {
    function calculateRate(modifiers) {
        var rate = 100;
        if (modifiers) {
            modifiers.forEach((modifier) => {
                var effect = 1 + (modifier.percentage / 100);
                rate *= effect;
            });
        }
        return rate;
    }
    this.init = function() {
        var attackerRate = calculateRate(attackerBonus);
        var defenderRate = calculateRate(defenderBonus);
        var totalRate = attackerRate + defenderRate;
        this.defenderTreshold = defenderRate * 100 / totalRate;
    };
    this.dice = function() {
        return Math.ceil(Math.random() * 100);
    };
    this.round = function() {
        if (this.dice() > this.defenderTreshold) {
            return "attacker";
        } else {
            return "defender";
        }
    };
    this.fight = function() {
        var results = {
            rounds: [],
            attackerDamage: 0,
            defenderDamage: 0,
            attackerBonus: attackerBonus,
            defenderBonus: defenderBonus
        };
        while (attacker.health > 0 && defender.health > 0) {
            var result = this.round();
            if (result === "attacker") {
                defender.health -= 1;
                results.defenderDamage += 1;
            } else {
                attacker.health -= 1;
                results.attackerDamage += 1;
            }
            results.rounds.push(result);
        }
        return results;
    };
    this.init();
};