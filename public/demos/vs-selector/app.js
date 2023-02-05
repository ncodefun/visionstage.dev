/// DEMO
/// selectors: tabs | radio, select, checkbox/led/under-line/toggle switch, multi selections (checkboxes)
/// gallery w/ prev / next (see /vision-stage)
/// input, text-area, bare input

import { VisionStage, Component, html, cache, define, log, icon, config }
	from '/vision-stage/vision-stage.min.js'

import { cycleValueWithin, sleep, strIf, labelAsClassMapper, labelOptionsMapper }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global

// log('info', 'Updated 2022.07.29')

// Use real char for readability (vs-code will highlight these for visibility)
// thinsp:" "
// hairsp:" "

// new explicit format for options
// const opts = [
// 	{ label: ''|['en-label','fr-label'], details?: '', value?: '', class?: '' } | 'label/value'
// ]
// label string can contain implicit details with pipe separator: 'my label | more infos…'

const STATE_DEMO2_OPTIONS = [
	{ label:['Hello','Allo'], details:'(Hi !)', value:'hello' },
	{ label:['World !','Le monde !'], value:'world' },
	'again…'
]
const STATE_DEMO3_OPTIONS = [
	{ label:['Vanilla', 'Vanille'] },
	{ label:['Chocolate', 'Chocolat'], class:'disabled' },
	{ label:['Strawberry', 'Fraise'] },
	{ label:['Banana', 'Bannane'] },
]
const DEMO_TYPES = [
	{label:'default', value:''},
	{label:'led', value:'led-round'},
	'led-square', 'checkbox', 'led-bar'
]
const DEMO_COLORS = [
	'primary',
	{label:'primary-adapt', details:'subtler,<br>adapted for dark / light'},
	'blue', 'green', 'yellow', 'orange', 'red'
].map( labelAsClassMapper)

// log('pink', 'STATE_DEMO3_OPTIONS:', STATE_DEMO3_OPTIONS)

const THEMES = ['', 'yellow-green', 'yellow', 'green']

const STEPPER_DEMO_OPTS = [
	{label:['Oneeeeeeeeeeee','Un'], value: 'one'}, ['two','deux'], 'three', 'four', 'five'
].map( labelOptionsMapper)


const ICON_GRID_OPTS = [
	{icon:'pointer', value:'select'},
	{icon:'cisors', value:'cut'},
	{icon:'move', value:'move'},
	{icon:'trash', value:'delete', icon_class:'large'},
	{icon:'cisors', value:'cut'},
	{icon:'save', value:'save'},
]
// getLabel

class App extends VisionStage {

	onConnected = () => {
		//this.observed = {'Selector':['type']}
		//! DO NOT RENDER BEFORE LOADED, ELSE BINDINGS GET MESSED UP
		Component.load('vs-selector').then( async module => {
			//log('ok', 'vs-selector loaded')
			this.render()
		})
	}

