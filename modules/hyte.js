// ## HYbrid TEmplating

// Module dependencies

var http = require('http'),
	fs = require('fs'),
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
	// 	       script: compiledTemplate,
	// 	       last: [false|true]
	//     }]

	var compileTemplates = function() {

		var compiledTemplates = [];

		var fileList = fs.readdirSync(templateDir);

		var templateFiles = fileList.filter(function(templateFile) {

			return templateFile.indexOf(templateExtension) > -1;

		});

		templateFiles.forEach(function(templateFile, i) {

			var templateName = templateFile.substr(0, templateFile.lastIndexOf('.'));
			var fileContents = fs.readFileSync(templateDir + templateFile, 'utf8');

			compiledTemplates.push({
				id: templateName,
				script: hogan.compile(fileContents, {asString: true}),
				last: i === templateFiles.length - 1
			});

		});

		return compiledTemplates;

	};

	// ## Public methods

	// Read a template file,
	// and serve the compiled JS template as an AMD-style module.

	var compile = function(view) {

		fs.readFile(templateDir + view + templateExtension, 'utf8', function(error, data) {

			var content = hogan.compile('define(new Hogan.Template({{{content}}}))').render({
				content: hogan.compile(data, {asString: true})
			});

			return content;

		});

	};

	// Pre-compiles all templates, and writes them to the `compiledFile` file

	var compileAll = function(req, res) {

		// Array containing the compiled templates,
		// representing data to be rendered in `compileTemplateFile`.

		var compiledTemplates = compileTemplates();

		var content = hogan.compile(fs.readFileSync(compileTemplateFile, 'utf8')).render({
			templates: compiledTemplates
		});

		fs.writeFile(compiledFile, content, 'utf8', function(error) {

			if(error) {
				throw error;
			}

			console.log('Pre-compiled templates saved as ' + compiledFile);

			return true;
		});

	};

	// Renders a template using the provided `data`,
	// and serves the result as HTML.

	var render = function(view, data, callback) {

		var content = hogan.compile(fs.readFileSync(templateDir + view + templateExtension, 'utf8')).render(data);

		callback.apply(null, [content])

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
