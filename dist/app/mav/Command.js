"use strict";
const mavlink = require("../../mavlink/mavlink_ardupilotmega_v1.0/mavlink");
const Log_1 = require("../Log");
class Command {
    constructor(message, socket) {
        this.message = message;
        this.mavlink = new mavlink.MAVLink(Log_1.log, 254, 0);
        this.socket = socket;
    }
    send(onComplete, onError) {
        this.socket.write(new Buffer(this.message.pack(this.mavlink)));
        this.sentAt = new Date();
        this.onComplete = onComplete;
        this.onError = onError;
    }
    acknowledge(acknowledgement) {
        // Naive, but recommended. Apparently fixed in MAVLink 2.0 with message uuids. 
        return acknowledgement.name == 'COMMAND_ACK' && acknowledgement.command == this.message.id;
    }
    didTimeout() {
        return new Date().getTime() - this.sentAt.getTime() >= Command.TIMEOUT_MS;
    }
    error(error) {
        if (this.onError) {
            this.onError(error);
        }
    }
    complete() {
        if (this.onComplete) {
            this.onComplete();
        }
    }
}
// Command timeout (tested during heartbeat.)
Command.TIMEOUT_MS = 5000;
exports.Command = Command;
//# sourceMappingURL=Command.js.map