	template = () => html`
		<header id='app-header' flow='row space-between' class='sth-scaling text-center'>

			<span flow='row left gaps' id='lang-bar'>
				<vs-selector id='lang-selector'
					btns-class='gaps'
					btn-class='bare uppercase tiny-bar josefin-400'
					type='underline'
					direction='horizontal'
					.options=${ this.languages }
					.selected=${ this.lang }
					@change=${ e => this.lang = e.target.selected }>
				</vs-selector>
			</span>

			<span flow='row right gaps'>

				<!-- <button id='theme-toggle' class='square bare'
					@pointerdown={ e => {
						this.bg_index = cycle( this.bg_index, BGS_RANGE)
						this.bg = BACKGROUNDS[ this.bg_index]
					}}>
					🖼️
				</button> -->

				<button id='theme-toggle' class='square bare'
					@pointerdown=${ e => {
						this.theme = cycleValueWithin( this.theme, THEMES)
					}}>
					🎨
				</button>

				<!-- /// type='cycler' | 'stepper' | 'steppers' -> can set .values instead of options and keep showing the initial content as the only label ?? (or bad idea... no signifier?)-->

				<!-- <vs-selector id='dark-comp-selector' class='bare'
					.btn_class='sun \${ this.dark_components ? 'dark' : '' }'
					.selected=\${ this.dark_components }
					@change=\${ e => this.dark_components = !this.dark_components }
					>☀️
				</vs-selector> -->

				<button id='dark-controls-toggle' class='square bare'
					@pointerdown=${ e => this.dark_components = !this.dark_components }>
					<span class='icon sun ${ this.dark_components ? 'dark':'' }'>☀️</span>
				</button>

				<button id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
					@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }>
					<span class='icon moon ${strIf('night',this.night_mode)}' shift='-1'>🌙</span>
				</button>

				<button id='fullscreen-toggle' class='square bare large'
					aria-label=${ this.$fullscreen }
					@click=${ async e => { fs.isEnabled && fs.toggle(); await sleep(100); this.render() }}
					>
					${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, '') }
				</button>
			</span>

		</header>

		${ cache( this[(this.page||'home')]() ) }

		<footer id='app-footer' class='sth-scaling rel' flow='row'>

			<button id='nav-toggle' class='square bare'
				@pointerdown=${ e => this.menu_open = !this.menu_open }
				>
				${ icon('navicon-round', 'x-large') }
			</button>

			<nav flow='row gaps-large' class='v-menu nowrap'>
				${ this.pages && this.pages.map( ([page],i) =>
					this.getPageLink( page, i < this.pages.length-1 ? '✦' : '')
				)}
			</nav>

		</footer>
	`
	home = () => html`
		<main id='home'
			class='grow text-center scroll shadow'
			flow='row baseline divide wrap gaps-small'>

			<!-- divide: > div,p,h1...,article,section, all are made full width to act as dividers -->
			<!-- while everything else flows in a flex row. Simply use empty div as a divider. -->

			<h1>&lt;vs-selector&gt;</h1>


			<button class=${ this.state_demo1===true ? 'primary' : '' }
				@click=${ e => this.state_demo1 = !this.state_demo1 }>
				State demo 1 btn
			</button>

			<vs-selector id='toggle-A'
				selected-color='primary'
				.selected=${ this.state_demo1 }
				@change=${ e => this.state_demo1 = !this.state_demo1 }
				>
				State demo 1
			</vs-selector>

			<vs-selector id='toggle-B'
				type='checkbox'
				.selected=${ this.state_demo1 }
				@change=${ e => this.state_demo1 = !this.state_demo1 }
				>
				State demo 1
			</vs-selector>

			<vs-selector id='toggle-C'
				type='led-round'
				icon-position='right'
				.selected=${ this.state_demo1 }
				@change=${ e => this.state_demo1 = !this.state_demo1 }
				>
				State demo 1
			</vs-selector>

			<vs-selector id='toggle-D'
				type='led-bar'
				.selected=${ this.state_demo1 }
				@change=${ e => this.state_demo1 = !this.state_demo1 }
				>
				State demo 1
			</vs-selector>

			<vs-selector id='toggle-E'
				type='switch'
				.selected=${ this.state_demo1 }
				@change=${ e => this.state_demo1 = !this.state_demo1 }
				>
				State demo 1
			</vs-selector>

			<div></div>

			<vs-selector id='cycler'
				type='steppers' step='1' wrap='true'
				.options=${ STEPPER_DEMO_OPTS }
				.selected=${ this.stepper_val }
				@change=${ e => this.stepper_val = e.target.selected }
				>
			</vs-selector>

			<div></div>

			<div class='inline'>
				<vs-selector id='tabs' class='tabs small-caps'
					direction='horizontal'
					type='led-bar'
					selected-color='primary-adapt'
					.options=${ STATE_DEMO2_OPTIONS }
					.selected=${ this.state_demo2 }
					@change=${ e => this.state_demo2 = e.target.selected }
					>
				</vs-selector>
				<section class='bright-bg' style='padding:1rem'>
					<section class=${strIf('hide', this.state_demo2!=='hello')}>
						Tab 1
					</section>
					<section class=${strIf('hide', this.state_demo2!=='world')}>
						Tab 2
					</section>
				</section>
			</div>

			<vs-selector id='radio-buttons'
				direction='horizontal'
				type='radio'
				.options=${ STATE_DEMO2_OPTIONS }
				.selected=${ this.state_demo2 }
				@change=${ e => this.state_demo2 = e.target.selected }
				>
			</vs-selector>

			<h3>Vertical – Foldable</h3>

			<vs-selector id='foldable-1'
				folds
				.options=${ STATE_DEMO2_OPTIONS }
				.selected=${ this.state_demo2 }
				@change=${ e => this.state_demo2 = e.target.selected }
				>
			</vs-selector>

			<vs-selector id='foldable-2'
				folds
				type='checkbox'
				selected-color='primary-adapt'
				.options=${ STATE_DEMO3_OPTIONS }
				.selected=${ this.state_demo3 }
				@change=${ e => this.state_demo3 = e.target.selected }
				>
				My prefs
			</vs-selector>

			<!-- <h3>Multiple Choices</h3> -->
			<div></div>

			<vs-selector id='MC-B'
				direction='horizontal'
				.type=${ this.demo_type }
				.options=${ STATE_DEMO3_OPTIONS }
				.selected=${ this.state_demo3 }
				@change=${ e => {
					this.state_demo3 = e.target.selected
					//log('pink','this.state_demo3 = e.target.selected')
				}}
				>
			</vs-selector>

			<div><label>[type='${ this.demo_type }']</label></div>

			<vs-selector id='demo-types'
				direction='horizontal'
				type='radio'
				icon-position='top'
				.options=${ DEMO_TYPES }
				.selected=${ this.demo_type }
				@change=${ e => this.demo_type = e.target.selected }
				>
			</vs-selector>

			<div></div>

			<vs-selector id='demo-colors' class=''
				direction='horizontal'
				type='radio'
				.options=${ DEMO_COLORS }
				>
			</vs-selector>

			<div></div>

			<!-- <vs-selector id='icon-grid' class=''
				type='grid'
				btns-class='grid-2x3'
				btn-class='square icon'
				.options=${ ICON_GRID_OPTS }
				.selected=${ this.sel_icons }
				@change=${ e => {
					let [op,last] = e.target.last_op
					if( op==='added' && last==='cut')
						this.sel_icons = ['cut'] // exlusive selection
					else
						this.sel_icons = e.target.selected
				}}
				>
			</vs-selector> -->

		</main>
	`
	about = () => html`
		<main id='about' flow='col top full' class='scroll shadow text-justify'>

		</main>

	`

