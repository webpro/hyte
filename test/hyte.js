describe('hyte', function () {

	describe('#compile', function() {

		it('should return a compiled template', function(done) {

			hyte.compile('paragraph', function(error, result) {

				expect(result).to.be.a('string');
				expect(result).to.match(/^define\(new\ Hogan\.Template\(function.*\)\)$/);
				done();

			});


		});

	});

	describe('#compileAll', function() {

		it('should return all templates compiled', function(done) {

			hyte.compileAll(function(error, result) {

				var context = { window: {}, Hogan: Hogan };

				vm.runInNewContext(result, context);

				expect(result).to.be.a('string');
				expect(context.window.app.templates).to.include.keys(['list','paragraph']);
				expect(context.window.app.templates.list).to.be.an.instanceof(Hogan.Template);

				done();

			});


		});

	});

	describe('#render', function() {

		it('should return a rendered template', function(done) {

			var data = {"message": "My test text."};

			hyte.render('paragraph', data, function(error, result) {

				expect(result).to.be.a('string');
				expect(result).to.match(/^<p>My test text\.<\/p>/);
				done();

			});

		});

	});

	describe('#renderFromEndpoint', function() {

		it('should return a rendered template', function(done) {

			var host = 'http://localhost:3000';
			var path = '/data/paragraph.json';

			nock(host).get(path).replyWithFile(200, __dirname + '/../public' + path);

			hyte.renderFromEndpoint('paragraph', host + path, function(error, result) {

				if(error) {
					return done(error);
				}

				expect(result).to.be.a('string');
				expect(result).to.match(/^<p>This is data in a JSON resource\.<\/p>/);
				done();

			});

		});

	});

});
