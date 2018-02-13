const path = require('path');
const wp = require('webpack');
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
            loaders: [
                {
                    test: /\.tsx?$/,
                    use: 'awesome-typescript-loader'
                }
            ]
        },
    };
    if (env != 'prod'){
        opts.devtool = 'sourcemap';
    } else {
        opts.plugins = [
            new wp.optimize.UglifyJsPlugin()
        ]
    }
    return opts;
}