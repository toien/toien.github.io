var gulp = require('gulp');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var del = require('del');
var hash = require('gulp-hash-filename');
var uglify = require('gulp-uglify');


gulp.task('css', function() {
	del('public/dist/*.min.css');

	var result = gulp.src(['public/css/poole.css', 'public/css/hyde.css', 'public/css/syntax.css'])
		.pipe(cleanCSS({
			compatibility: 'ie8'
		}))
		.pipe(concat('style.css'))
		.pipe(hash({
			"format": "{name}.{hash:5}.min{ext}"
		}))
		.pipe(gulp.dest('public/dist'));

	return result;
});

gulp.task('js', function() {
	del('public/dist/*.min.js');

	var result = gulp.src(['public/js/post.js'])
		.pipe(uglify())
		.pipe(hash({
			"format": "{name}.{hash:5}.min{ext}"
		}))
		.pipe(gulp.dest('public/dist'));

	return result;
});