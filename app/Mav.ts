import * as net from "net";
import * as winston from "winston"
import * as mavlink from "../mavlink/mavlink_ardupilotmega_v1.0/mavlink";

let log = new winston.Logger({ level: 'debug', transports: [new winston.transports.Console()] });

export enum Status {
    DISCONNECTED,
    CONNECTED,
    STANDBY,
    ACTIVE
}

export class Mav {    

    status: Status = Status.DISCONNECTED;
    socket: net.Socket;
    host: string;
    port: number;
    mavlinkParser = new mavlink.MAVLink(winston, 254, 0);

    constructor(port: number, host: string) {
        this.host = host;
        this.port = port;
        this.listen();        
    }


    public connect = () => {
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
                log.error('mav connection error', err)
            });

            // On data...
            self.socket.on('data', function (data) {
                self.mavlinkParser.parseBuffer(data);
            });
        }
    }

    private setStatus = (status: Status) => {
        if (status != this.status) {
            this.status = status;
            log.debug('mav status', Status[this.status], (this.status == Status.STANDBY) ? '(ready to fly)' : "");
        }
    }

    private listen = () => {
        let self = this;
        self.mavlinkParser.on('HEARTBEAT', function (message) {
            self.onHeartbeat(message);
        });
    }

    private onHeartbeat(message: any) {
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

new Mav(5760, '127.0.0.1').connect();