/// DEMO
/// selectors: tabs | radio, select, checkbox/led/under-line/toggle switch, multi selections (checkboxes)
/// gallery w/ prev / next (see /vision-stage)
/// input, text-area, bare input

import { VisionStage, Component, html, cache, define, log, icon, labelAsClassMapper }
	from '/vision-stage/vision-stage.min.js'

import { cycleWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global


log('info', 'Updated 2022.07.29')
/// thinsp:" "
/// hairsp:" "

//! no divs warppers, just <br>??
//! no html in label / details, use array: how to create (br) from arr in template?
// new explicit format for options
// const opts = [
// 	{ label: '', detail: '', value: '', class: '' }
// ]

const NIGHT_MODES = [0,1,2]

const BACKGROUNDS = ['magic-purple', 'whitish']
// const BGS_RANGE = range(0, BACKGROUNDS.length-1)
// log('pink', 'BG_RANGE:', BGS_RANGE)
// let active = {title:'Active!'}

// const NIGHT_MODES_OPTIONS = [
// 	{value:0, label:'🌙', class:'icon moon shift-up-1'},
// 	{value:1, class:'icon moon shift-up-1 night'}, // idem
// 	{value:2, class:'icon moon shift-up-1 night'}
// ]
// 				<vs-selector id='night-mode-toggle' class='square bare'
// 					type='stepper'
// 					.selected=${  }
// 					.options=${ NIGHT_MODES_OPTIONS }
// 					>
// 				</vs-selector>

const STATE_DEMO2_OPTIONS = [
	{ label:['Hello','Allo'], detail:'(Hi !)', value:'hello' },
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
	{label:'default', value:''}, {label:'led', value:'led-round'}, 'led-square', 'checkbox', 'led-bar'
]
const DEMO_COLORS = [
	'primary',
	{label:'primary-adapt', detail:'subtler,<br>adapted for dark / light'},
	'blue', 'green', 'yellow', 'orange', 'red'
].map( labelAsClassMapper)

// log('pink', 'STATE_DEMO3_OPTIONS:', STATE_DEMO3_OPTIONS)

// const THEMES = [
// 	['',0], ['yellow-green',1], ['yellow',2], ['green',3]
// ]

// pre-contruct options object to use values in cycler (prop().nextIn())
const STEPPER_DEMO_OPTS = [
	{label:['Oneeeeeeeeeeee','Un'], value: 'one'}, 'two', 'three', 'four', 'five'
]

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

	template = () => {
		return html`
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


				<!-- <button id='theme-toggle' class='square bare'
					@pointerdown={ e => {
						this.theme_index = cycle( this.theme_index, THEMES.values)
						this.theme = THEMES.labels[ this.theme_index]
					}}>
					🎨
				</button> -->

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
					@pointerdown=${ e => this.night_mode = cycleWithin(NIGHT_MODES, this.night_mode) }>
					<span class='icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
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
					this.pageLink( page, i < this.pages.length-1 ? '✦' : '')
				)}
			</nav>

		</footer>`}

	home = () => html`
		<main id='home'
			class='grow text-center scroll shadow'
			flow='row baseline divide wrap gaps-small'>

			<h1>&lt;vs-selector&gt;</h1>

			<!-- <button
				class={ this.active_object ? 'primary' : '' }
				@click={ e => this.prop('active_object').toggleSelect( active) /** toggleSelect is a helper method on prop() returned object -> set or unset active{} as active_object and render */ }
				>
				toggle
			</button>
			<span>
				{ maybe(this.active_object).title || 'inactive' }
			</span>

			<div></div> -->



			<!-- range slider -->
			<!-- num input -->
			<!-- text input (subtype='email|password') -->

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

			<!-- <h2>With Options</h2> -->

			<!-- <h3>Horizontal – Tabs / Radio buttons</h3> -->

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
		if( page===prev) return // only changed language -> different page.path
		//log('info', 'page:', page, this.params)

		if( this.params)
		for( let [p,val] of this.params){
			if( p in this && val){
				//log('check', 'set hash param on this:', p)
				this[ p] = val
			}
		}

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
	theme_index: 0,
	theme: {
		value: '',
		attribute: 'highlight'
	},
	demo_type: DEMO_TYPES[1].value,
	state_demo1: { value: false, storable:true },
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

