import * as net from "net";
import * as events from "events"
import * as moment from "moment"
import * as mavlink from "../../mavlink/mavlink_ardupilotmega_v1.0/mavlink";
import { log } from "../Log"
import { Command } from "./Command"

export enum Status {
    DISCONNECTED,
    CONNECTED,
    STANDBY,
    ACTIVE
}

export class Mav extends events.EventEmitter {
    
    status: Status = Status.DISCONNECTED;
    socket: net.Socket;
    host: string;
    port: number;
    mavlink = new mavlink.MAVLink(log, 254, 0);
    command: Command;

    constructor(port: number, host: string) {
        super();
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
                self.mavlink.parseBuffer(data);
            });
        }
    }

    public setGuided = (onComplete?: () => void, onError?: (error: string) => void) => {
        if (!this.command) {
            this.command = new Command(new mavlink.messages.set_mode(1, mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED, 4), this.socket);
            this.command.send(onComplete, onError);
        }
    }

    private setStatus(status: Status) {
        if (status != this.status) {
            this.status = status;
            log.debug('mav status', Status[this.status]);
            this.emit('status', status);
        }
    }

    private listen() {
        let self = this;
        self.mavlink.on('HEARTBEAT', self.onHeartbeat);
        self.mavlink.on('COMMAND_ACK', self.onAcknowledge);
    }

    private onHeartbeat = (message: any) => {

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
    }

    private onAcknowledge = (message: any) => {
        if (this.command) {

            // Are we Acknowleding the current command?
            if (this.command.acknowledge(message)) {

                // Clear the current command.
                let command = this.command;                
                this.command = null;

                // Did the command pass or fail?
                if (message.result == 0) {
                    command.complete();
                } else {
                    command.error(`command failed with a return code of ${message.result}`);
                }
            }
        }
    }
}

