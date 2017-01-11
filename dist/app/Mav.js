"use strict";
const net = require("net");
const Log_1 = require("./Log");
const events = require("events");
const mavlink = require("../mavlink/mavlink_ardupilotmega_v1.0/mavlink");
class Mav extends events.EventEmitter {
    constructor(port, host) {
        super();
        this.status = Status.DISCONNECTED;
        this.mavlink = new mavlink.MAVLink(Log_1.log, 254, 0);
        this.connect = () => {
            let self = this;
            // Connect to the mav if not connected.
            if (self.status <= Status.DISCONNECTED) {
                Log_1.log.debug(`connecting to mav @ ${self.host}:${self.port}...`);
                // On connection...
                self.socket = net.createConnection(self.port, self.host, function () {
                    self.setStatus(Status.CONNECTED);
                });
                // On error...
                self.socket.on('error', function (err) {
                    Log_1.log.error('mav connection error', err);
                });
                // On data...
                self.socket.on('data', function (data) {
                    self.mavlink.parseBuffer(data);
                });
            }
        };
        this.setGuided = (onComplete, onError) => {
            if (!this.command) {
                this.command = new Command(new mavlink.messages.set_mode(1, mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED, 4), this.socket);
                this.command.send(onComplete, onError);
            }
        };
        this.onHeartbeat = (message) => {
            // Direct status changes.
            switch (message.system_status) {
                case mavlink.MAV_STATE_STANDBY:
                    this.setStatus(Status.STANDBY);
                    break;
                case mavlink.MAV_STATE_ACTIVE:
                    this.setStatus(Status.ACTIVE);
                    break;
                default:
                    break;
            }
            // Handle command timeouts.
            if (this.command && this.command.didTimeout()) {
                let command = this.command;
                this.command = null;
                this.command.error('command timed out');
            }
        };
        this.onAcknowledge = (message) => {
            if (this.command) {
                // Are we Acknowleding the current command?
                if (this.command.acknowledge(message)) {
                    // Clear the current command.
                    let command = this.command;
                    this.command = null;
                    // Did the command pass or fail?
                    if (message.result == 0) {
                        command.complete();
                    }
                    else {
                        command.error(`command failed with a return code of ${message.result}`);
                    }
                }
            }
        };
        this.host = host;
        this.port = port;
        this.listen();
    }
    setStatus(status) {
        if (status != this.status) {
            this.status = status;
            Log_1.log.debug('mav status', Status[this.status]);
            this.emit('status', status);
        }
    }
    listen() {
        let self = this;
        self.mavlink.on('HEARTBEAT', self.onHeartbeat);
        self.mavlink.on('COMMAND_ACK', self.onAcknowledge);
    }
}
exports.Mav = Mav;
(function (Status) {
    Status[Status["DISCONNECTED"] = 0] = "DISCONNECTED";
    Status[Status["CONNECTED"] = 1] = "CONNECTED";
    Status[Status["STANDBY"] = 2] = "STANDBY";
    Status[Status["ACTIVE"] = 3] = "ACTIVE";
})(exports.Status || (exports.Status = {}));
var Status = exports.Status;
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
Command.TIMEOUT_MS = 5000;
``;
//# sourceMappingURL=Mav.js.map