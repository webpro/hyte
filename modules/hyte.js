var http = require('http'),
	fs = require('fs'),
	hogan = require('hogan.js');

var hyte = function() {

	'use strict';

	// Directory containing mustache/hogan template files
	var templateDir;

	// Extension used for mustache/hogan template files
	var templateExtension;

	// JavaScript template that will contain all pre-compiled templates
	var compileTemplateFile;

	// Target file that will contain all pre-compiled templates
	var compiledFile;

	/*
	 * Configure some file/path directives
	 */

	var configure = function(options) {

		templateDir = options.templateDir;
		templateExtension = options.templateExtension;
		compileTemplateFile = options.compileTemplateFile;
		compiledFile = options.compiledFile;

	};

	/*
	 * Reads a template file, and serves the pre-compiled JS template function (AMD-style)
	 */

	var compile = function(view, res) {

		fs.readFile(templateDir + view + templateExtension, 'utf8', function(error, data) {

			var content = hogan.compile('define(new Hogan.Template({{{content}}}))').render({
				content: hogan.compile(data, {asString: true})
			});

			res.header('Content-Type', 'text/javascript');
			res.send(content);

		});

	};

	/*
	 * Stores pre-compiled template in a .js file
	 */

	var compileAll = function(req, res) {

		// Array containing the pre-compiled templates
		// Each element has {id:templateFileName, script:compiledTemplate, last:[false|true]}
		var compiledTemplates = compileTemplates();

		var content = hogan.compile(fs.readFileSync(compileTemplateFile, 'utf8')).render({
			templates: compiledTemplates
		});

		fs.writeFile(compiledFile, content, 'utf8', function(error) {

			if(error) {
				throw error;
			}

			if(req && res) {
				res.header('Content-Type', 'text/plain');
				res.send('Templates successfully recompiled.');
			}

			console.log('Pre-compiled templates saved as ' + compiledFile);
		});

	};

	/*
	 * Reads all template files, and pre-compiles them
	 */

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

	/*
	 * Renders a template using the provided data, serves the result as HTML
	 */

	var render = function(view, data, res) {

		res.header('Content-Type', 'text/html');
		res.header('Access-Control-Allow-Origin', '*');
		res.render(templateDir + view + templateExtension, data);

	};

	/*
	 * Request data from specified endpoint, then pass to render()
	 */

	var renderFromEndpoint = function(view, dataURI, res) {

		http.get(require('url').parse(dataURI), function(resEndpoint) {

			var json = '';

			resEndpoint.on('data', function(data) {

				json += data.toString();

			});

			resEndpoint.on('end', function() {

				render(view, JSON.parse(json), res);

			});

		});

	};

	return {
		configure: configure,
		compile: compile,
		compileAll: compileAll,
		render: render,
		renderFromEndpoint: renderFromEndpoint
	};

}();

module.exports = hyte;
