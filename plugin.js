const name = 'RustWasmBindgenPlugin';
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
class RustWasmBindgenPlugin {
    constructor(config) {
        this.crateRoots = config.crateRoots || [];
    }
    apply(compiler) {
        let output = compiler.options.output.path
        let mode = compiler.options.mode;
        compiler.hooks.beforeRun.tap(name, comp => this.buildWasm(mode, output));
    }

    buildWasm(mode, output) {
        let buildType = '';
        let buildFolder = 'debug';
        if (mode == 'production') {
            buildType = ' --release';
            buildFolder = 'release';
        }
        for (var root of this.crateRoots) {
            console.log('Building', root);
            console.log(
                cp.execSync(`cargo +nightly build --target wasm32-unknown-unknown${buildType}`, {
                    cwd: root,
                }).toString()
            );
            let name = path.basename(root);
            let inputPath = path.join(root, 'target', 'wasm32-unknown-unknown', buildFolder, `${name}.wasm`);
            console.log('Executing bindgen from', inputPath, 'to', output);
            console.log(
                cp.execSync(`wasm-bindgen ${inputPath} --out-dir ${output}`, {
                    cwd: root,
                }).toString()
            );
        }
    }
}

module.exports = RustWasmBindgenPlugin;