const Socket = require("./socket");
const config = require('./config');

// File create in dir name... :) (or filename?)


config.loadConfig([
    {
        type: 'text',
        name: 'name',
        message: 'Name this DataStation',
        default: 'DS_' + (new Date()).valueOf().toString()
    }, 
    {
        type: 'text',
        name: 'host',
        message: 'Host IP',
        default: 'http://localhost'
    }, {
        type: 'number',
        name: 'port',
        message: 'Port number',
        default: '1337'
    },{
        type: 'text',
        name: 'token',
        message: 'Token',
        default: '000000'
    }
]).then(() => new Socket());