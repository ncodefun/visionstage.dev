import { VisionStage, html, cache, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { cycleValueWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global

class App extends VisionStage {

	onConnected = () => this.render()

	template = () => html`
		<!-- Lang btns in the middle -->
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
					@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }>
					<span class='icon moon ${strIf('night',this.night_mode)}' shift='-1'>🌙</span>
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

		<section id='app-content' class='rel' flow='col top stretch grow'>
			<!-- <vs-modal type='full'></vs-modal> -->
			${ this.page !== null && cache( this[ this.page||'home' ]() ) }
		</section>

		<!-- footer pages nav -->
		<footer id='app-footer' flow='row' class='sth-scaling rel'>

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
		<main id='home' class='text-center rel' flow='col top full'>
			<h1>Vision <small>✦</small> Stage</h1>
		</main>
	`

	onPageChanged( page, prev){
		this.menu_open = false // for normal-type apps
		// if (!page) this.show_menu = true // for game-type apps (asking to chose a scene/page)
	}
}

App.languages = ['en', 'fr']

App.pages = {
	'': 		["Home", "Accueil"],
}

App.aspects = {
	// Below the 'portrait' aspect ratio,
	// the vertical space (rem) is extended
	// as the content now scales to fit width.
	// This v-extension can be limited by portrait_min,
	// which will look weird; i.e. not recommended…

	// portrait_min: 	.37,	// max vertical space in portrait
	portrait: 		.6,		// min horizontal space in portrait
	portrait_max: 	.6,		// max horizontal space in portrait
	landscape: 		4/3,		// min horizontal space in landscape
	landscape_max: 1.85,		// max horizontal space in landscape
	threshold: 		1.2,
	cross_margin: '1.23%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

App.sounds = [
	// Note: volume will jump if multiple sounds with different volumes
	// are played at the same time…
	['good',		'/_assets/sounds/good.wav'],
	['wrong',	'/_assets/sounds/wrong.wav', { volume:.6 }],
	['win',		'/_assets/sounds/win.mp3'],
]

App.strings = {
	title: ['Boilerplate', 'Gabarit']
}

App.properties = {

}

define( 'vision-stage', App, [], { /*sw:'/sw.js'*/ })