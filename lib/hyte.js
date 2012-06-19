// # HYbrid TEmplating

// Module dependencies

var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	async = require('async'),
	hogan = require('hogan.js');

// Module definition

module.exports = function() {

	'use strict';

	// ## Configuration

	// Root directory

	var rootDir = __dirname + '/..';

	// Directory containing mustache/hogan template files

	var templateDir = rootDir + '/public/views/';

	// File extension used for mustache/hogan template files

	var templateExtension = '.html';

	// JavaScript template to render compiled templates (the "template template file") to `compilationSetOutput`

	var compilationSetTemplate = __dirname + '/compiled.default.mustache';

	// Target file that will contain all pre-compiled templates (using `compilationSetTemplate`)

	var compilationSetOutput = rootDir + '/public/compiled.js';

	// Use `hyte.configure()` to overwrite default value(s).

	var configure = function(options) {

		templateDir = options.templateDir || templateDir;
		templateExtension = options.templateExtension || templateExtension;
		compilationSetTemplate = options.compilationSetTemplate || compilationSetTemplate;
		compilationSetOutput = options.compilationSetOutput || compilationSetOutput;

	};

	// ## Private methods

	// Reads all template files from the `templateDir` that match
	// the `templateExtension` and compiles them
	//
	// Returned data format to be used in `compilationSetTemplate`:
	//
	//     [{
	// 	       id: templateFileName,
	// 	       script: compiledTemplate
	//     }]

	var compileTemplates = function(callback) {

		var compiledTemplates = [];

		var fileList = fs.readdirSync(templateDir);

		var templateFiles = fileList.filter(function(templateFile) {

			return templateFile.indexOf(templateExtension) > -1;

		});

		async.forEach(templateFiles, function(templateFile, callback) {

			var templateName = templateFile.substr(0, templateFile.lastIndexOf('.'));
			fs.readFile(templateDir + templateFile, 'utf8', function(error, template) {

				compiledTemplates.push({
					id: templateName,
					script: hogan.compile(template, {asString: true})
				});

				callback(error);

			});

		}, function(error) {

			if(error) {
				console.log(error);
			}

			callback(error, compiledTemplates);

		});

	};

	// To make a GET request and return JSON

	var requestFromEndpoint = function(dataURI, callback) {

		var json = '';

		http.get(url.parse(dataURI), function(resEndpoint) {

			if(resEndpoint.statusCode >= 400) {
				return callback(new Error('Endpoint returned: ' + resEndpoint.statusCode));
			}

			resEndpoint.on('data', function(data) {

				json += data.toString();

			});

			resEndpoint.on('end', function() {

				callback(null, JSON.parse(json));

			});

		}).on('error', function(error) {

			console.log(error);

			callback(error);

		});

	}

	// ## Public methods

	// Read a template file,
	// and serve the compiled JS template as an AMD-style module

	var compile = function(view, callback) {

		callback = callback || function(){};

		async.waterfall([

			// Read the template file (referred to by `view`)

			function(next) {

				fs.readFile(templateDir + view + templateExtension, 'utf8', function(error, template) {

					next(error, template);

				});

			},

			// Compile the template file into AMD styled JS module

			function(template, next) {

				var compiledTemplate = hogan.compile('define(new Hogan.Template({{{content}}}))').render({
					content: hogan.compile(template, {asString: true})
				});

				next(null, compiledTemplate);

			}

		// Call original callback

		], function(error, result) {

			if(error) {
				console.log(error);
			}

			callback(error, result);

		});

	};

	// Pre-compiles all templates, and writes them to the `compilationSetOutput` file (using `compilationSetTemplate`)

	var compileAll = function(callback) {

		callback = callback || function(){};

		async.auto({

			// Compile templates

			compile_templates: function(next) {

				compileTemplates(function(error, compiledTemplates) {

					next(error, compiledTemplates);

				});

			},

			// Read `compilationSetTemplate`

			read_templateFile: function(next) {

				fs.readFile(compilationSetTemplate, 'utf8', function(error, template) {

					next(error, template);

				});

			},

			// Compile the compiled templates into the `compilationSetTemplate`

			compile_templateFile: ['compile_templates', 'read_templateFile', function(next, results) {

				var content = hogan.compile(results['read_templateFile']).render({
					templates: results['compile_templates']
				});

				next(null, content);

			}],

			// Write the compiled templates into `compilationSetOutput`

			write_templateFile: ['compile_templateFile', function(next, results) {

				fs.writeFile(compilationSetOutput, results['compile_templateFile'], 'utf8', function(error) {
					next(error);
				});
			}]

		// Call original callback

		}, function(error, results) {

			if(error) {
				console.log(error);
			}

			callback(error, results['compile_templateFile']);

		});

	};

	// Renders a template using the provided `data`,
	// and return the HTML result

	var render = function(view, data, callback) {

		async.waterfall([

			// Read the template file (referred to by `view`)

			function(next) {

				fs.readFile(templateDir + view + templateExtension, 'utf8', function(error, template) {

					next(error, template);

				});

			},

			// Render the template (using the provided `data`)

			function(template, next) {

				var compiledTemplate = hogan.compile(template).render(data);

				next(null, compiledTemplate);
			}

		// Call original callback

		], function(error, result) {

			if(error) {
				console.log(error);
			}

			callback(error, result);

		});

	};

	// Request data from specified endpoint.
	// Then pass the `view` reference and `data` to `render()`

	var renderFromEndpoint = function(view, dataURI, callback) {

		requestFromEndpoint(dataURI, function(error, response) {

			render(view, response, callback);

		});

	};

	// Export the API

	return {
		configure: configure,
		compile: compile,
		compileAll: compileAll,
		render: render,
		renderFromEndpoint: renderFromEndpoint
	};

}();
