let REGISTER_HANDLE = 0;

// A message bus. Every game has its own (see createMessageBus); the default export below always
// points at the bus of the game that is running at that moment.
export function createMessageBus() {
    return {
        verbose: false,
        locked: false,
        registrations: {},
        clear: function(){
            if (this.verbose) {
                console.log("Clearing registrations");
            }
            const clone = [].concat(Object.keys(this.registrations));
            var retained = {};
            clone.forEach(name=>{
                this.registrations[name].filter(r=>r.retain).forEach(r => {
                        if (this.verbose) {
                            console.log("retaining", name, r.handle);
                        }
                        if (!retained[name]) {
                            retained[name] = [];
                        }
                        retained[name].push(r);
                    })
            })
            this.registrations = retained;
        },
        register: function(name, func, context, retain) {
            if (this.verbose) {
                console.log("Register " + name);
            }
            if (!this.registrations[name]) {
                this.registrations[name] = [];
            }
            REGISTER_HANDLE++;
            this.registrations[name].push({callback: func, context: context, handle: ""+REGISTER_HANDLE, retain: retain||false});
            return name+":"+REGISTER_HANDLE;
        },
        revoke: function(name, func) {
            if (this.verbose) {
                console.log("Revoking " + name);
            }
            if (!this.registrations[name]) return;
            const old = this.registrations[name];
            this.registrations[name]=this.registrations[name].filter(r=> r.callback !== func);
            if(old === this.registrations[name].length && this.verbose){
                console.log("Revoke failed of "+name+" failed");
            }
        },
        revokeByHandles: function(handles) {
            handles.forEach(handleKey => this.revokeByHandle(handleKey));
        },
        revokeByHandle: function(handleKey) {
            const [name, handle ] = handleKey.split(':');
            if(!name || !handle) throw 'Wrong format of key '+handleKey;
            if (this.verbose) {
                console.log("Revoking " + name);
            }
            if (!this.registrations[name]) return;
            const old = this.registrations[name];
            this.registrations[name]=this.registrations[name].filter(r=> r.handle !== handle);
            if(old === this.registrations[name].length && this.verbose){
                console.log("Revoke  by handle failed of "+name+" failed");
            }
        },
        lock: function() {
            if (this.locked) {
                return;
            }
            if (this.verbose) {
                console.log("Bus locked");
            }
            this.locked = true;
            this.send("bus-locked");
        },
        unlock: function() {
            if (!this.locked) {
                return;
            }
            if (this.verbose) {
                console.log("Bus unlocked");
            }
            this.locked = false;
            this.send("bus-unlocked");
        },
        sendLockable: function() {
            var name = arguments[0];
            if (this.locked) {
                if (this.verbose) {
                    console.log("Dropping " + name);
                }
                return;
            }
            this.send.apply(this, arguments);
        },
        send: function() {
            var name = arguments[0];
            var callArguments = Array.from(arguments).slice(1);
            if (this.verbose) {
                console.log("Send " + name);
            }
            if (!this.registrations[name]) {
                return;
            }
            this.registrations[name].forEach((registration, i) => {
                if (this.verbose) {
                    console.log("[",i,"] Send " + name,"handle "+registration.handle);
                }
                registration.callback.apply(registration.context, callArguments);
            });
        }
    };
}

const defaultBus = createMessageBus();
let resolveCurrentBus = () => defaultBus;

// A server running several games installs a resolver that returns the bus of the game whose code is
// running right now (for instance through AsyncLocalStorage, which also follows its timers).
// In the browser there is only one game, so the default bus is used.
export function setBusResolver(resolver) {
    resolveCurrentBus = resolver ? () => resolver() || defaultBus : () => defaultBus;
}

export function currentBus() {
    return resolveCurrentBus();
}

export default new Proxy({}, {
    get: (target, property) => Reflect.get(currentBus(), property),
    set: (target, property, value) => Reflect.set(currentBus(), property, value),
    has: (target, property) => Reflect.has(currentBus(), property),
    deleteProperty: (target, property) => Reflect.deleteProperty(currentBus(), property),
    ownKeys: () => Reflect.ownKeys(currentBus()),
    getOwnPropertyDescriptor: (target, property) => {
        const descriptor = Reflect.getOwnPropertyDescriptor(currentBus(), property);
        if (descriptor) descriptor.configurable = true;
        return descriptor;
    }
});
