'use strict';

require('config');

/**
 * upgraderPos 房间控制器周围最好的一个位置
 * storagePos 储存罐位置，upgraderPos周围最好的一个位置
 * pathStart 起始位置，storagePos周围最差的一个位置
 */
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
            pathStart.createFlag('S', COLOR_RED);
            Memory.rooms[this.name].pathStart = pathStart;
        }
    }
}

/**
 * 使路径优先斜着走，以便在路的两边放下更多的建筑
 * @param {array} path 
 */
Room.prototype.pathProcess = function(path) {
    let processPath = [];
    for(let i = 0; i < path.length; i++){
        let pos = path[i];
        if (i % 2 === 1 || i >= path.length - 2) {
            processPath.push(pos);
            continue;
        }
        const direction = pos.direction;
        // 原本是斜着走的不处理
        if ([TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT, TOP_LEFT].indexOf(direction) != -1){
            processPath.push(pos);
            continue;
        }
        let newDirections = undefined;
        if (direction === TOP){
            newDirections = [{'dx': 1, 'dy': 0, 'direction': TOP_RIGHT}, {'dx': -1, 'dy': 0, 'direction': TOP_LEFT}]
        } else if (direction === BOTTOM) {
            newDirections = [{'dx': 1, 'dy': 0, 'direction': BOTTOM_RIGHT}, {'dx': -1, 'dy': 0, 'direction': BOTTOM_LEFT}]
        } else if (direction === LEFT) {
            newDirections = [{'dx': 0, 'dy': -1, 'direction': TOP_LEFT}, {'dx': 0, 'dy': 1, 'direction': BOTTOM_LEFT}]
        } else {
            newDirections = [{'dx': 0, 'dy': -1, 'direction': TOP_RIGHT}, {'dx': 0, 'dy': 1, 'direction': BOTTOM_RIGHT}]
        }
        const nextPos = new RoomPosition(path[i + 1].x, path[i + 1].y, this.name);
        // const newPosDict = {}
        for (const d of newDirections){
            let newPos = new RoomPosition(pos.x + d.dx, pos.y + d.dy, this.name);
            if (newPos.isInPositions(Array.from(nextPos.findNearPosition()))) {
                // console.log(newPos);
                pos.x = newPos.x;
                pos.y = newPos.y;
                pos.dx = d.dx;
                pos.dy = d.dy;
                pos.direction = d.direction;
                break;
            }
        }
        processPath.push(pos);
    }
    return processPath;
}

/**
 * allExits 各个方向上的出口的最中间的位置
 * allOtherExits 除了allExits中的位置的其它出口位置
 * toExitRoutes 起始点到各个allExits中的点的路径
 */
Room.prototype.setExit = function() {
    // Memory.rooms[this.name].toExitRoutes = undefined;
    let allExits;
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
            paths.push(this.pathProcess(path));
        }
        Memory.rooms[this.name].toExitRoutes = paths;
    }
}

/**
 * 返回path中的所有的位置到指定位置position的距离的和
 * @param {array} path 
 * @param {roomPostion} position 
 * @returns 
 */
Room.prototype.PathToPositonDistance = function(path, position){
    return path.reduce((prev, cur, index, arr) => {
        const pos1 = new RoomPosition(prev.x, prev.y, this.name);
        const distance1 = position.getDistanceToPosition(pos1);
        const pos2 = new RoomPosition(cur.x, cur.y, this.name);
        const distance2 = position.getDistanceToPosition(pos2);
        return distance1 + distance2;
    })
}

/**
 * toExitRoutesMain 主要的路径
 * extensionPositions 放置母巢扩展的位置
 * 设置主要的路径的方法：
 * 1. 从之前的起始位置到各个出口的路径为基础
 * 2. 路径的长度必须大于8
 * 3. 按照离最近的资源的距离将各个路径排序
 * 4. 循环路径中的位置，获取扩展的位置，直到到达上限
 * 5. 循环中使用的路径就为主要路径
 * @returns 
 */
