const fs = require('fs');
const path = require('path');
const {spawn, exec} = require('child_process');
const events = require('events');
const ee = new events();
const chalk = require('chalk');

let watched = {
    templates: {},
    content: {},
    sass: {},
}
watched[path.join('static', 'js')] = {};
let buildTimer;

function checkFiles() {
    for (let dir in watched) {
        checkDir(dir);
    }
}

function checkDir(dirName) {
    let dirPath = path.join(__dirname, dirName);
    fs.readdir(dirPath, (err, fileNames) => {
        if (err) return console.error('error reading dir', err);
        for (let fileName of fileNames) {
            let filePath = path.join(dirPath, fileName);
            fs.stat(filePath, (err, stat) => {
                if (err) return console.error(`err getting stat for ${filePath}`, err);
                let oldStat = watched[dirName][fileName];
                if (oldStat && oldStat.mtimeMs < stat.mtimeMs) {
                    ee.emit('change');
                }
                watched[dirName][fileName] = stat;
            });
        }
    });
}

ee.on('change', () => {
    if (!buildTimer) {
        buildTimer = setTimeout(buildStatic, 2000);
    }
});
function buildStatic() {
    console.log(chalk.yellow.bgBlue('buildStatic'));
    exec('gutenberg build', 
    {cwd: __dirname},
    (gErr, stdout, stderr) => {
        let out = chalk.blue(stdout);
        console.log(out);
        buildTimer = 0;
    });
}


let serverProcess;
let webpackProcess;
function start() {
    serverProcess = spawn('cargo', ['run'], {
        cwd: path.join(__dirname, 'server'),
        shell: true,
        windowsHide: true,
    });
    serverProcess.on('error', (err) => {
        let out = chalk.black.bgRed(err.message);
        console.log(out);
    });
    if (serverProcess.stdout) {
        serverProcess.stdout.on('data', (data) => {
            let out = chalk.black.bgCyan(data.toString());
            console.log('server output', out);
        });
    }
    webpackProcess = spawn(path.join(__dirname, 'node_modules', '.bin', 'webpack.cmd'), ['-w'], {
        shell: true,
        windowsHide: true,
    });
    webpackProcess.on('error', (err) => {
        let out = chalk.green.bgRed(err.message);
        console.log(out);
    });
    webpackProcess.stdout.on('data', (data) => {
        let out = chalk.green(data.toString());
        console.log(out);
    });
    buildStatic();
    setInterval(checkFiles, 2000);
}

start();
process.on('exit', code => {
    if (webpackProcess) {
        webpackProcess.kill();
    }
    if (serverProcess) {
        serverProcess.kill();
    }
});