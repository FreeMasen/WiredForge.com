const path = require('path');
const wp = require('webpack');
const Hard = require('hard-source-webpack-plugin');
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
    return ret;
}
module.exports = function(env) {
    let opts = {
        entry: entry(),
        output: {
            path: path.join(__dirname, 'static', 'js'),
            filename: '[name].js'
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx']
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
        new Hard(),
    ]
    if (env != 'prod'){
        opts.devtool = 'source-map';
    } else {
        opts.plugins.push(
            new wp.optimize.UglifyJsPlugin()
        )
    }
    return opts;
}