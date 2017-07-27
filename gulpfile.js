var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');


gulp.task('move', function () {
    return gulp.src(['app/*.html', 'app/images/*.*', 'app/scripts/*.*', 'app/styles/*.*'], {base: 'app/'})
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['move'], function () {
    return gulp.src('app/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});
