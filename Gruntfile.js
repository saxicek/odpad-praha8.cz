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
          ignore: [
            'test/**/*.*'
          ],
          watch: [
            'templates/*.*',
            'bin/**/*.js',
            'config/*.js',
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
        baseUrl: 'client/src/js',
        mainConfigFile: 'client/src/js/containers.js',
        name: '../../../bower_components/requirejs/require',
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
          '.rebooted',
          // and server tests - they are not monitored by nodemon
          'test/**/*.js'
        ],
        tasks: [
          'mochaTest',
          'jshint:server'
        ]
      },
      client: {
        files: [
          'client/src/js/**/*.js'
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
        'client/src/js/**/*.js'
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
    },
    // Usage:
    // $ grunt bump:patch
    // $ grunt bump:minor
    // $ grunt bump:major
    bump: {
      options: {
        files: ['package.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
      }
    },
    migrate: {
      options: {
        env: {
          // The replace() call is a workaround for Openshift which uses postgresql://user:pass@ip:port
          // URL format. dm-migrate supports only pg:// or postgres:// in version 0.7.1
          DATABASE_URL: config.pg_config.replace('postgresql://', 'pg://') + '/' + config.schema_name
        },
        verbose: true
      }
    },
    copy: {
      // copy static files from bower_components to static/lib
      main: {
        files: [
          {expand: true, cwd: 'bower_components/leaflet/dist/', src: ['**', '!*.js'], dest: 'static/lib/leaflet', filter: 'isFile'},
          {expand: true, cwd: 'bower_components/Leaflet.awesome-markers/dist/', src: ['**', '!*.js'], dest: 'static/lib/Leaflet.awesome-markers', filter: 'isFile'}
        ]
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-db-migrate');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('build', ['requirejs:prod', 'copy:main']);
  grunt.registerTask('deploy', ['migrate:up']);
  grunt.registerTask('dev', ['concurrent']);

  // Default task(s).
  grunt.registerTask('default', ['build', 'deploy']);
};
