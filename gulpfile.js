var gulp = require('gulp'),
    concat = require('gulp-concat'),
    typescript = require('gulp-typescript');

gulp.task('default', function(){
  return gulp.src(['**/*.ts', '!node_modules/**/*.*'])
        .pipe(typescript({
            noImplicitAny: true
        }))
        .pipe(gulp.dest('bin'));
});