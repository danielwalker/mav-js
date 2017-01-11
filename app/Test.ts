import { Mav, Status } from "./Mav"
import { log } from "./Log"

let mav: Mav = new Mav(5760, '127.0.0.1');

mav.connect();

mav.on('status', (status: Status) => {
    if (status == Status.STANDBY) {
        log.debug('ready to fly');
        mav.setGuided(function() {
            log.debug('successfully set guided mode');
        }, function(err) {
            log.error(`failed to set guided mode ${err}`);
        });
    }
});