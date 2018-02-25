'use strict'
const fs = require('fs');
const path = require('path');
const {spawn, exec} = require('child_process');
const events = require('events');
const ee = new events();
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
const os = require('os');

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
    exec('gutenberg build',
    {cwd: __dirname},
    (gErr, stdout, stderr) => {
        log(stdout, 'gutenberg', chalk.blue);
        buildTimer = 0;
    });
}


let serverProcess;
let webpackProcess;
function start() {
    console.log(chalk.red('starting dev'));
    let webpackCmd = [__dirname, 'node_modules', '.bin',];
    if (os.type().toLowerCase().indexOf('windows') > -1) {
        webpackCmd.push('webpack.cmd');
    } else {
        webpackCmd.push('webpack');
    }
    serverProcess = spawn('cargo', ['run'], {
        cwd: path.join(__dirname, 'server'),
        shell: true,
        windowsHide: true,
    });
    serverProcess.on('error', err => {
        log(err.message, 'server error', chalk.black.bgRed);
    });
    serverProcess.stdout.on('data', data => {
        log(data.toString(), 'server stdout', chalk.cyan);
    });
    serverProcess.stderr.on('data', data => {
        log(data.toString(), 'server stderr', chalk.cyan);
    });
    webpackProcess = spawn(path.join(...webpackCmd), ['-w'], {
        shell: true,
        windowsHide: true,
    });
    webpackProcess.on('error', err => {
        log(err.message, 'webpack error', chalk.green.bgRed);
    });
    webpackProcess.stdout.on('data', data => {
        log(data.toString(), 'webpack stdout', chalk.green);
    });
    webpackProcess.stderr.on('data', data => {
        log(data.toString(), 'webpack stderr', chalk.green);
    })
    buildStatic();
    setInterval(checkFiles, 2000);
}

function log(text, prefix, color) {
    text = stripAnsi(text);
    while (text.indexOf('  ') > -1) {
        text = text.replace(/  /g, ' ');
    }
    let out = `${prefix} ${text.split('\n').map(l => l.trim()).filter(l => l.length > 0).join(`\n${prefix} `)}`;
    console.log(color(out));
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