"use strict"; //eslint-disable-line
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const del = require("del");
const mocha = require("gulp-mocha");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const jsdoc3 = require("gulp-jsdoc3");
const path = require("path");

gulp.task("clean", () => {
  return del(["build/**/*"]);
});

gulp.task("lint", gulp.series("clean", () => {
  return gulp.src(["src/**/*.js"])
    .pipe(eslint({
      fix: true,
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}));

gulp.task("compile:publish", gulp.series("lint", () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [[
        "@babel/preset-env", {
          "targets": {
            "node": "10.15.3", //10.15.3 LTS as of 07/05/2019
          },
          "useBuiltIns": "entry",
          "corejs": "3",
        },
      ]],
      "plugins": ["@babel/plugin-proposal-object-rest-spread"],
    }))
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: process.env.NODE_ENV === "production" ? "../src/" : path.resolve(__dirname, "./src/")
    }))
    .pipe(gulp.dest("build/"));
}));
gulp.task("compile", gulp.series("lint", () => {
  return gulp.src(["src/**/*"])
    .pipe(sourcemaps.init())
    .pipe(babel({
      "presets": [[
        "@babel/preset-env", {
          "targets": {
            "node": "current",
          },
          "useBuiltIns": "entry",
          "corejs": "3",
        }],
      ], plugins: ["@babel/plugin-proposal-object-rest-spread"],
    }))
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: process.env.NODE_ENV === "production" ? "../src/" : path.resolve(__dirname, "./src/")
    }))
    .pipe(gulp.dest("build/"));
}));

gulp.task("test", gulp.series("compile", function() {
  return gulp.src("./build/tests/**/*.test.js")
    .pipe(mocha());
}));

gulp.task("doc", function(cb) {
  var config = require("./jsdoc.json");
  gulp.src(["README.md", "package.json", "./src/**/*.js"], {read: false})
    .pipe(jsdoc3(config, cb));
});

gulp.task("watch", () => {
  gulp.watch("src/**/*.*", gulp.parallel("test")) ;
});

gulp.task("default", gulp.series("test"));
