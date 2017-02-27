"use strict";

module.exports = function (grunt) {

	grunt.initConfig({
		// read in the project settings from the package.json file into the pkg property
		pkg: grunt.file.readJSON("package.json"),
		dirs: {
			// input
			scripts: "scripts",

			// output
			js: "app/js",
			css: "app/css",
			templates: "app/templates"
		},
		concat: {
			app: {
				src: [
					"<%= dirs.scripts %>/**/*.js",
					"<%= dirs.templates %>/templates.js"
				],
				dest: "<%= dirs.js %>/app.js",
				nonull: true
			},
			appCss: {
				src: "<%= dirs.styles %>/**/*.css",
				dest: "<%= dirs.css %>/site.css",
				nonull: true
			}
		},
		html2js: {
			options: {
				base: "app",
				module: "application.templates",
				// add angular dependency on `application.templates`
				singleModule: true,
				standalone: true,
				useStrict: true,
				rename: function (moduleName) {
					return moduleName.substring(moduleName.lastIndexOf("/") + 1, moduleName.length);
				}
			},
			main: {
				src: ["<%= dirs.scripts %>/**/*.html"],
				dest: "<%= dirs.templates %>/templates.js"
			}
		},
		ngAnnotate: {
			options: {
				singleQuotes: false
			},
			app: {
				files: {
					"<%= dirs.js %>/app.js": ["<%= dirs.js %>/app.js"]
				}
			}
		},
		uglify: {
			options: {
				compress: {
					properties: true,
					drop_console: true
				},
				maxLineLen: 5000
			},
			app: {
				options: {
					sourceMap: true,
					sourceMapIncludeSources: false
				},
				files: {
					"<%= dirs.js %>/app.min.js": ["<%= dirs.js %>/app.js"]
				}
			}
		},
		cssmin: {
			options: {
				shorthandCompacting: false,
				roundingPrecision: -1
			},
			target: {
				files: {
					"<%= dirs.css %>/site.min.css": ["<%= dirs.css %>/site.css"],
				}
			}
		},
		clean: {
			options: {
				"force": true,
				"no-write": false
			},
			css: ["<%= dirs.css %>/*"],
			js: ["<%= dirs.js %>/*"],
			templates: ["<%= dirs.templates %>/"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-html2js");
	grunt.loadNpmTasks("grunt-angular-templates");
	grunt.loadNpmTasks("grunt-ng-annotate");
	grunt.loadNpmTasks("grunt-karma");

	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");

	grunt.registerTask("shared", ["html2js", "concat"]);

	grunt.registerTask("Q-System", ["shared"]);
	grunt.registerTask("P-System", ["shared", "ngAnnotate", "cssmin", "uglify"]);

	grunt.registerTask("default", ["shared"]);
	grunt.registerTask("watchfiles", ["shared", "watch"]);
	grunt.registerTask("buildall", ["shared", "cssmin", "uglify"]);

	grunt.registerTask("test", ["cssmin"]);
};
