'use strict';

RoomPosition.prototype.isBorder = function(offset) {
    offset = offset || 0;
    if (this.x <= 1 + offset || this.x >= 48 - offset || this.y <= 1 + offset || this.y >= 48 - offset) {
        return true;
    }
    return false;
};

RoomPosition.prototype.checkForWall = function() {
    return this.lookFor(LOOK_TERRAIN)[0] === 'wall';
};

RoomPosition.prototype.vaildPosition = function(opts = {}) {
    if (!opts.ignoreBorder && this.isBorder(2)) {
        return false;
    }
    if (!opts.ignoreWall && this.checkForWall()) {
        return false;
    }
    return true;
}

RoomPosition.prototype.getAllAdjacentPositions = function* (){
    const adjacentPos = [
        [0, -1],
        [1, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
    ];
    const x = this.x;
    const y = this.y;
    for(const i in adjacentPos){
        const pos = adjacentPos[i];
        yield new RoomPosition(x + pos[0], y + pos[1], this.roomName);
    }
}

RoomPosition.prototype.findNearPosition = function* (...args) {
    for (const pos of this.getAllAdjacentPositions()){
        if (!pos.vaildPosition(...args)){continue;}
        yield pos;
    }
}

RoomPosition.prototype.getBestNearPosition = function(...args) {
    return _.max(Array.from(this.findNearPosition(...args)), (pos) => Array.from(pos.findNearPosition(...args)).length);
};

RoomPosition.prototype.getWorseNearPosition = function(...args) {
    return _.max(Array.from(this.findNearPosition(...args)), (pos) => -1 * Array.from(pos.findNearPosition(...args)).length);
};

RoomPosition.prototype.getDistanceToPosition = function(position){
    return (this.x - position.x) * (this.x - position.x) + (this.y - position.y) * (this.y - position.y);
};

/*
排序数组中对象的位置与某一点的距离的排序，默认从小到大
*/
RoomPosition.prototype.sortPositionsDistance = function(positions, reverse=false) {
    let distances = [];
    let distances_map = {};
    for (const i in positions){
        const pos = positions[i];
        let distance = this.getDistanceToPosition(pos);
        distances.push(distance);
        distances_map[distance] = pos;
    }
    distances.sort(function(a, b){return a - b});
    let distances1 = [];
    for (let i = 0; i < distances.length; i++){
        distances1.push(distances_map[distances[i]]);
    }
    if (reverse) return distances1.reverse();
    else return distances1;
}

