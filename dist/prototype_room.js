'use strict';

Room.prototype.setController = function() {
    if (this.controller) {
        let upgraderPos = undefined;
        let storagePos = undefined;
        let pathStart = undefined;
        if (!Memory.rooms[this.name].upgraderPos){
            upgraderPos = this.controller.pos.getBestNearPosition();
            Memory.rooms[this.name].upgraderPos = upgraderPos;
        }else{
            upgraderPos = Memory.rooms[this.name].upgraderPos;
        }
        if (!Memory.rooms[this.name].storagePos){
            storagePos = upgraderPos.getBestNearPosition();
            Memory.rooms[this.name].storagePos = storagePos;
        }else{
            storagePos = Memory.rooms[this.name].storagePos;
        }
        if (!Memory.rooms[this.name].pathStart){
            pathStart = storagePos.getWorseNearPosition();
            Memory.rooms[this.name].pathStart = pathStart;
        }
    }
}

Room.prototype.setExit = function() {
    let allExits = undefined;
    Memory.rooms[this.name].allExits = undefined;
    if (!Memory.rooms[this.name].allExits){
        let exits = this.getAllDirectionOneExit();
        allExits = exits[0];
        const allOtherExits = exits[1];
        Memory.rooms[this.name].allExits = allExits;
        Memory.rooms[this.name].allOtherExits = allOtherExits;
    }else{
        allExits = Memory.rooms[this.name].allExits;
    }
    const pathStart = Memory.rooms[this.name].pathStart;
    if (!Memory.rooms[this.name].toExitRoutes){
        let paths = [];
        for (const e in allExits){
            const exit = allExits[e];
            const path = this.findPath(
                new RoomPosition(pathStart.x, pathStart.y, pathStart.roomName), 
                new RoomPosition(exit.x, exit.y, exit.roomName), {
                ignoreCreeps: true, 
                costCallback: this.getCostMatrixCallback(),
            });
            paths.push(path);
        }
        Memory.rooms[this.name].toExitRoutes = paths;
    }
}

Room.prototype.setConstructionSites = function() {
    if (!Memory.rooms[this.name].constructionSites) {
        Memory.rooms[this.name].constructionSites = {};
    }
    
    // spawn

    // storage
    // const storagePos = Memory.rooms[this.name].storagePos;

    // extension

    // wall
    if (!Memory.rooms[this.name].constructionSites.wall){
        Memory.rooms[this.name].constructionSites.wall = []
    }
    Memory.rooms[this.name].constructionSites.wall.concat(Memory.rooms[this.name].allOtherExits);

    // tower

    // rampart

    // link

    // lab

    // road
    const routes = Memory.rooms[this.name].toExitRoutes;
    for (const r in routes){
        for (const i in routes[r]){
            new RoomPosition(routes[r][i].x, routes[r][i].y, this.name).createFlag('road' + r.toString() + i.toString(), COLOR_BLUE);
        }
    }
}

Room.prototype.initMemory = function() {
    this.setController();
    this.setExit();
    this.setConstructionSites();
};

Room.prototype.findMyCreeps = function() {
    return this.find(FIND_MY_CREEPS);
};

/*
在房间每个方向找一个出口位置，也返回一个包含其他出口位置的数组
*/
Room.prototype.getAllDirectionOneExit = function(position=undefined) {
    const exitDirections = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];
    let allExits = [];
    let allOtherExits = [];
    for (const d in exitDirections){
        const direction = exitDirections[d];
        const exits = this.find(direction);
        if (exits.length === 0){continue;}
        if (position) {
            let exits_sorted = position.sortPositionsDistance(exits);
            allExits.push(exits_sorted[0]);
            allOtherExits= allOtherExits.concat(exits_sorted.slice(1));
        }else{
            let index = Math.floor(exits.length / 2);
            allExits.push(exits[index])
            allOtherExits = allOtherExits.concat(exits.slice(0, index));
            if (index + 1 < exits.length) {
                allOtherExits = allOtherExits.concat(exits.slice(index + 1));
            }
        }
    }
    return [allExits, allOtherExits];
}

Room.prototype.getCostMatrixCallback = function() {
    const costMatrix = new PathFinder.CostMatrix();
    // 房间边缘
    for (let i = 0; i < 50; i++) {
        costMatrix.set(i, 0, Math.max(costMatrix.get(i, 0), 50));
        costMatrix.set(i, 49, Math.max(costMatrix.get(i, 49), 50));
        costMatrix.set(0, i, Math.max(costMatrix.get(0, i), 50));
        costMatrix.set(49, i, Math.max(costMatrix.get(49, i), 50));
    }
    // 建筑点
    for (const n in Memory.rooms[this.name].constructionSites){
        const sites = Memory.rooms[this.name].constructionSites[n];
        for (const s in sites){
            costMatrix.set(sites[s].x, sites[s].y, 0xFF);
        }
    }
    // wall的旁边
    const wallPos = this.find(FIND_STRUCTURES, {filter: function(o){ return o.structureType === STRUCTURE_WALL; }});
    for (const i in wallPos){
        // const x = wallPos[i].x;
        // const y = wallPos[i].y;
        // costMatrix.set(x, y, Math.max(costMatrix.get(x, y), 10));
        for (const pos of wallPos[i].getAllAdjacentPositions()){
            costMatrix.set(pos.x, pos.y, Math.max(costMatrix.get(pos.x, pos.y), 10));
        }
    }
    return costMatrix;
}

Room.prototype.execute = function() {
    for (const creep of this.findMyCreeps()) {
        creep.handle();
    }
}
