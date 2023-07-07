'use strict';

require('config');

let roomMemoryInit = function() {
    if (!Memory.rooms || config.debugMode) {
        Memory.rooms = {};
    }
    for (const roomName in Game.rooms){
        let room = Game.rooms[roomName];
        if (!room) {continue;}
        if (!Memory.rooms[roomName]) {
            Memory.rooms[roomName] = {}
        }
        room.initMemory();
    }
}

module.exports.prepareMemory = function() {
    roomMemoryInit();
}

