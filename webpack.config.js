const path = require('path');
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
    'boxShadow',
    'twos-comp',
    'twosCounter',
    'puz',
    'looper',
]

function entry() {
    let ret = {};
    const fs = require('fs');
    if (fs.existsSync('../../analytics/analytics')) {
        entries.push('analytics');
    }
    for (let entry of entries) {
        ret[entry] = path.join(__dirname, 'ts', `${entry}.ts`);
    }
    ret['wasm_ser'] = path.join(__dirname, 'js', 'wasm_ser.js');
    return ret;
}
module.exports = function (env) {
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
            rules: [{
                test: /\.tsx?$/,
                use: 'awesome-typescript-loader'
            }]
        },
    };
    if (env != 'prod') {
        opts.mode = 'development';
        opts.devtool = 'source-map';
        opts.devServer = {
            historyApiFallback: true,
            publicPath: '/js/',
            contentBase: path.join(__dirname, 'public'),

            proxy: {
                '/analytics': {
                    headers: {
                        'x-client-address': '0.0.0.0',
                    },
                   target: {
                      host: "0.0.0.0",
                      protocol: 'http:',
                      port: 5555
                   },
                }
            }
        };
    } else {
        opts.mode = 'production';
    }
    return opts;
}