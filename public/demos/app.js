import { VisionStage as VS, html, cache, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { cycleValueWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = window.screenfull // embeded / global
const config = VS.config // for read only

class App extends VS {

	onConnected = () => this.render()

	template = () => html`
		<!-- Lang btns in the middle -->
		<header id='app-header' flow='row space-between' class='alt-scaling text-center'>

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

				<button id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
					@pointerdown=${ e =>
						this.night_mode = cycleValueWithin(this.night_mode, config.night_modes)
					}>
					<span class='icon moon ${ strIf('night',this.night_mode) }' shift='-1'>🌙</span>
				</button>

				<button id='fullscreen-toggle'
					class='square bare'
					aria-label=${ this.$fullscreen }
					@click=${ async e => { fs.isEnabled && fs.toggle() ; sleep(100) ; this.render() } }
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
		<footer id='app-footer' flow='row' class='alt-scaling rel'>

			<button id='nav-toggle' class='square bare'
				@click=${ e => this.show_menu = !this.show_menu }
				>
				${ icon('navicon-round', 'x-large') }
			</button>

			<nav flow='row gaps-large' class='v-menu nowrap'>
				${ this.pages && this.pages.map( ([page],i) =>
					// page !== this.page &&
					this.getPageLink( page, i < this.pages.length-1 ? '✦' : '')
				)}
			</nav>

		</footer>
	`

	home = () => html`
		<main id='home' class='text-center rel' flow='col top full'>
			<h1>Vision <small>✦</small> Stage</h1>

			<textarea name='' id='' cols='30' rows='10'></textarea>
		</main>
	`

	onPageChanged( page, prev){
		this.show_menu = false // for normal-type apps
		// if (!page) this.show_menu = true // for game-type apps (asking to chose a scene/page)
	}
}

VS.config = {
	// sw:'/my-app/sw.js'
}

VS.aspects = {
	portrait_alt: .5,
	portrait: 		.6,
	landscape: 		4/3,
	landscape_max: 1.85,
	threshold: 		1.2,
	cross_margin: '1.23%',
}

VS.sounds = {
	// good: 'good.wav',
	// wrong: ['wrong.wav', { volume: 0.6 }],
	// win:	'win.mp3',
}

VS.languages = ['en', 'fr']

VS.pages = {
	'': 					["Home", "Accueil"],
	'./todo':			["Todo", "Tâches"],
	'./game':			["Game", "Jeu"],
	'./vs-selector': 	["vs-selector"],
	'./guitar-vision':["Guitar Vision"],
}

VS.strings = {
	title: ['Demos', 'Démos'],
}

VS.properties = {
	one: {
		value: null,
		storable: true,
		watcher(){

		},


	}
}


define('vision-stage', App, [])