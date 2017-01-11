import * as net from "net";
import * as mavlink from "../../mavlink/mavlink_ardupilotmega_v1.0/mavlink";
import { log } from "../Log"

export class Command {

    // Command timeout (tested during heartbeat.)
    static TIMEOUT_MS: number = 5000;

    message: any;
    socket: net.Socket;
    sentAt: Date;
    mavlink: any;
    command: Command;

    // Handlers that are triggered on acknowledgement
    onComplete: () => void;
    onError: (error: string) => void;

    constructor(message: any, socket: net.Socket) {
        this.message = message;
        this.mavlink = new mavlink.MAVLink(log, 254, 0);
        this.socket = socket;
    }

    public send(onComplete?: () => void, onError?: (error: string) => void) {
        this.socket.write(new Buffer(this.message.pack(this.mavlink)));
        this.sentAt = new Date();
        this.onComplete = onComplete;
        this.onError = onError;
    }

    public acknowledge(acknowledgement: any): boolean {

        // Naive, but recommended. Apparently fixed in MAVLink 2.0 with message uuids. 
        return acknowledgement.name == 'COMMAND_ACK' && acknowledgement.command == this.message.id;
    }

    public didTimeout(): boolean {
        return new Date().getTime() - this.sentAt.getTime() >= Command.TIMEOUT_MS;
    }

    public error(error: string) {
        if (this.onError) {
            this.onError(error);
        }
    }

    public complete() {
        if (this.onComplete) {
            this.onComplete();
        }
    }
}