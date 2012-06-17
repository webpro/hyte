# hyte

HYbrid TEmplating for the browser and Node. Using [Hogan.js](http://twitter.github.com/hogan.js/) (based on [mustache](http://mustache.github.com/mustache.5.html)) as templating engine.

## Table of Contents

* [Installation](#installation)
* [Templating 101](#templating-101)
* [Pre-compiled templates](#pre-compiled-templates)
* [Quick overview: hyte](#quick-overview-hyte)
* [Services](#services)
* [Tests](#tests)
* [Annotated source code](#annotated-source-code)
* [Shouts / dependencies](#shouts--dependencies)

## Installation

	npm install
	node server.js

You can now browse to `http://localhost:3000/index.html` for a demo.

Use `node server.js --watcher` to enable the template file watcher (to recompile templates when it changes).

## Templating 101

Most JavaScript templating engines do their work in two phases:

1. compile the template
    * in: template
    * out: compiled template as a JavaScript function
2. render the template
    * in: compiled template + data
    * out: populated template, usually HTML

Hogan, the basis for hyte, also works like this. So, a Mustache template like this..

	<h1>{{title}}</h1>
	<ul>                 
        {{#names}}         
            <li>{{name}}</li>
        {{/names}}         
	</ul> 

..can be compiled..

    var template = hogan.compile('<h1>{{title}}</h1><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul>');

..resulting in a JavaScript function..

    function(c,p,i){var _=this;_.b(i=i||"");_.b("<h1>");_.b(_.v(_.f("title",c,p,0)));_.b("</h1>");_.b("\n" + i);_.b("<ul>");_.b("\n" + i);if(_.s(_.f("names",c,p,1),c,p,0,35,56,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<li>");_.b(_.v(_.f("name",c,p,0)));_.b("</li>");_.b("\n");});c.pop();}_.b("</ul>");return _.fl();;}

..which can be passed some data..

	var data = {                          
        "title": "Story",    
        "names": [           
            {"name": "Tarzan"},
            {"name": "Jane"}   
        ]
	}

..and it will render..

    var result = template.render(data);

..into this result:

	<h1>Story</h1>
	<ul>
	  <li>Tarzan</li>
	  <li>Jane>  +</ul>
	</ul>

## Pre-compiled templates

Since compilation must be done anyway, and it can be done on the server, this is definitely the recommended way to go. Most importantly, it takes away processing on the client, which is great for performance. Additionally, the compiled JS functions serve as a cache in itself. The JS being served to the client can look like this:

    var myApp.templates = {
        template1: new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<h1>");_.b(_.v(_.f("title",c,p,0)));_.b("</h1>");_.b("\n" + i);_.b("<ul>");_.b("\n" + i);if(_.s(_.f("names",c,p,1),c,p,0,35,56,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	<li>");_.b(_.v(_.f("name",c,p,0)));_.b("</li>");_.b("\n");});c.pop();}_.b("</ul>");return _.fl();;}),
        template2: new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<p>");_.b(_.v(_.f("message",c,p,0)));_.b("</p>");_.b("\n");return _.fl();;}),
    }

Any pre-compiled template can then be used like this:

    var result = myApp.templates['template1'].render(data);
    document.getElementById('placeholder').innerHTML = result;

Depending on the situation, even the template rendering can be done server-side. When the data is, or can be made available server-side, this would even further reduce processing on the client, serving pre-rendered HTML to the client. This can be inserted in the DOM right away.

## Quick overview: hyte

The included hyte **server** provides:

* All your pre-compiled templates at `/compiled.js`
* Pre-compile separate templates via `/compile/[template]`
* Server-side rendering of templates via `/render/[template]/[encoded-endpoint-url]`
* Render template server-side using POST data at `/render/[template]`

The hyte Node **module** can also be used stand-alone:

* `hyte.compile(template, callback)`
* `hyte.compileAll(callback)`
* `hyte.render(template, data, callback)`
* `hyte.renderFromEndpoint(template, dataURI, callback)`

On the **client**, pre-compiled templates can be rendered...

* `var renderedTemplate = compiledTemplate.render(data);`

...or just, when pre-rendered on the server...

* `$('#placeholder).html(renderedTemplate);`

## Services

Running the server will give you services at `http://localhost:3000` to:

### Pre-compiled templates

All templates at `/public/views/*.html` are pre-compiled into JS and ready at `/compiled.js`.

Example result for /compiled.js (object property keys directly taken from filename):

	window.app.templates = {
		"list": new Hogan.Template(function(c,p,i){}),
		"paragraph": new Hogan.Template(function(c,p,i){})
	};

This can then be used like this:

	var data = {"message": "This is rendered client-side in a pre-compiled template"}
	var html = app.templates['list'].render(data);
	$('#placeholder').append(html);

The file `/compiled.js` itself is also generated using a template (`/public/views/compiled.template.mustache`).

Location: GET `http://localhost:3000/compiled.js`

Suggested usage: make sure the first and/or most used templates are pre-compiled like this.

### Pre-compile separate templates

Pre-compiled templates are available at `/compile/[template]`. Compiled to JS in AMD style from `/public/views/[template].html`.

	define(new Hogan.Template(function(c,p,i){}))

So you can use it like this:

	require(['/compile/paragraph'], function(compiledTemplate) {
		var html = compiledTemplate.render({"message": "This is rendered client-side in a pre-compiled template"});
		$('#placeholder').append(html);
	});

Location: GET `http://localhost:3000//compile/[template]`

Suggested usage: this usage can come in handy when the data is available client-side, and the template still needs to be fetched and compiled.

### Render template completely server-side

By providing a reference to the template and a full URL to the data endpoint, this service returns pre-rendered templates.

For example:

	http://localhost:3000/render/paragraph/http%3A%2F%2Flocalhost%3A3000%2Fdata%2Fparagraph.json

returns an HTML string ready to be inserted in the page:

	<p>This is data in a JSON resource</p>

For now, the data endpoint should deliver JSON that is tailored to the template (no intermediate parsing of data).

Location: GET `http://localhost:3000/render/[template]/[encoded-endpoint-url]`

Suggested usage: this is the best usage performance-wise, just make sure template and data (JSON) match directly.

### Render POSTed data

Get pre-rendered HTML from server by providing reference to template and POST data (no processing client-side)

	var data = {"message": "This is pre-rendered server-side"};
	$.post('/render/paragraph', data, function(renderedTemplate) {
		$('#placeholder').append(renderedTemplate);
	});

Location: POST `http://localhost:3000/render/[template]`

Suggested usage: the data is available client-side, but the compiled template is not.

### Static server

Static files from `/public` are available from the root url. E.g. `/index.html` is served from `/public/index.html`.

### Watcher

Files from the template directory are watched for changes, and then automatically re-compiled.

## Tests

Run tests using mocha

	make test

Generate test coverage report to docs/coverage.html (requires [node-jscoverage](https://github.com/visionmedia/node-jscoverage))

	make test-cov

## Annotated source code

Generate annotated source code in docs folder (using [Docco](http://jashkenas.github.com/docco/))

    make docs

## Shouts / dependencies

Many thanks to anyone that contributed to the libraries used in this tool:

* [Node](http://nodejs.org/)
* [Express](http://expressjs.com/)
* [Hogan.js](http://twitter.github.com/hogan.js/)
