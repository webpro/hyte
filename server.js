// ## The hyte server

// Server dependencies

var express = require('express'),
	hogan = require('hogan.js'),
	hyte = require('./modules/hyte.js');

var app = express.createServer();

// ## Express configuration

app.configure(function () {

	app.set('view engine', 'hogan');
	app.set('view options',{layout:false});

	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));

});

app.configure('development', function () {
	app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
});

app.configure('production', function () {
	app.use(express.errorHandler());
});

// Overwrite compile method for use with hogan

app.register('html', {
	compile: function() {
		var t = hogan.compile.apply(hogan, arguments);
		return function() {
			return t.render.apply(t, arguments);
		};
	}
});

// ## Routes

// **`/compile/:view`**
//
// `:view` will resolve to `templateDir`+`view`+`templateExtension`.
//
// E.g. `/compile/list` compiles `/public/views/list.html` into JS.

app.get('/compile/:view', function(req, res) {

	hyte.compile(req.params.view, function(error, content) {

		if(error) {

			res.statusCode = 500;
			res.header('Content-Type', 'text/plain');
			res.send('Template not compiled.');

		} else {

			res.header('Content-Type', 'text/javascript');
			res.send(content);

		}

	});

});

// **`/render/:view/:dataURI`**
//
// `:view` will resolve to `templateDir`+`view`+`templateExtension`
// `:dataURI` is the absolute (encoded) URI that the view data will be requested from
//
// E.g. `/render/paragraph/http%3A%2F%2Flocalhost%3A3000%2Fdata%2Fparagraph.json`
// serves rendered HTML based on the `/public/views/paragraph.html` template and
// the data response from `http://localhost:3000/data/paragraph.json`.

app.get('/render/:view/:dataURI', function(req, res) {

	hyte.renderFromEndpoint(req.params.view, req.params.dataURI, function(error, content) {

		if(error) {

			res.statusCode = 500;
			res.header('Content-Type', 'text/plain');
			res.send('Template not rendered.');

		} else {

			res.header('Content-Type', 'text/javascript');
			res.send(content);

		}

	});

});

// **`/render/:view`** (POST)
//
// `:view` will resolve to `templateDir`+`view`+`templateExtension`
//
// E.g. `/compile/paragraph` will render the template at
// `/public/views/paragraph.html` using the POSTed data

app.post('/render/:view', function(req, res) {

	hyte.render(req.params.view, req.body, function(error, content) {

			if(error) {

				res.statusCode = 500;
				res.header('Content-Type', 'text/plain');
				res.send('Template not rendered.');

			} else {

				res.header('Content-Type', 'text/html');
				res.send(content);

			}

		});

});

// **`/recompile`**
//
// This will re-compile all templates in the configured views directory

app.get('/recompile', function(req, res) {

	hyte.compileAll(function(error) {

		if(error) {

			res.statusCode = 500;
			res.header('Content-Type', 'text/plain');
			res.send('Templates not recompiled.');

		} else {

			res.header('Content-Type', 'text/plain');
			res.send('Templates successfully recompiled.');

		}

	});

});

// ## Finishing

// Just pre-compile all templates when starting server

hyte.compileAll();

// Start the server

app.listen(3000, function () {
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
