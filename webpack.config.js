const path = require('path');
const wp = require('webpack');
const pl = require('./plugin.js')
const entries = [
    'pacman',
    'binary_calc',
    'endian',
    'shifter',
    'AndOr',
    'binaryAnimation',
    'arc',
    'binaryPt1',
    'birthday2018',
    'voice',
    'voiceWorker',
    'xor',
    'binaryNot',
]
function entry() {
    let ret = {};
    for (let entry of entries) {
        ret[entry] = path.join(__dirname, 'ts', `${entry}.ts`);
    }
    ret['wasm_ser'] = path.join(__dirname, 'js', 'wasm_ser.js');
    return ret;
}
module.exports = function(env) {
    let opts = {
        entry: entry(),
        output: {
            path: path.join(__dirname, 'static', 'js'),
            filename: '[name].js',
            publicPath: '/js/',
            chunkFilename: "[id].chunk.js"
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.wasm']
        },
        module: {
            rules: [
                    {
                        test: /\.tsx?$/,
                        use: [
                            'thread-loader',
                            {
                                loader: "ts-loader",
                                options: {
                                    happyPackMode: true
                                }
                            }
                        ]
                    }
            ]
        },
    };
    opts.plugins = [
        // new pl({crateRoots: [path.join(__dirname, 'server', 'wasm')]}),
    ]
    if (env != 'prod'){
        opts.mode = 'development';
        opts.devtool = 'source-map';
    } else {
        opts.mode = 'production';
    }
    return opts;
}
