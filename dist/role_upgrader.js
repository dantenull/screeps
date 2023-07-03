'use strict';

const role_upgrader = {
    can_run: function(creep){
        return creep.room.controller.level < 8;
    },

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.store.getUsedCapacity() === 0)
            creep.memory.upgrade = false;

        if (creep.store.getFreeCapacity() === 0)
            creep.memory.upgrade = true;

        const spawn = Game.spawns['Spawn1'];
        if (!creep.memory.upgrade){
            let source = spawn.room.find(FIND_SOURCES);
            source = source[0];
            const r = creep.harvest(source);
            if(r === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                return true;
            }
            else return r === 0;
        }
        else{
            const r = creep.upgradeController(spawn.room.controller);
            if(r === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                return true;
            }
            else return r === 0;
        }
	}
};

module.exports = role_upgrader;