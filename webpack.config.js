const webpack = require('webpack');
const ugly = require('uglifyjs-webpack-plugin')
module.exports = 
function(environment) {
    var config = {};
    config.entry = {app: './ts/app.ts'};
    config.output = {
        path: __dirname + '/js/build',
        filename: '[name].js'
    };
    config.resolve = {
        extensions: ['.ts', '.js']
    };
    config.module = {
        loaders: [
            {
                test: /\.ts$/,
                exclude: ['./node_modules/**/*'],
                use: ['awesome-typescript-loader']
            },
            {
                test: /\.js$/,
                use: 'uglify-loader'
            }
        ]
    }
    switch (environment) {
        case 'prod':
            config.plugins = [
                new ugly({
                    extractComments: true
                })
            ]
        break;
        case 'dev':
            config.devtool = 'source-map'
        break;
    }
    return config;
}