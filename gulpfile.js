"use strict"; //eslint-disable-line
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const del = require("del");
const jest = require("gulp-jest").default;
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const jsdoc3 = require("gulp-jsdoc3");
const path = require("path");

const jestConfig = require("./jest.config");

gulp.task("clean", () => {
  return del(["lib/**/*"]);
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
      plugins: [
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-proposal-class-properties",
      ],
    }))
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: process.env.NODE_ENV === "production" ? "../src/" : path.resolve(__dirname, "./src/")
    }))
    .pipe(gulp.dest("lib/"));
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
      ],
      plugins: [
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-proposal-class-properties",
      ],
    }))
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: process.env.NODE_ENV === "production" ? "../src/" : path.resolve(__dirname, "./src/")
    }))
    .pipe(gulp.dest("lib/"));
}));

gulp.task("test", function() {
  process.env.NODE_ENV = "test";
  return gulp.src("__tests__")
    .pipe(jest(jestConfig));
});

gulp.task("doc", function(cb) {
  var config = require("./jsdoc.json");
  gulp.src(["README.md", "package.json", "./src/**/*.js"], {read: false})
    .pipe(jsdoc3(config, cb));
});

gulp.task("watch", () => {
  gulp.watch("src/**/*.*", gulp.parallel("compile"));
});

gulp.task("default", gulp.series("compile"));
