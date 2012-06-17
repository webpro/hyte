// # The hyte watcher

// Watcher dependencies

var chokidar = require('chokidar'),
	fs = require('fs')
	hyte = require('hyte');

// Watcher definition

module.exports = function() {

	// The directory containing the templates.

	var watchDir = 'public/views/';

	// Ignore files starting with ".",
	// or ending with "mustache" or "js".

	var ignorePatterns = [
		/^\./,
		/(mustache|js)$/
	]

	var isIgnored = function(path) {

		var isIgnored = false;

		ignorePatterns.forEach(function(re) {
			if(path.match(re)) {
				isIgnored = true;
			}
		})

		return isIgnored;
	};

	// Compile the template when a file is added or changed.

	var onChange = function(path) {

		console.log('File', path, 'was added or changed');

		var view = path.replace(watchDir, '');
		view = view.substr(0, view.lastIndexOf('.'));

		hyte.compile(view, function(error, content) {
			var newFile = watchDir + view + '.js';
			fs.writeFile(newFile, content, 'utf8', function(error) {
				if(error) {
					console.error('Error', error);
				}
				console.log('File', newFile, 'is written.');
			});

		})

	};

	var onUnlink = function(path) {
		console.log('File', path, 'has been removed');
	};

	var onError = function(error) {
		console.error('Error', error);
	};

	return function() {

		// Start watching when invoking this exported function.

		return chokidar.watch(watchDir, { ignored: isIgnored, persistent: true})
			.on('add', onChange)
			.on('change', onChange)
			.on('unlink', onUnlink)
			.on('error', onError)
			.close();
	};

}();
