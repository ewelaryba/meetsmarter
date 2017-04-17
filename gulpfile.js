
var S3 = require('gulp-s3-upload');
var clean = require('gulp-clean');
var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');
var rev = require('gulp-rev');
var revReplace = require("gulp-rev-replace");
var runSequence = require('run-sequence');

// Minify compiled CSS
gulp.task('minify-css', function() {
  return gulp.src('less/grayscale.less')
        .pipe(less())
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('tmp'));
});

// Minify JS
gulp.task('minify-js', function() {
    return gulp.src('grayscale.js')
        .pipe(uglify())
        .pipe(gulp.dest('tmp/js'));
});

// Copy vendor libraries from /node_modules into /vendor
gulp.task('copy', function() {
    gulp.src(['node_modules/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('./tmp/vendor/bootstrap'))

    gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('tmp/vendor/jquery'))

    gulp.src([
            'node_modules/font-awesome/**',
            '!node_modules/font-awesome/**/*.map',
            '!node_modules/font-awesome/.npmignore',
            '!node_modules/font-awesome/*.txt',
            '!node_modules/font-awesome/*.md',
            '!node_modules/font-awesome/*.json'
        ])
        .pipe(gulp.dest('tmp/vendor/font-awesome'));

    gulp.src(['tmp/vendor/**/*'])
        .pipe(gulp.dest('build/vendor'))

    gulp.src(['img/**'])
            .pipe(gulp.dest('build/img'))

    gulp.src(['tmp/*'])
    .pipe(rev())
    .pipe(gulp.dest('build'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('build'));

    gulp.src('index.html')
    .pipe(revReplace({manifest: gulp.src("./build/rev-manifest.json") }))
    .pipe(gulp.dest('build/'))

});

gulp.task("upload", function() {
  var s3 = S3({useIAM:true});

  var longLiveResourceDate = new Date();
  longLiveResourceDate.setUTCFullYear(2020);

    gulp.src("./build/**")
        .pipe(s3({
            Bucket: 'meetsmartr', //  Required
            ACL:    'public-read' ,
            uploadNewFilesOnly: false,
            maps: {
                Expires: function(keyname) {
                     return new Date();
                }
            }
        }, {
            Region: 'us-west-2',
            maxRetries: 5
        }))
    ;
});

// Run everything
gulp.task('default', () => {
   runSequence('minify-css', 'minify-js', 'copy', () => {
     console.log('built output');
   });
});

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: './build'
        },
    })
})

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'default'], function() {
    gulp.watch('css/*.css', 'default', browserSync.reload);
    gulp.watch('js/*.js', 'default', browserSync.reload);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('*.html', browserSync.reload);
    gulp.watch('js/**/*.js', browserSync.reload);
});
