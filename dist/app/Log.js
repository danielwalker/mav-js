"use strict";
const winston = require("winston");
let log = new winston.Logger({ level: 'debug', transports: [new winston.transports.Console()] });
exports.log = log;
//# sourceMappingURL=Log.js.map