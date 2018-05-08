"use strict"; //eslint-disable-line
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const del = require("del");
const mocha = require("gulp-mocha");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const jsdoc3 = require("gulp-jsdoc3");

gulp.task("clean", () => {
  return del(["build/**/*"]);
});

gulp.task("lint", ["clean"], () => {
  return gulp.src(["src/**/*.js"])
    .pipe(eslint({
      fix: true,
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task("compile:publish", ["lint"], () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [[
        "@babel/preset-env", {
          "targets": {
            "node": "8.9.4", //8.9.4 LTS as of 17/01/2018
          },
          "useBuiltIns": "usage",
        },
      ]],
      "plugins": ["@babel/plugin-proposal-object-rest-spread"],
    }))
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: "../src/"}))
    .pipe(gulp.dest("build/"));
});
gulp.task("compile", ["lint"], () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [[
        "@babel/preset-env", {
          "targets": {
            "node": "current",
          },
          "useBuiltIns": "usage",
        }],
      ], plugins: ["@babel/plugin-proposal-object-rest-spread"],
    }))
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: "../src/"}))
    .pipe(gulp.dest("build/"));
});

gulp.task("test", ["compile"], function() {
  return gulp.src("./build/tests/**/*.test.js")
    .pipe(mocha());
});

gulp.task("doc", function(cb) {
  var config = require("./jsdoc.json");
  gulp.src(["README.md", "package.json", "./src/**/*.js"], {read: false})
    .pipe(jsdoc3(config, cb));
});

gulp.task("watch", () => {
  gulp.watch("src/**/*.*", ["test"]);
});

gulp.task("default", ["test"]);
