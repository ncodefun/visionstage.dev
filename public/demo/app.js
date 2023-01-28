import { VisionStage, html, cache, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { cycleWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global
const NIGHT_MODES = [0,1,2]

class App extends VisionStage {

	// constructor(){
	// 	super()
	// 	this.registerSW()
	// }

	onConnected = () => this.render()
	onFirstRendered(){}
	onRendered(){}
	onResized(){}
	onPageChanged( page, prev){
		//log('info', 'page:', page, this.params)
		if( page===prev) return // just changed language
		if( this.params)
			for( let [p,val] of this.params){
				if( p in this && val){
					//log('check', 'set hash param on this:', p)
					this[ p] = val
				}
			}
		this.menu_open = false
	}

	// App template
	template = () => html`
		<header id='app-header' class='sth-scaling lang-center'>

			<span></span>

			<span flow='row gaps' id='lang-bar'>
				<span class='equal-deco'> = </span>
				${ this.languages.map( (lang,i) => html`
					<button
						@pointerdown=${ e => this.lang = lang }
						class='bare uppercase underline josefin-400 ${ strIf('selected', this.lang === lang) }'
						>
						${ lang.toUpperCase() }
					</button>
					<span class='equal-deco'> = </span>
				`)}
			</span>

			<span flow='row right gaps'>

				<button id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
					@pointerdown=${ e => this.night_mode = cycleWithin(NIGHT_MODES, this.night_mode) }>
					<span class='icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
				</button>

				<button id='fullscreen-toggle'
					class='square bare'
					aria-label=${ this.$fullscreen }
					@click=${ async e => { fs.isEnabled && fs.toggle() ; await sleep(100) ; this.render() } }
					>
					${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'large') }
				</button>

			</span>

		</header>

		${ this.page!==null && cache( this[(this.page||'home')]() ) }

		<footer id='app-footer' flow='row' class='sth-scaling rel'>

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

		</footer>
	`
	// Virtual pages templates
	home = () => html`
		<main id='home' class=' rel scroll' flow='col top full'>

			<h1>Vision <small>✦</small> Stage</h1>
			<div id='tagline'>— <em class='strong'>${ this.$tagline }</em> —</div>

			<h2>Here's how simple it is</h2>

			<div flow='row top space-evenly'>

				<div class='card scroll'>
					<h3>Files structure</h3>

				</div>

				<div class='card scroll'>
					<h3>App code</h3>
					<figure id='demo-js'><img src='demo-js.png' alt='code overview'></figure>
				</div>

			</div>




		</main>
	`
}

App.languages = ['en', 'fr']

App.pages = {
	'': 		["Home", "Accueil"],
}

App.strings = {
	tagline: ['The Intuitive Web Framework', 'Le framework Web intuitif'],
}

App.properties = {
	dark_mode: {
		value: 0, // unset = user pref; once set is cycling 1,2,3 ->
		attribute: ['night-mode', 'auto'],
		watcher( val){ document.body.classList.toggle('night-mode', val===2)}
	},
	menu_open: { value: false, class: 'menu-open'},
}

App.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait (limit only for extreme case)
	portrait: 		.6,		// min horizontal space in portrait
	portrait_max: 	.6,		// max horizontal space in portrait
	landscape: 		4/3,		// min horizontal space in landscape
	landscape_max: 1.85,		// max horizontal space in landscape
	threshold: 		1.2,
	cross_margin: '1.23%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

define( 'vision-stage', App)