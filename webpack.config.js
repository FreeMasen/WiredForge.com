const path = require('path');
const wp = require('webpack');

module.exports = function(env) {
    let opts = {
        entry: {
            pacman: path.join(__dirname, 'ts','pacman.ts'),
            binary_calc: path.join(__dirname, 'ts', 'binary_calc.ts'),
            endian: path.join(__dirname, 'ts', 'endian.ts'),
        },
        output: {
            path: path.join(__dirname, 'static', 'js'),
            filename: '[name].js'
        },
        devtool: 'sourcemap',
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