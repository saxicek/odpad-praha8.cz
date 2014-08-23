module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      options: {
        baseUrl: 'src/js',
        mainConfigFile: 'src/js/containers.js',
        name: '../../bower_components/requirejs/require',
        include: 'containers',
        out: 'static/js/containers.js',
        wrap: true
      },
      production: {
      },
      development: {
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
      js: {
        files: [
          'bin/**/*.js',
          'config/*.js',
          'migrations/*.js',
          'test/**/*.js',
          '*.js',
          'src/js/**/*.js'
        ],
        tasks: [
          'mochaTest',
          'jshint',
          'requirejs:development'
        ]
      }
    },
    jshint: {
      server: [
        'bin/**/*.js',
        'config/*.js',
        'migrations/*.js',
        'test/**/*.js',
        'Gruntfile.js',
        'server.js'
      ],
      client: [
        'src/js/**/*.js'
      ]
    },
    // Configure a mochaTest task
    mochaTest: {
      test: {
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

  grunt.registerTask('build', ['requirejs:production']);
  grunt.registerTask('deploy', ['migrate:up']);

  // Default task(s).
  grunt.registerTask('default', ['build', 'deploy']);
};
