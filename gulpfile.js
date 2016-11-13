/**
 * Created by moritz on 05.11.16.
 */
var gulp = require('gulp'),
    del = require('del'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    environments = require('gulp-environments'),
    less = require('gulp-less'),
    sass = require('gulp-sass'),
    order = require('gulp-order'),
    htmlhint = require('gulp-htmlhint'),
    inject = require('gulp-inject'),
    bowerFiles = require('main-bower-files'),
    htmlmin = require('gulp-htmlmin'),
    ngHtml2Js = require("gulp-ng-html2js"),
    es = require('event-stream'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    cleanCss = require('gulp-clean-css');

const COMPILE_DIR = "./target/generated-resources/dist/";

var development = environments.development;
var production = environments.production;

var paths = {
    vendor: {
        css: ['vendor/todomvc-common/base.css', 'vendor/todomvc-app-css/index.css'],
        less: [],
        sass: [],
        js: ['vendor/todomvc-common/base.js', 'vendor/angular/angular.js', 'vendor/angular-route/angular-route.js', 'vendor/angular-resource/angular-resource.js']
    },
    ext_libs: {
        css: [],
        less: [],
        sass: [],
        js: []
    },
    common: {
        tpl: [],
        css: [],
        less: [],
        sass: [],
        js: []
    },
    app: {
        html: ['index.html'],
        tpl: ['js/*.tpl.html'],
        css: [],
        less: [],
        sass: [],
        js: ['js/**/app.js', 'js/**/*.js']
    }
};

var _build_app_js =  function () {
    var app_js = gulp.src(paths.app.js)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(ngAnnotate());

    var app_tpl = gulp.src(paths.app.tpl)
        .pipe(htmlhint({'doctype-first': false}))
        .pipe(htmlhint.reporter())
        .pipe(production(htmlmin({collapseWhitespace: true, removeComments: true})))
        .pipe(ngHtml2Js({moduleName: 'todomvc'}));

    return es.merge(app_js, app_tpl)
        .pipe(order(['**/app.js', '**/*.js', '**.tpl.html']))
        .pipe(development(sourcemaps.init()))
        .pipe(development(concat('app.js')))
        .pipe(production(concat('app.min.js')))
        .pipe(development(sourcemaps.write()))
        //.pipe(production(uglify()))
        .pipe(gulp.dest(COMPILE_DIR + '/js'));
};

var _build_app_styles = function () {
    return gulp.src(paths.app.sass)
        .pipe(development(sourcemaps.init()))
        .pipe(sass())
        .pipe(gulp.src(paths.app.less))
        .pipe(less())
        .pipe(gulp.src(paths.app.css))
        .pipe(development(concat("app.css")))
        .pipe(production(concat("app.min.css")))
        .pipe(development(sourcemaps.write()))
        // .pipe(order([
        //     paths.app.css,
        //     paths.app.less,
        //     paths.app.sass
        // ]))
        .pipe(production(cleanCss()))
        .pipe(gulp.dest(COMPILE_DIR + 'css'));
};

var _build_vendor_scripts = function () {
    return gulp.src(paths.vendor.js)//gulp.src(bowerFiles('**/*.js'))
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(COMPILE_DIR + 'js'));
};

var _build_vendor_styles = function () {
    return gulp.src(paths.vendor.css)
        .pipe(concat("vendor.css"))
        .pipe(gulp.dest(COMPILE_DIR + 'css'));
};

var _build_index = function () {
    var vendorScripts = _build_vendor_scripts();

    var vendorStyles = _build_vendor_styles();

    var appScripts = _build_app_js();

    var appStyles = _build_app_styles();

    return gulp.src(paths.app.html)
        .pipe(htmlhint())
        .pipe(htmlhint.reporter())
        .pipe(gulp.dest(COMPILE_DIR)) // write first to get relative path for inject
        .pipe(inject(vendorScripts, {relative: true, name: 'bower'}))
        .pipe(inject(vendorStyles, {relative: true}))
        .pipe(inject(appScripts, {relative: true}))
        .pipe(inject(appStyles, {relative: true}))
        .pipe(production(htmlmin({collapseWhitespace: true, removeComments: true})))
        .pipe(gulp.dest(COMPILE_DIR));
};

gulp.task('build', function () {
    return _build_index();
});

gulp.task('clean', function () {
    del(COMPILE_DIR);
});
