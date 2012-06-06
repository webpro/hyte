REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --require test/support/setup --reporter $(REPORTER)

docs:
	@docco modules/hyte.js server.js

test-cov: lib-cov
	@mkdir -p ./docs
	@EXPRESS_COV=1 $(MAKE) test REPORTER=html-cov > docs/coverage.html

lib-cov:
	@jscoverage lib lib-cov

.PHONY: test docs
