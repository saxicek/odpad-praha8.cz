REPORTER = dot

test:
	@./node_modules/.bin/jshint test/
	@./node_modules/.bin/mocha --reporter $(REPORTER) --check-leaks

.PHONY: test
