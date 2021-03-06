// # The hyte server

// Server dependencies

var express = require('express'),
	program = require('commander'),
	hogan = require('hogan.js'),
	hyte = require('./lib/hyte'),
	hyteWatcher = require('./lib/hyte-watcher');

var app = express.createServer();

// ## CLI options

program
	.version('0.0.4')
	.option('-d, --template-dir [templateDir]', 'Template directory (default: public/views/)', __dirname + '/public/views/')
	.option('-e, --template-extension [templateExtension]', 'Template extension (default: .html)', '.html')
	.option('-t, --compilation-template [compilationTemplate]', 'Compilation template for individually compiled templates (default: lib/compilation.amd.mustache)', __dirname + '/lib/compilation.amd.mustache')
	.option('-s, --compilationSet-template [compilationSetTemplate]', 'Compilation template for compiled templates (default: lib/compilationSet.default.mustache)', __dirname + '/lib/compilationSet.default.mustache')
	.option('-o, --compilationSet-output [compilationSetOutput]', 'Output file for compiled templates (default: public/compiled.js)', __dirname + '/public/compiled.js')
	.option('-w, --watcher', 'Enable hyteWatcher')
	.parse(process.argv);

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

// ## hyte configuration

hyte.configure({
	templateDir: program.templateDir,
	templateExtension: program.templateExtension,
	compilationTemplate: program.compilationTemplate,
	compilationSetTemplate: program.compilationSetTemplate,
	compilationSetOutput: program.compilationSetOutput
})

// ## Routes

// **`/compile/:template`**
//
// `:template` will resolve to `templateDir` + `template` + `templateExtension`.
//
// E.g. `/compile/list` compiles `/public/views/list.html` into JS.

app.get('/compile/:template', function(req, res) {

    var templatePath = program.templateDir + req.params.template + program.templateExtension;

	hyte.compile(templatePath, function(error, content) {

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

// **`/render/:template/:dataURI`**
//
// `:template` will resolve to `templateDir` + `template` + `templateExtension`
// `:dataURI` is the absolute (encoded) URI that the view data will be requested from
//
// E.g. `/render/paragraph/http%3A%2F%2Flocalhost%3A3000%2Fdata%2Fparagraph.json`
// serves rendered HTML based on the `/public/views/paragraph.html` template and
// the data response from `http://localhost:3000/data/paragraph.json`.

app.get('/render/:template/:dataURI', function(req, res) {

    var templatePath = program.templateDir + req.params.template + program.templateExtension;

	hyte.renderFromEndpoint(templatePath, req.params.dataURI, function(error, content) {

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

// **`/render/:template`** (POST)
//
// `:template` will resolve to `templateDir` + `template` + `templateExtension`
//
// E.g. `/compile/paragraph` will render the template at
// `/public/views/paragraph.html` using the POSTed data

app.post('/render/:template', function(req, res) {

    var templatePath = program.templateDir + req.params.template + program.templateExtension;

	hyte.render(templatePath, req.body, function(error, content) {

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

	hyte.compileAll(function(error, content) {

		if(error) {

			res.statusCode = 500;
			res.header('Content-Type', 'text/plain');
			res.send('Templates not recompiled.');

		} else {

			res.header('Content-Type', 'text/javascript');
			res.send(content);

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

// Start watching templates for changes (then pre-compile them)

if(program.watcher) {
	hyteWatcher(program.templateDir);
}
