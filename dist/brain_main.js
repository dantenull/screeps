'use strict';

const {prepareMemory} = require('./brain_memory');
const role = require('role');

module.exports.execute = function() {
    prepareMemory();
    for (const roomName in Game.rooms){
        let room = Game.rooms[roomName];
        if (!room) {continue;}
        room.execute();
    }
    // 
    for(const s in Game.spawns){
        const spawn = Game.spawns[s];

        // 暂时生成一个采集资源和一个升级控制器的creep，防止控制器降级
        const harvesters = spawn.room.find(FIND_MY_CREEPS, { filter: 
            (o) =>  {
                return o.memory.role_name === 'harvester';
            }});
        if (harvesters.length < 1) {
            spawn.spawnCreep([WORK, CARRY, CARRY, MOVE, MOVE], 'harvester0', {memory: {'role_name': 'harvester'}})
        }else{
            const upgraders = spawn.room.find(FIND_MY_CREEPS, { filter: 
                (o) =>  {
                    return o.memory.role_name === 'upgrader';
                }});
            if (upgraders.length < 1) {
                spawn.spawnCreep([WORK, CARRY, CARRY, MOVE, MOVE], 'upgrader0', {memory: {'role_name': 'upgrader'}})
            }
        }

        const creeps = spawn.room.find(FIND_MY_CREEPS);
        for(const name in creeps) {
            const creep = creeps[name];
            if (creep){
                role.run(creep);
            }
        }
    }
    
}


