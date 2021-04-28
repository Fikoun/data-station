const io = require("socket.io-client");
const DeviceController = require("./serial");
const config = require('./config');
const ora = require('ora');

class SocketController {

    connect() {
        //console.log(`${config.get('host')}:${config.get('port')}`);
        this.client = io(`${config.get('host')}:${config.get('port')}`); 

        this.client.on("connect_error", (err) => {
            console.log(`connect_error due to "${err.message}"`);
        });
        
        this.checkConnection();
    }

    checkConnection() {
        const connect_spinner = ora(`Connecting to ${config.get('host')}:${config.get('port')} ...`).start();

        const timeout = 5000;
        const interval = 500;
        let connecting = true;

        const loop = async (i) => {
            if (!connecting) {
                connect_spinner.stop();
                console.log("\nTry correcting connection variables.");
                
                await config.ask('host')
                await config.ask('port')

                connect_spinner.start(`Connecting to ${config.get('host')}:${config.get('port')}`)
                connecting = true;
                return loop(0);
            }

            if (!this.client.connected && i < timeout / interval)
                return setTimeout(() => loop(i+1), interval)
            else if (this.client.connected) {
                connecting = false;
                connect_spinner.succeed(`Connected as >${this.client.id}<`);
            }
            else if (i >= timeout / interval) {
                connect_spinner.fail(`Timeout: Unable to connect to ${config.get('host')}:${config.get('port')}`);
                console.log();

                setTimeout(() => {
                    if (connecting) {
                        process.openStdin().addListener("data", function (d) {
                            connecting = false;
                        });
                        connect_spinner.start("Connecting ... press <enter>  to stop")
                        loop(0);
                    }
                }, 2000);
                return;
            }
        };

        this.client.on("connect", (msg, err) => {
            connect_spinner.succeed();
            this.client.emit('settings', config.data);
        });

        this.client.on("disconnect", (msg, err) => {
            connect_spinner.warn("Disconnected!");
            setTimeout(() => {
                connect_spinner.start("Reconnecting ...")
                connecting = true;
                loop(0);
            }, 2000);
        });



        this.handleServer();

        connecting = true;
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

module.exports = new SocketController();