Room.prototype.setToExitRoutesMain = function() {
    if (Memory.rooms[this.name].extensionPositions && Memory.rooms[this.name].toExitRoutesMain){
        return;
    }
    let toExitRoutes = [];
    for (const route of Memory.rooms[this.name].toExitRoutes){
        if (route.length >= 9){
            toExitRoutes.push(route);
        }
    }
    const closestSource = this.getClosestSource();
    toExitRoutes.sort((route) => -1 * this.PathToPositonDistance(route, closestSource));
    let extensionPositions = {};
    let index = 1;  // route的数量
    for (const route of toExitRoutes){
        for(let i = 3; i < route.length - 4; i++){
            if (Object.values(extensionPositions).length >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][8]){break;}
            const pos = new RoomPosition(route[i].x, route[i].y, this.name);
            const nearPos = Array.from(pos.findNearPosition())
            for (const p of nearPos){
                if (!p.isInPositions(Memory.rooms[this.name].unbuildablePositions) 
                && !p.isInPositions([route[i - 1], route[i + 1]])){
                    const item = [p.x, p.y];
                    extensionPositions[item] = {'x': p.x, 'y': p.y};
                }
            }
        }
        index++;
        if (Object.values(extensionPositions).length >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][8]){break;}
    }
    
    Memory.rooms[this.name].extensionPositions = Object.values(extensionPositions);
    Memory.rooms[this.name].toExitRoutesMain = toExitRoutes.slice(0, index);
}

/**
 * 返回离 资源或指定建筑 与 母巢 的距离最短的一个 资源或指定建筑
 * TODO 当前使用的是固定名称为Spawn1的母巢，改成使用主母巢
 * @param {string} findStructureTyep 建筑类型
 * @returns 
 */
Room.prototype.getClosestSource = function(findStructureTyep=undefined){
    let sources;
    if (!findStructureTyep) {
        sources = this.find(FIND_SOURCES);
    }
    else {
        sources = this.find(FIND_MY_STRUCTURES, { filter: 
            (o) => {
                return o.structureType === findStructureTyep;
            }
        });
    }

    if (sources.length === 0) return undefined;
    else if(sources.length === 1) return sources[0];

    let closestSource = sources[0];
    const spawn = Game.spawns['Spawn1'];
    let distance = closestSource.pos.getDistanceToPosition(spawn.pos);
    for (let i = 1; i < sources.length; i++){
        if (distance <= sources[i].pos.getDistanceToPosition(spawn.pos)) continue;
        closestSource = sources[i];
    }
    return closestSource.pos;
}

Room.prototype.setConstructionSites = function() {
    if (!Memory.rooms[this.name].constructionSites) {
        Memory.rooms[this.name].constructionSites = {};
    }
    
    // spawn

    // storage
    // const storagePos = Memory.rooms[this.name].storagePos;

    // extension
    for (const pos of Memory.rooms[this.name].extensionPositions){
        const p = new RoomPosition(pos.x, pos.y, this.name);
        p.createFlag('ext' + p.x.toString() + p.y.toString(), COLOR_YELLOW);
    }

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
            new RoomPosition(routes[r][i].x, routes[r][i].y, this.name).createFlag('ro' + r.toString() + i.toString(), COLOR_BLUE);
        }
    }
}

Room.prototype.initMemory = function() {
    this.setController();
    this.setExit();
    this.setUnbuildablePositon();
    this.setToExitRoutesMain();
    this.setConstructionSites();
};

Room.prototype.findMyCreeps = function() {
    return this.find(FIND_MY_CREEPS);
};

/**
 * 在房间每个方向找一个出口位置，也返回一个包含其他出口位置的数组
 * @param {roomPosition} position 
 * @returns 
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

/**
 * 不能造建筑的位置
 * @returns 
 */
Room.prototype.setUnbuildablePositon = function() {
    if (Memory.rooms[this.name].unbuildablePositions){ return; }
    let unbuildablePositions = [];
    // 建筑周围：母巢 资源 矿物
    const structures = [FIND_MY_SPAWNS, FIND_SOURCES, FIND_MINERALS];
    for (const structure_name of structures){
        const structure = this.find(structure_name);
        for (const s of structure) {
            unbuildablePositions = [...Array.from(s.pos.getAllAdjacentPositions()), ...unbuildablePositions];
        }
    }
    Memory.rooms[this.name].unbuildablePositions = unbuildablePositions;
}

Room.prototype.execute = function() {
    for (const creep of this.findMyCreeps()) {
        creep.handle();
    }
}
