# hyte

HYbrid TEmplating for the browser and Node. Using [Hogan.js](http://twitter.github.com/hogan.js/) (based on [mustache](http://mustache.github.com/mustache.5.html)) as templating engine.

## Installation

	npm install
	node server.js

You can now browse to `http://localhost:3000/index.html` for a demo.

## Quick overview

The included **server** provides:

* All your pre-compiled templates at `/compiled.js`
* Pre-compile separate templates via `/compile/[template]`
* Server-side rendering of templates via `/render/[template]/[encoded-endpoint-url]`
* Render template server-side using POST data at `/render/[template]`

The **hyte module** can also be integrated stand-alone using this API:

* `hyte.compile(template)`
* `hyte.compileAll()`
* `hyte.render(template, data)`
* `hyte.renderFromEndpoint(template, url)`

On the **client**, pre-compiled templates can be rendered...

* `var renderedTemplate = compiledTemplate.render(data)`;

...or just, when pre-rendered on the server...

* `$('#placeholder).html(renderedTemplate);`

## Services

Running the server will give you services at `http://localhost:3000` to:

### Pre-compiled concatenated templates

All templates at `/public/views/*.html` are pre-compiled and concatenated to JS and available at `/compiled.js`. This file itself is also using a template: `/public/views/compiled.template.mustache`.

Example result for /compiled.js (object property keys directly taken from filename):

	window.app.templates = {
		"list": new Hogan.Template(function(c,p,i){}),
		"paragraph": new Hogan.Template(function(c,p,i){})
	};

This can then be used like this:

	var data = {"message": "This is rendered client-side in a pre-compiled template"}
	var html = app.templates['list'].render(data);
	$('#placeholder').append(html);

Location: (GET) `http://localhost:3000/compiled.js`

Suggested usage: make sure the first and/or most used templates are pre-compiled like this.

### Pre-compile separate templates

Pre-compiled templates are available at `/compile/[template]`. Compiled to JS in AMD style from `/public/views/[template].html`.

	define(new Hogan.Template(function(c,p,i){}))

So you can use it like this:

	require(['/compile/paragraph'], function(compiledTemplate) {
		var html = compiledTemplate.render({"message": "This is rendered client-side in a pre-compiled template"});
		$('#placeholder').append(html);
	});

Location: (GET) `http://localhost:3000//compile/[template]`

Suggested usage: this usage can come in handy when the data is available client-side, and the template still needs to be fetched and compiled.

### Render HTML completely server-side

By providing a reference to the template and a full URL to the data endpoint, this service returns pre-rendered HTML.

For example:

	http://localhost:3000/render/paragraph/http%3A%2F%2Flocalhost%3A3000%2Fdata%2Fparagraph.json

returns an HTML string ready to be inserted in the page:

	<p>This is data in a JSON resource</p>

For now, the data endpoint should deliver JSON that is tailored to the template (no intermediate parsing of data).

Location: (GET) `http://localhost:3000/render/[template]/[encoded-endpoint-url]`

Suggested usage: this is the best usage performance-wise, just make sure template and data (JSON) match directly.

### Render POSTed data

Get pre-rendered HTML from server by providing reference to template and POST data (no processing client-side)

	var data = {"message": "This is pre-rendered server-side"};
	$.post('/render/paragraph', data, function(renderedTemplate) {
		$('#placeholder').append(renderedTemplate);
	});

Location: (POST) `http://localhost:3000/render/[template]`

Suggested usage: the data is available client-side, but the compiled template is not.

### Static server

Static files from `/public` are available from the root url. E.g. `/index.html` is served from `/public/index.html`.

## Shouts / dependencies

Many thanks to anyone that contributed to the libraries used in this tool:

* [Node](http://nodejs.org/)
* [Express](http://expressjs.com/)
* [Hogan.js](http://twitter.github.com/hogan.js/)
