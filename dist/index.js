var mavlink = require('./mavlink/mavlink_ardupilotmega_v1.0/mavlink');
var net = require('net');
var winston = require('winston');
var _ = require('underscore');

let mavlinkParser = new MAVLink(winston,254,0);

let connection = net.createConnection(5762, '192.168.1.206', function() {
    streamAll();    
    setGuided();
    arm();
    takeOff();
});

connection.on('data', function(data) {    
    var messages = mavlinkParser.parseBuffer(data);
    _.each(messages, function(message) {
        if(message) {         
            //console.log(message.name);               
        }
    });
});

mavlinkParser.on('HEARTBEAT', function(message) {    
    console.log('RX HEARTBEAT');
});

mavlinkParser.on('COMMAND_ACK', function(message) {    
    console.log('RX ACK', message.command + ' = ' + message.result + ' (' + ( message.result == 0 ? 'OK' : 'FAILED') + ')') ;
});

mavlinkParser.on('GLOBAL_POSITION_INT', function(message) {    
    console.log('ALT (m)', message.relative_alt/1000);
});

function setGuided() {
    message = new mavlink.messages.set_mode(1, mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED, 4);                        
    buffer = new Buffer(message.pack(mavlinkParser));
    connection.write(buffer)
    console.log('Set guided mode');  
}

function takeOff() {
    message = new mavlink.messages.command_long(1, 0, mavlink.MAV_CMD_NAV_TAKEOFF, 0, /**/ 0, 0 ,0, 0, -35.363261, 149.165230, 10);                        
    buffer = new Buffer(message.pack(mavlinkParser));
    connection.write(buffer)
    console.log('Takeoff');  
}

function arm() {
    message = new mavlink.messages.command_long(1, 0, mavlink.MAV_CMD_COMPONENT_ARM_DISARM, 0, /**/ 1, 0 ,0, 0, 0, 0, 0);                        
    buffer = new Buffer(message.pack(mavlinkParser));
    connection.write(buffer)
    console.log('Armed');  
}

function streamAll() {
    message = new mavlink.messages.request_data_stream(1, 1, mavlink.MAV_DATA_STREAM_ALL, 1, 1);
    buffer = new Buffer(message.pack(mavlinkParser));
    connection.write(buffer);
}


