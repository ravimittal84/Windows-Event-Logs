var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');

gulp.task('minify', function() {
    return gulp.src('app/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['minify'], function () {
    return gulp.src(['app/*.html', 'app/*.css'])
        .pipe(gulp.dest('dist'));
});