let preprocessor = 'sass', // Preprocessor (sass, less, styl); 'sass' also work with the Scss syntax in blocks/ folder.
		fileswatch   = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

import pkg from 'gulp'
const { gulp, src, dest, parallel, series, watch } = pkg;

import browserSync   from 'browser-sync';
import bssi          from 'browsersync-ssi';
import ssi           from 'ssi';
import webpackStream from 'webpack-stream';
import webpack       from 'webpack';
import TerserPlugin  from 'terser-webpack-plugin';
import gulpSass      from 'gulp-sass';
import dartSass      from 'sass';
import sassglob      from 'gulp-sass-glob';
const  sass          = gulpSass(dartSass);
import notify        from 'gulp-notify';
import autoprefixer  from 'autoprefixer';
import postCSS       from 'gulp-postcss';
import mqpacker      from 'css-mqpacker';
import sortCSSmq     from 'sort-css-media-queries'; 
import sourcemaps    from 'gulp-sourcemaps';
import rename      	 from 'gulp-rename';
import imagemin, {gifsicle, mozjpeg, optipng, svgo} from 'gulp-imagemin';
import changed       from 'gulp-changed';
import concat        from 'gulp-concat';
import rsync         from 'gulp-rsync';
import del           from 'del';
import smartgrid     from 'smart-grid';

// Smart grid settings
let gridSettings = {
	outputStyle: 'sass', /* less || scss || sass || styl */
	columns: 12, /* number of grid columns */
	offset: '20px', /* gutter width px || % || rem */
	mobileFirst: false, /* mobileFirst ? 'min-width' : 'max-width' */
	container: {
			maxWidth: '1256px', /* max-width оn very large screen */
			fields: '20px' /* side fields */
	},
	breakPoints: {
			lg: {
					width: '1199px', /* -> @media (max-width: 1279px) */
			},
			md: {
					width: '991px'
			},
			sm: {
					width: '767px',
					fields: '15px' /* set fields only if you want to change container.fields */
			},
			xs: {
					width: '479px'
			},
			xxs: {
					width: '321px'
			}
			/* 
			We can create any quantity of break points.

			some_name: {
					width: 'Npx',
					fields: 'N(px|%|rem)',
					offset: 'N(px|%|rem)'
			}
			*/
	}
};

async function smartGrid() {
	return smartgrid('app/styles/sass', gridSettings);
} // command - gulp smartGrid

function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'app/',
			middleware: bssi({ baseDir: 'app/', ext: '.html' })
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
		// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
	});
}

function scripts() {
	return src(['app/js/*.js', '!app/js/*.min.js'])
		.pipe(webpackStream({
			mode: 'production',
			performance: { hints: false },
			plugins: [
				new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', 'window.jQuery': 'jquery' }), // jQuery (npm i jquery)
			],
			module: {
				rules: [
					{
						test: /\.m?js$/,
						exclude: /(node_modules)/,
						use: {
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
								plugins: ['babel-plugin-root-import']
							}
						}
					}
				]
			},
			optimization: {
				minimize: true,
				minimizer: [
					new TerserPlugin({
						terserOptions: { format: { comments: false } },
						extractComments: false
					})
				]
			},
		}, webpack)).on('error', function handleError() {
			this.emit('end')
		})
		.pipe(concat('app.min.js'))
		.pipe(dest('app/js'))
		.pipe(browserSync.stream());
}

function styles() {
	let plugins = [
		autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }),
		mqpacker({
			sort: sortCSSmq.desktopFirst
		})
	];
	return src([`app/styles/${preprocessor}/*.*`, `!app/styles/${preprocessor}/_*.*`])
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(eval(`${preprocessor}glob`)())
	.pipe(eval(preprocessor)({outputStyle: 'compressed'}))
	.on("error", notify.onError({
		message: "Error: <%= error.message %>",
		title: "Error running something"
	}))
	.pipe(postCSS(plugins))
	.pipe(rename({ suffix: ".min" }))
	.pipe(sourcemaps.write('.'))
	.pipe(dest('app/css'))
	.pipe(browserSync.stream());
}

function images() {
	return src(['app/images/src/**/*'])
		.pipe(changed('app/images/dist'))
		.pipe(imagemin([
			gifsicle({interlaced: true}),
			mozjpeg({quality: 80, progressive: true}),
			optipng({optimizationLevel: 5}),
			svgo({
				plugins: [
					{
						name: 'removeViewBox',
						active: false
					},
					{
						name: 'cleanupIDs',
						active: false
					}
				]
			})
		]))
		.pipe(dest('app/images/dist'))
		.pipe(browserSync.stream());
}

function buildcopy() {
	return src([
		'{app/js,app/css}/*.min.*',
		'!app/css/main.min.css.map',
		'app/images/**/*.*',
		'!app/images/src/**/*',
		'app/fonts/**/*'
	], { base: 'app/' })
	.pipe(dest('dist'));
}

async function buildhtml() {
	let includes = new ssi('app/', 'dist/', '/**/*.html')
	includes.compile()
	del('dist/parts', { force: true });
}

async function cleandist() {
	del('dist/**/*', { force: true });
}

async function cleanimages() {
	return del('app/images/dist/**/*', { force: true });
}

function deploy() {
	return src('dist/')
		.pipe(rsync({
			root: 'dist/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			// clean: true, // Mirror copy with file deletion
			include: [/* '*.htaccess' */], // Included files to deploy,
			exclude: [ '**/Thumbs.db', '**/*.DS_Store' ],
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}));
}

function startwatch() {
	watch(`app/styles/${preprocessor}/**/*`, { usePolling: true }, styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts);
	watch('app/images/src/**/*', { usePolling: true }, images)
	watch(`app/**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload);
}

export { scripts, styles, images, deploy, cleandist, cleanimages, smartGrid};
export let assets = series(scripts, styles, images);
export let build = series(cleandist, images, scripts, styles, buildcopy, buildhtml);
export default series(scripts, styles, images, parallel(browsersync, startwatch));
