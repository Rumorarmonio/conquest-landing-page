'use strict'

const {src, dest} = require('gulp'),
    gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    cssbeautify = require('gulp-cssbeautify'),
    removeComments = require('gulp-strip-css-comments'),
    rename = require('gulp-rename'),
    rigger = require('gulp-rigger'),
    sass = require('gulp-sass')(require('sass')),
    cssnano = require('gulp-cssnano'),
    uglify = require('gulp-uglify'),
    plumber = require('gulp-plumber'),
    panini = require('panini'),
    imagemin = require('gulp-imagemin'),
    del = require('del'),
    notify = require('gulp-notify'),
    browserSync = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    ghPages = require('gulp-gh-pages'),

    /* Paths */
    srcPath = 'src/',
    distPath = 'dist/',
    path = {
        build: {
            html: distPath,
            css: distPath + 'assets/css/',
            js: distPath + 'assets/js/',
            images: distPath + 'assets/img/',
            fonts: distPath + 'assets/fonts/'
        },
        src: {
            html: srcPath + '*.html',
            css: srcPath + 'assets/sass/*.sass',
            js: srcPath + 'assets/js/*.js',
            images: srcPath + 'assets/img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
            fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}'
        },
        watch: {
            html: srcPath + '**/*.html',
            js: srcPath + 'assets/js/**/*.js',
            css: srcPath + 'assets/sass/**/*.sass',
            images: srcPath + 'assets/img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
            fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}'
        },
        clean: './' + distPath
    }

function serve() {
    browserSync.init({
        server: {
            baseDir: './' + distPath
        }
    });
}

function html() {
    panini.refresh();
    return src(path.src.html, {base: srcPath})
        .pipe(plumber())
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({stream: true}));
}

function css() {
    return src(path.src.css, {base: srcPath + 'assets/sass/'})
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: 'SASS Error!',
                    message: 'Error: <%= error.message %>'
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(cssbeautify())
        .pipe(dest(path.build.css))
        // .pipe(cssnano({
        //     zindex: false,
        //     discardComments: {
        //         removeAll: true
        //     }
        // }))
        // .pipe(removeComments())
        // .pipe(rename({
        //     suffix: '.min',
        //     extname: '.css'
        // }))
        // .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}));
}

function js() {
    return src(path.src.js, {base: srcPath + 'assets/js/'})
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: 'JS Error',
                    message: 'Error: <%= error.message %>'
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rigger())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min',
            extname: '.js'
        }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({stream: true}));
}

function images() {
    return src(path.src.images, {base: srcPath + 'assets/img/'})
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest(path.build.images))
        .pipe(browserSync.reload({stream: true}));
}

function fonts() {
    return src(path.src.fonts, {base: srcPath + 'assets/fonts/'})
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.reload({stream: true}));
}

gulp.task('deploy', function () {
    return gulp.src('./dist/**/*').pipe(ghPages());
});

function clean() {
    return del(path.clean)
}

function watchFiles() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.images], images)
    gulp.watch([path.watch.fonts], fonts)
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts))
const watch = gulp.parallel(build, watchFiles, serve)

exports.html = html
exports.css = css
exports.js = js
exports.images = images
exports.fonts = fonts
exports.clean = clean
exports.build = build
exports.watch = watch
exports.default = watch
