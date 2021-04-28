const SerialPort = require("serialport");
const Readline = require('@serialport/parser-readline')


class DeviceController {

    constructor() {
        this.connections = [];
    }

    openSerial(path, baudRate = 9600, open = true) {
        let connection = {
            open: false,
            value: 0,
            path,
            port: SerialPort(path, { baudRate, autoOpen: false }),
            onData: () => { }
        }

        connection.port.on('close', function (err) {
            if (err)
                console.error(err);
            this.open = false;
        }.bind(connection))

        if (open) {
            connection.port.open(function (err) {
                if (err)
                    console.error(err);

                const parser = connection.port.pipe(new Readline({ delimiter: '\r\n' }))
                parser.on('data', this.onData)

                this.open = true;
            }.bind(connection));
        }

        this.connections.push(connection);
        return connection;
        // console.log(connection);
    }

    async listSerial(filterUSB = false) {
        let ports = await SerialPort.list();

        if (filterUSB)
            ports = ports.filter((port) => (port.path.includes('usb') || (port.path.includes('COM'))))

        return (ports.map((port, key) => ({ name: `Serial-${key + 1}`, path: port.path })))
    }

    async command(path, command, callback) {
        let connection = this.connections.find((c) => c.path == path)

        // console.log({ path, command });

        command += '\n';

        if (!connection) {
            let ports = await SerialPort.list();
            console.log({ connection: [path, command] });

            if (ports.find((port) => port.path === path))
                connection = (await this.openSerial(path));
            else
                return callback({ error: "Device is not connected to DataStation!" })
        }

        // console.log(connection);
        connection.onData = (data) => {
            console.log(data);
            
            callback(data)
        }     

        if (connection.open) {
            console.log(command);

            connection.port.write(command)
        } else {
            connection.port.on('open', () => {
                console.log(command);

                connection.port.write(command)
            })
        }

    }
}

module.exports = new DeviceController();