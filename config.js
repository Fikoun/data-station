const fs = require('fs');
const inquirer = require('inquirer');

const readFile = (path, opts = 'utf8') =>
  new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/${path}`, opts, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

const writeFile = (path, data, opts = 'utf8') =>
  new Promise((resolve, reject) => {
    fs.writeFile(`${__dirname}/${path}`, data, opts, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

class Config {

    constructor() {
        this.config_file = '';
        this.prompt_configs = [];
        this.data = {};
    }

    async loadConfig(prompt_configs, config_file = 'config.json') {
        this.config_file = config_file;
        this.prompt_configs = prompt_configs;
        this.data = {};

        try {
            let data = await readFile(config_file)
            this.data = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT')
                await this.saveConfig();
        }
        
        await this.askPrompt();
    }

    async saveConfig() {
        await writeFile(this.config_file, JSON.stringify(this.data));
    }

    get(name) {
        if (typeof this.data[name] === 'undefined')
            return false;
        else
            return this.data[name]
    }

    set(name, value) {
        this.data[name] = value;
        this.saveConfig();
    }

    async ask(name){
        let prompts = this.prompt_configs.filter(prompt => (prompt.name === name));

        this.data = {...this.data, ...await inquirer.prompt(prompts)};
        await this.saveConfig();
    }

    async askPrompt() {
        let prompts = this.prompt_configs.filter(prompt => (typeof this.data[prompt.name] === 'undefined'));
      
        this.data = {...this.data, ...await inquirer.prompt(prompts)};
        await this.saveConfig();
    }
}

module.exports = new Config();