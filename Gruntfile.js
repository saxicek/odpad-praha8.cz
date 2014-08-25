var config = require('config');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
      dev: {
        tasks: ['nodemon', 'node-inspector', 'watch'],
        options: {
          limit: 4,
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          nodeArgs: ['--debug'],
          env: {
            PORT: config.port
          },
          // omit this property if you aren't serving HTML files and
          // don't want to open a browser tab on start
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });

            // refreshes browser when server reboots
            nodemon.on('restart', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 1000);
            });
          },
          watch: [
            'templates/*.*',
            'bin/**/*.js',
            'config/*.js',
            'test/**/*.js',
            'server.js'
          ]
        }
      }
    },
    'node-inspector': {
      dev: {}
    },
    requirejs: {
      options: {
        baseUrl: 'src/js',
        mainConfigFile: 'src/js/containers.js',
        name: '../../bower_components/requirejs/require',
        include: 'containers',
        out: 'static/js/containers.js',
        wrap: true
      },
      prod: {
      },
      dev: {
        options: {
          optimize: 'none'
        }
      }
    },
    migrate : {
      up : "",
      create: "",
      down: "",
      options: {
        binaryPath: "migrate" //Path to the migrate module
      }
    },
    watch: {
      livereload: {
        options: {
          livereload: true
        },
        files: [
          '.rebooted',
          'static/**/*.*'
        ]
      },
      server: {
        files: [
          // watch only .rebooted - depend on nodemon to restart server
          // whenever server files change
          '.rebooted'
        ],
        tasks: [
          'mochaTest',
          'jshint:server'
        ]
      },
      client: {
        files: [
          'src/js/**/*.js'
        ],
        tasks: [
          'jshint:client',
          'requirejs:dev'
        ]
      },
      configFiles: {
        files: [ 'Gruntfile.js', 'config/*.js' ],
        tasks: ['jshint:configFiles'],
        options: {
          reload: true
        }
      }
    },
    jshint: {
      server: [
        'bin/**/*.js',
        'migrations/*.js',
        'test/**/*.js',
        'server.js'
      ],
      client: [
        'src/js/**/*.js'
      ],
      configFiles: [
        'Gruntfile.js',
        'config/*.js'
      ]
    },
    // Configure a mochaTest task
    mochaTest: {
      server: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-migrate');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-node-inspector');

  grunt.registerTask('build', ['requirejs:prod']);
  grunt.registerTask('deploy', ['migrate:up']);
  grunt.registerTask('dev', ['concurrent']);

  // Default task(s).
  grunt.registerTask('default', ['build', 'deploy']);
};
