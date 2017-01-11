"use strict";
const net = require("net");
const winston = require("winston");
const mavlink = require("../mavlink/mavlink_ardupilotmega_v1.0/mavlink");
let log = new winston.Logger({ level: 'debug', transports: [new winston.transports.Console()] });
(function (Status) {
    Status[Status["DISCONNECTED"] = 0] = "DISCONNECTED";
    Status[Status["CONNECTED"] = 1] = "CONNECTED";
    Status[Status["STANDBY"] = 2] = "STANDBY";
    Status[Status["ACTIVE"] = 3] = "ACTIVE";
})(exports.Status || (exports.Status = {}));
var Status = exports.Status;
class Mav {
    constructor(port, host) {
        this.status = Status.DISCONNECTED;
        this.mavlinkParser = new mavlink.MAVLink(winston, 254, 0);
        this.connect = () => {
            let self = this;
            // Connect to the mav if not connected.
            if (self.status <= Status.DISCONNECTED) {
                log.debug(`connecting to mav @ ${self.host}:${self.port}...`);
                // On connection...
                self.socket = net.createConnection(self.port, self.host, function () {
                    self.setStatus(Status.CONNECTED);
                });
                // On error...
                self.socket.on('error', function (err) {
                    log.error('mav connection error', err);
                });
                // On data...
                self.socket.on('data', function (data) {
                    self.mavlinkParser.parseBuffer(data);
                });
            }
        };
        this.setStatus = (status) => {
            if (status != this.status) {
                this.status = status;
                log.debug('mav status', Status[this.status], (this.status == Status.STANDBY) ? '(ready to fly)' : "");
            }
        };
        this.listen = () => {
            let self = this;
            self.mavlinkParser.on('HEARTBEAT', function (message) {
                self.onHeartbeat(message);
            });
        };
        this.host = host;
        this.port = port;
        this.listen();
    }
    onHeartbeat(message) {
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
    }
}
exports.Mav = Mav;
new Mav(5760, '127.0.0.1').connect();
//# sourceMappingURL=Mav.js.map