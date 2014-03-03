/**
 * Configuration of build properties for r.js. It builds client javascript
 * modules into one optimized file.
 *
 * Usage:
 *    r.js -o build_config.js
 */
({
  baseUrl: 'src/js',
  mainConfigFile: 'src/js/containers.js',
  name: '../../bower_components/requirejs/require',
  include: 'containers',
  out: 'static/js/containers.js',
  wrap: true
})
