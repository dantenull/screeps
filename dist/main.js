'use strict';

require('prototype_creep');
require('prototype_roomPosition');
require('prototype_room');
const {execute} = require('./brain_main');

module.exports.loop = function () {
    execute();
};