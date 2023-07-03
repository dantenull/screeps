'use strict';

require('config');

const role = {
    run: function(creep){
        // 运行creep对应角色的动作
        let role_name = '';
        let role = null;

        role_name = creep.memory.role_name;
        role = require('role_' + role_name);
        if (role.can_run(creep)){
            if (role.run(creep)){
                return;
            }
        }
    }
};

module.exports = role;
