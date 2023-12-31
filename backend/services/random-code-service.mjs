const POOL = "ABCDEFHIJKLMNOPQRSTUVWXYZabcdefghijklmopnqrstuvwxyz0123456789";
const POOL_LENGTH = POOL.length;

export function generateCode(n){
    const r = [];
    for(var i=0; i<n; i++){
        const c = Math.floor(POOL_LENGTH*Math.random());
        r.push(POOL[c]);
    }
    return r.join('');
}