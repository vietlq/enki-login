.phony: watch build

build:
	babel --verbose --minified client/enki.js | uglifyjs --verbose --compress --mangle > public/static/enki.min.js
	babel --verbose --minified client/app.js | uglifyjs --verbose --compress --mangle > public/static/app.min.js

watch:
	watchify client/enki.js --delay --poll -o "make build > /dev/null" -v
