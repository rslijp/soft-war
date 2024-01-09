export default {
    verbose: true,
    locked: false,
    registrations: {},
    register: function(name, func, context) {
        if (this.verbose) {
            console.log("Register " + name);
        }
        if (!this.registrations[name]) {
            this.registrations[name] = [];
        }
        this.registrations[name].push({callback: func, context: context});
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
    }
    ,
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
                console.log("[",i,"] Send " + name);
            }
            registration.callback.apply(registration.context, callArguments);
        });
    }
};