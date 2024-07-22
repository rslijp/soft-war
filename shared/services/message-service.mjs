let REGISTER_HANDLE = 0;

export default {
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
                console.log("retaining", name, r.retain);
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
    sendDebounced: function (name, argument){
        var name = arguments[0];
        if (this.verbose) {
            console.log("Send debounced " + name);
        }
        setTimeout(()=>{
            this.send.apply(this, arguments);
        },0)
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