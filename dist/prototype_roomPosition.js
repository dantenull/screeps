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
    if (!opts.ignoreBorder && this.isBorder()) {
        return false;
    }
    if (!opts.ignoreWall && this.checkForWall()) {
        return false;
    }
    return true;
}

/**
 * 返回四周的位置
 */
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

/**
 * 返回周围符合条件的空地
 * @param  {...any} args 
 */
RoomPosition.prototype.findNearPosition = function* (...args) {
    for (const pos of this.getAllAdjacentPositions()){
        if (!pos.vaildPosition(...args)){continue;}
        yield pos;
    }
}

/**
 * 
 * @param  {...any} args 
 * @returns 周围最好的一个位置。标准为这些点周围符合条件的空地的数量。
 */
RoomPosition.prototype.getBestNearPosition = function(...args) {
    return _.max(Array.from(this.findNearPosition(...args)), (pos) => Array.from(pos.findNearPosition(...args)).length);
};

/**
 * 
 * @param  {...any} args 
 * @returns 周围最差的一个位置。标准为这些点周围符合条件的空地的数量。
 */
RoomPosition.prototype.getWorseNearPosition = function(...args) {
    return _.max(Array.from(this.findNearPosition(...args)), (pos) => -1 * Array.from(pos.findNearPosition(...args)).length);
};

/**
 * 
 * @param {*} position 
 * @returns 与某一点的位置
 */
RoomPosition.prototype.getDistanceToPosition = function(position){
    return (this.x - position.x) * (this.x - position.x) + (this.y - position.y) * (this.y - position.y);
};

/**
 * 按照与positions中的位置的距离进行排序，默认从小到大
 * @param {array} positions 
 * @param {bool} reverse 
 * @returns 
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

/**
 * 判断是否在positions中
 * @param {array} positions 
 * @returns 
 */
RoomPosition.prototype.isInPositions = function(positions) {
    for (const pos of positions){
        if (this.isEqualTo(pos.x, pos.y)){return true;}
    }
    return false;
}
