mustachepp.min.js: beefcake.js
	node_modules/.bin/uglifyjs beefcake.js -o beefcake.min.js

test:	
	node_modules/.bin/jasmine-node test/

.PHONY: test