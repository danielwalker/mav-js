var mavlink = require('./mavlink');
var net = require('net');

let mavlinkParser = new MAVLink(null, 1, 50);
let connection = net.createConnection(5760, '192.168.1.215');

connection.on('data', function(data) {    
    mavlinkParser.parseBuffer(data);
});

mavlinkParser.on('HEARTBEAT', function(message) {    
    console.log(message);
});

