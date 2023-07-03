'use strict';

let roomMemoryInit = function() {
    if (!Memory.rooms) {
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

