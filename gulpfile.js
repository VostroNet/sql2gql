"use strict"; //eslint-disable-line
require("babel-core/register");
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const del = require("del");
const mocha = require("gulp-mocha");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");

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

gulp.task("compile", ["lint"], () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({}))
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: "../src/"}))
    .pipe(gulp.dest("build/"));
});

gulp.task("test", ["compile"], function() {
  return gulp.src("./build/tests/**/*.test.js")
    .pipe(mocha());
});


gulp.task("watch", () => {
  gulp.watch("src/**/*.*", ["test"]);
});

gulp.task("default", ["test"]);
