'use strict';

require('config');

const role_harvester = {
    can_run: function(creep){
        const structures =  creep.room.find(FIND_MY_STRUCTURES,{
            filter: (structure) => {
                return (structure.structureType == 'spawn') &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        return structures.length !== 0;
    },

    run: function(creep) {
        if (creep.store.getUsedCapacity() === 0)
            creep.memory.harvest = true;

        if (creep.store.getFreeCapacity() === 0)
            creep.memory.harvest = false;

        const spawn = Game.spawns['Spawn1'];
	    if(creep.memory.harvest) {
            let source = spawn.room.find(FIND_SOURCES);
            source = source[0];
            const r = creep.harvest(source);
            if(r === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                return true;
            }
            else if (r === ERR_INVALID_TARGET){
                const r = creep.withdraw(source, RESOURCE_ENERGY);
                if(r === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    return true;
                }
            }
            else return r === 0;
        }
        else {
            const r = creep.transfer(spawn, RESOURCE_ENERGY);
            if(r === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffffff'}});
                return true;
            }
            else return r === 0;
        }
	}
};

module.exports = role_harvester;