'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')(),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    runSequence = require('run-sequence'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch'),
    replace = require('gulp-replace'),
    insert = require('gulp-insert'),
    newer = require('gulp-newer'),
    add = require('gulp-add'),
    rename = require("gulp-rename"),
    plumber = require('gulp-plumber'),
    rimraf = require('rimraf'),
    uglify = require('gulp-uglify'),
    autoprefixer = require('gulp-autoprefixer'),
    file = require('gulp-file'),
    lazypipe = require('lazypipe'),
    notify = require("gulp-notify");
//------------------------------------------
// Paths To Resources
//------------------------------------------
var paths = {
    javascriptFilesPath: './src/*.js'
};

// destinations for resources npm install --save critical
var dest = {
    dist: 'dist'
};

var files = {
    script: 'popup-handler.js',
    script_min: 'popup-handler.min.js'
};

gulp.task('scripts:concat', function () {
    return gulp.src(paths.javascriptFilesPath)
               .pipe(sourcemaps.init())
               .pipe(concat(files.script))
               .pipe(sourcemaps.write())
               .pipe(notify({
                   message: "Generated file: <%= file.relative %>",
               }))
               .pipe(gulp.dest(dest.dist));
});
gulp.task('scripts:minify', ['scripts:concat'], function () {
    return gulp.src(dest.dist + '/' + files.script)
               .pipe(uglify())
               .pipe(rename(files.script_min))
               .pipe(gulp.dest(dest.dist));

});

//------------------------------------------
// Clean up dist and temporary
//------------------------------------------
gulp.task('clean', function ( cb ) {
    return rimraf(dest.dist, cb);
});

//------------------------------------------
// Build Operations
//------------------------------------------

gulp.task('build', ['clean'], function ( cb ) {
    return runSequence(
        'scripts:minify',
        cb
    );
});

//------------------------------------------
// Watch Operations
//------------------------------------------
gulp.task('default', function () {
    gulp.start('watch');
});

gulp.task('watch', ['clean'], function ( cb ) {

    gulp.start('scripts:concat');

    // Generate js list(add or remove file)
    watch([paths.javascriptFilesPath, './js/*.js'], function ( events ) {
        if ( 'add' === events.event || 'unlink' === events.event || 'change' === events.event ) {
            return runSequence(
                'scripts:concat'
            );
        }
    });

});


