import * as winston from "winston"

let log = new winston.Logger({ level: 'debug', transports: [new winston.transports.Console()] });

export { log }
