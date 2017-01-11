"use strict";
const Mav_1 = require("./Mav");
const Log_1 = require("./Log");
let mav = new Mav_1.Mav(5760, '127.0.0.1');
mav.connect();
mav.on('status', (status) => {
    if (status == Mav_1.Status.STANDBY) {
        Log_1.log.debug('ready to fly');
        mav.setGuided(function () {
            Log_1.log.debug('successfully set guided mode');
        }, function (err) {
            Log_1.log.error(`failed to set guided mode ${err}`);
        });
    }
});
//# sourceMappingURL=Test.js.map