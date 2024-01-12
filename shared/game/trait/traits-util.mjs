export function applyTraitsOn(source, target, overridable) {
    Object.keys(source).forEach((trait) => {
        if (target[trait] && !new Set(overridable || []).has(trait)) {
            console.log("WARNING overwriting trait", trait);
        }
        target[trait] = source[trait];
    });
}