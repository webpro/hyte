test:
	@./node_modules/.bin/mocha --require test/support/setup --reporter spec

.PHONY: test
