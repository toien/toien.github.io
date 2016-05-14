var gulp = require('gulp');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var del = require('del');

gulp.task('css', function() {
	var result = gulp.src(['public/css/poole.css', 'public/css/hyde.css', 'public/css/syntax.css'])
		.pipe(cleanCSS({
			compatibility: 'ie8'
		}))
		.pipe(concat('style.min.css'))
		.pipe(gulp.dest('public/dist'));

	del(['public/dist/*', '!public/dist/*.min.css']);
	return result;
});