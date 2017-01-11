import { Mav, Status } from "./mav/Mav"
import { log } from "./Log"

let mav: Mav = new Mav(5760, '127.0.0.1');

mav.connect();

mav.on('status', (status: Status) => {

    // MAV in standby (ready to launch)
    if (status == Status.STANDBY) {
        log.debug('ready to fly');

        // Set guided mode.
        mav.setGuided(function() {
            log.debug('successfully set guided mode');
        }, function(err) {
            log.error(`failed to set guided mode ${err}`);
        });
    }
});