	onPageChanged( page, prev){
		if( page===prev) return // only changed language (or mod url) -> using a different page.path
		this.menu_open = false
	}
}

App.languages = ['en', 'fr']

App.pages = {
	'': 		["Home", "Accueil"],
	// about: ['About', 'À propos'], // -> /#About | /#À propos
	'/vision-stage': 	['Vision Stage', 'Vision Stage'],
	'/todo': ['Todo', 'Todo'],
	'/test': ['Components', 'Composantes'],
	'/triads': ['Guitar', 'Guitare']
}

App.strings = {
	home: 			["Home", "Accueil"],
	fullscreen: 	["Fullscreen", "Plein écran"],

}

App.properties = {
	sel_icons: {
		value: ['cut','move'],
		// transformer( val){
		// 	if( val.includes('cut'))
		// 		return ['cut']
		// 	return val
		// }
	},
	theme: {
		value: '',
		attribute: ['highlight', 'auto'] // auto: remove attr if falsy value
	},
	demo_type: DEMO_TYPES[1].value,
	state_demo1: { value: true, storable:true },
	state_demo2: { value: STATE_DEMO2_OPTIONS[0].value, storable:false },
	state_demo3: {
		value: STATE_DEMO3_OPTIONS.slice(2).map( o => o.label[0]),
		storable: false,

	},
	active_object: null,
	pairs: [['test0', 'tesss 0'], ['testA', 'Test A']],
	options: {
		value: {
			colors: ['orange'],
			xmode: true,
			todo: null,
		}
	},
	dark_components: {
		value: false,
		class: 'dark-components',
		storable: true
	},
	bg_index: 0,
	bg: {
		value: '',
		attribute: 'theme-bg',
		init_watcher: true,
		watcher( val){
			this.switchClasses('has-bright-bg', 'has-dark-bg', val==='whitish')
		}
	},
	stepper_val: 'two'
}

App.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait (limit only for extreme case)
	portrait: 		.7,		// min horizontal space in portrait
	portrait_max: 	1,			// max horizontal space in portrait
	// threshold: 		1.2,
	landscape: 		1,			// min horizontal space in landscape
	landscape_max: 16/9,		// max horizontal space in landscape
	cross_margin: '1.33%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

define( 'vision-stage', App)//, ['vs-selector'])

