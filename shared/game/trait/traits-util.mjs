export function applyTraitsOn(source, target){
    Object.keys(source).forEach((trait)=>{
        if(target[trait]){
            console.log("WARNING overwriting trait", trait);
        }
        target[trait]=source[trait];
    });
}