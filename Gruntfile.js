module.exports = function(grunt) {
    let account;
    try {
        account = require('./account.screeps.com'); 
    } catch (e) {
        account = {
            email: false,
            token: false,
        };
    }

    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: account.email,
                token: account.token,
                branch: 'default',
            },
            dist: {
                src: ['dist/*.js']
            }
        }
    });
}