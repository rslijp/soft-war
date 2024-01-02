export default {
    verbose: false,
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
        var name = _.first(arguments);
        if (this.locked) {
            if (this.verbose) {
                console.log("Dropping " + name);
            }
            return;
        }
        this.send.apply(this, arguments);
    },
    send: function() {
        var name = _.first(arguments);
        var callArguments = _.rest(arguments);
        if (this.verbose) {
            console.log("Send " + name);
        }
        if (!this.registrations[name]) {
            return;
        }
        _.each(this.registrations[name], function(registration) {
            registration.callback.apply(registration.context, callArguments);
        });
    }
};