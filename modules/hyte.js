// ## HYbrid TEmplating

// Module dependencies

var http = require('http'),
	fs = require('fs'),
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

	// Extension used for mustache/hogan template files

	var templateExtension = '.html';

	// JavaScript template to render compiled templates

	var compileTemplateFile = rootDir + '/public/views/compiled.template.mustache';

	// Target file that will contain all pre-compiled templates (using `compileTemplateFile`)

	var compiledFile = rootDir + '/public/compiled.js';

	// Use `hyte.configure()` to overwrite default value(s).

	var configure = function(options) {

		templateDir = options.templateDir;
		templateExtension = options.templateExtension;
		compileTemplateFile = options.compileTemplateFile;
		compiledFile = options.compiledFile;

	};

	// ## Private methods

	// Reads all template files from the `templateDir` that match
	// the `templateExtension` and compiles them.
	//
	// Returned data format to be used in `compileTemplateFile`:
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
			fs.readFile(templateDir + templateFile, 'utf8', function(error, content) {

				compiledTemplates.push({
					id: templateName,
					script: hogan.compile(content, {asString: true})
				});

				callback(error);

			});

		}, function(error) {

			callback(error, compiledTemplates);

		});

	};

	// ## Public methods

	// Read a template file,
	// and serve the compiled JS template as an AMD-style module.

	var compile = function(view, callback) {

		callback = callback || function(){};

		async.waterfall([

			// Read the template file (referred to by `view`)

			function(next) {

				fs.readFile(templateDir + view + templateExtension, 'utf8', function(error, content) {

					next(error, content);

				});

			},

			// Compile the template file into AMD styled JS module

			function(content, next) {

				var content = hogan.compile('define(new Hogan.Template({{{content}}}))').render({
					content: hogan.compile(content, {asString: true})
				});

				next(null, content);

			}

		// Call original callback

		], callback);

	};

	// Pre-compiles all templates, and writes them to the `compiledFile` file (using `compileTemplateFile`)

	var compileAll = function(callback) {

		callback = callback || function(){};

		async.auto({

			// Compile templates

			compile_templates: function(next) {

				compileTemplates(function(error, compiledTemplates) {

					next(error, compiledTemplates);

				});

			},

			// Read `compileTemplateFile`

			read_templateFile: function(next) {

				fs.readFile(compileTemplateFile, 'utf8', function(error, content) {

					next(error, content);

				});

			},

			// Compile the compiled templates into the `compileTemplateFile`

			compile_templateFile: ['compile_templates', 'read_templateFile', function(next, results) {

				var content = hogan.compile(results['read_templateFile']).render({
					templates: results['compile_templates']
				});

				next(null, content);

			}],

			// Write the compiled templates into `compiledFile`

			write_templateFile: ['compile_templateFile', function(next, results) {

				fs.writeFile(compiledFile, results['compile_templateFile'], 'utf8', function(error) {
					next(error);
				});
			}]

			// Call original callback

		}, function(error, results) {

			callback(error, results['compile_templateFile']);

		});

	};

	// Renders a template using the provided `data`,
	// and return the HTML result

	var render = function(view, data, callback) {

		async.waterfall([

			// Read the template file (referred to by `view`)

			function(next) {

				fs.readFile(templateDir + view + templateExtension, 'utf8', function(error, content) {

					next(error, content);

				});

			},

			// Render the template (using the provided `data`)

			function(content, next) {

				var content = hogan.compile(content).render(data);

				next(null, content);
			}

		// Call original callback

		], callback);

	};

	// Request data from specified endpoint.
	// Then pass the `view` reference and `data` to `render()`

	var renderFromEndpoint = function(view, dataURI, callback) {

		http.get(require('url').parse(dataURI), function(resEndpoint) {

			var json = '';

			resEndpoint.on('data', function(data) {

				json += data.toString();

			});

			resEndpoint.on('end', function() {

				render(view, JSON.parse(json), callback);

			});

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
