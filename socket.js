const io = require("socket.io-client");
const DeviceController = require("./serial");
const config = require('./config');
const ora = require('ora');

class SocketController {

    constructor() {
        this.connect();
    }

    connect() {
        //console.log(`${config.get('host')}:${config.get('port')}`);
        this.client = io(`${config.get('host')}:${config.get('port')}`, {
            auth: {
                token: config.get('token'),
                reconnection: false
            }
        }); 
        this.connecting = true;
        if (this.connect_spinner)
            this.connect_spinner.stop();
        else
            this.connect_spinner = ora(`Connecting to ${config.get('host')}:${config.get('port')} ...`).start();
        
        this.checkConnection();
    }

    checkConnection() {
        const timeout = 5000;
        const interval = 500;

        this.client.on("connect_error", (err) => {
            console.log(`\nconnect_error due to "${err.message}"`);
            this.connecting = false;
            this.connect_spinner.stop();
            this.client.disconnect();
            this.client.removeAllListeners();
        });

        const loop = async (i) => {
            if (!this.connecting || (i >= timeout / interval)) {
                this.connect_spinner.stop();
                console.log("\nTry correcting connection variables.");
                
                await config.ask('host')
                await config.ask('port')
                await config.ask('token')

                return this.connect()
            }else if (this.client.connected) {
                this.connecting = false;
                this.connect_spinner.succeed(`Connected as >${this.client.id}<`);
            }else if (!this.client.connected && i < timeout / interval)
                return setTimeout(() => loop(i+1), interval)
        };

        this.client.on("connect", (msg, err) => {
            this.connect_spinner.succeed();
            console.log({msg});
            //this.client.emit('settings', config.data);
        });

        this.client.on("disconnect", (msg, err) => {
            this.connect_spinner.warn("Disconnected!");
            this.client.disconnect();
            this.client.removeAllListeners();
            return this.connect()
        });

        this.handleServer();
        loop(0);
    }

    handleServer() {

        this.client.on('list', () => this.client.emit('message', DeviceController.list()));

        this.client.on('listPorts', () => {
            DeviceController.listSerial().then((list) => this.client.emit('ports', list))
        });

        this.client.on('command', ({path, command}) => {
            DeviceController.command(path, command, (data) => this.client.emit('data', data))
        });
    }

}

module.exports = SocketController;