/**
 * @Author: dmyang
 * @Date:   2015-06-29 18:42:30
 * @Last Modified by:   dmyang
 * @Last Modified time: 2016-02-03 12:52:49
 */

'use strict';

// load native modules
var http = require('http');
var path = require('path');
var util = require('util');

// load 3rd modules
var koa = require('koa');
var router = require('koa-router')();
var serve = require('koa-static');
var colors = require('colors');
var open = require('open');

// load local modules
var pkg = require('../package.json');
var env = process.argv[2] || process.env.NODE_ENV;
var debug = 'production' !== env;
var viewDir = debug ? 'src' : 'assets';
var staticDir = path.resolve(__dirname, '../' + (debug ? 'src' : 'assets'));

// load routes
var routes = require('./routes');

// init framework
var app = koa();

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

// basic settings
app.keys = [pkg.name, pkg.description];
app.proxy = true;

// global events listen
app.on('error', function(err, ctx) {
    err.url = err.url || ctx.request.url;
    console.error(err, ctx);
});

// handle favicon.ico
app.use(function*(next) {
    if (this.url.match(/favicon\.ico$/)) this.body = '';
    yield next;
});

// logger
app.use(function*(next) {
    console.log(this.method.info, this.url);
    yield next;
});

// use routes
routes(router, app, staticDir);
app.use(router.routes());

if(debug) {
    var webpackDevMiddleware = require('koa-webpack-dev-middleware');
    var webpack = require('webpack');
    var webpackDevConf = require('../webpack-dev.config');

    app.use(webpackDevMiddleware(webpack(webpackDevConf), {
        contentBase: webpackDevConf.output.path,
        publicPath: webpackDevConf.output.publicPath,
        hot: true,
        // stats: webpackDevConf.devServer.stats
        stats: {
            cached: false,
            colors: true
        }
    }));
}

// handle static files
app.use(serve(staticDir, {
    maxage: 0
}));

app = http.createServer(app.callback());

app.listen(3005, '0.0.0.0', function() {
    var url = util.format('http://%s:%d', 'localhost', 3005);

    console.log('Listening at %s', url);

    open(url);
});
