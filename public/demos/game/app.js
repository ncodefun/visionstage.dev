import { VisionStage, html, cache, define, log, icon, useSVG }
	from '/vision-stage/vision-stage.min.js'

import { q, qAll, cycleValueWithin, sleep, strIf, range, nextFrame, tempClass, snap }
	from '/vision-stage/utils.js'

// import { data } from './data.js'

const fs = screenfull // embeded script / global

log('info', 'Updated 2022.xx.xx')

// thinsp:" "
// hairsp:" "

const NIGHT_MODES = [0,1]

class App extends VisionStage {

	onConnected = () => this.render()

	onPageChanged( page, prev){
		// log('info', 'onPageChanged; page, params:', page, this.params)
		if( page===prev){
			return // only changed language -> different page.path
		}

		if( this.params)
			for( let [p,val] of this.params){
				if( p in this && val){
					//log('check', 'set hash param on this:', p)
					this[ p] = val
				}
			}

		if( page){
			log('ok', 'page:', page)
		}
		else {
			log('notok', 'no page')
			this.show_menu = true
		}
	}

	// onFirstRendered = () =>
	// onRendered = () =>
	// onResized = () =>

	// Templates -----------------------------------------------


	template = () => html`
		<header id='app-header' flow='row space-between' class='sth-scaling text-center'>

			<span
				id='lang-bar'
				flow='row left gaps'
				class='fadable ${ strIf('faded', !this.show_settings) }'
				>
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

			<span id='title' flow='col top'>

				<h1>${ this.$title }</h1>

				<button
					id='page-btn'
					class='abs bare ${ strIf('fade', this.show_menu || this.show_settings) }'
					title=${ this.$menu }
					@pointerdown=${ e => {
						//if (!this.show_settings)
							this.show_menu = !this.show_menu
						log('pink', 'hello')
					}}
					>
					<div>${ this.pages && this.getPage( this.page).title }</div>
					${ useSVG('fanion','fanion layer', 'none') }
				</button>

				<!-- <button id='close-settings-btn'
					class='abs bare square ${ strIf('hide', !this.show_settings) }'
					>
					<span class='vs-icon x-large'>✖</span>
				</button> -->

				<nav
					flow='col'
					class='abs ${ strIf('show', this.show_menu) }'
					@click=${ e => {
						//log('ok', 'e.target', e.target)
						// will have page defined if button
						// otherwise: we clicked nav bg -> only close if !!page
						if (e.target.classList.contains('button') || this.page){
							this.show_menu = false
						}
					}}
					>
					${ this.pages && this.pages.map( ([page_name],i) => {
						let p = this.getPage( page_name) // only page (sub)obj for current lang
						return html`
							<a href=${ '#' + p.path }
								class='button ${ strIf('selected', page_name === this.page) }'
								>
								<span>${ p.title }</span>
								${ useSVG('fanion','fanion layer', 'none') }
							</a>
						`
					})}
				</nav>
			</span>

			<span flow='row right gaps'>

				<button
					id='night-mode-toggle'
					class='square bare fadable ${ strIf('faded', !this.show_settings) }'
					title=${ this.$night_mode }
					@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }
					>
					<span class='shift-icon icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
				</button>

				<button
					id='fullscreen-toggle'
					class='square bare fadable ${ strIf('faded', !this.show_settings) }'
					title=${ this.$fullscreen }
					@pointerdown=${ async e => {
						fs.isEnabled && fs.toggle();
						await sleep(100);
						this.render()
					}}
					>
					${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'x-large') }
				</button>

				<button
					id='settings-btn'
					class='square bare'
					title=${ this.$settings }
					@pointerdown=${ e => {
						if (!this.show_menu)
							this.show_settings = !this.show_settings
					}}
					>
					${ this.show_settings ?
						html`<span class='vs-icon x-large rel shift-down-2 fade-in'>✖</span>` :
						icon('navicon-round', 'xx-large fade-in')
					}
				</button>

			</span>

		</header>

		<div id='veil'
			class='layer ${ strIf('show', this.show_menu || this.show_settings) }'
			@pointerdown=${ e => {
				if (this.page && this.show_menu)
					this.show_menu = false
			}}>
		</div>

		${ this.show_settings ? this.settingsTemplate() : null }

		<!-- \${ this.page && cache( this[ this.page ]() )  /** a different template for each page */} -->
		${ this.page && this.mainTemplate() }

	`

	settingsTemplate = () => html`
		<aside id='settings' class='layer' flow='col top'>

			<div style='margin: auto;' class='darker'>
				<h2>Connexion</h2>
				<div class='frame' id='connection' flow='row gaps'>
					<input type='email' id='user-email'
						placeholder='email'>
					<input type='password' id='user-password'
						placeholder='password'>
				</div>
			</div>

			<div style='margin: auto;' class='darker'>
				<h2>Réglages</h2>
				<p>...</p>
			</div>
			<div style='margin-top: auto;'>
				<div flow='row gaps'>
					<p class='frame'>Développement&thinsp;: <a href='mailto:ncode.fun@gmail.com'>José Roux</a></p>
				</div>
			</div>
		</aside>
	`

	mainTemplate = () => html`
		<main flow='col space-between' class='grow ${ strIf('veiled', this.show_menu || this.show_settings) }'>
			<h2>${ this.getPage( this.page).title }</h2>
			<p>Hello </p>

		</main>
	`
}

App.languages = ['en', 'fr']

App.pages = {
	'one': 		["Page One", "Page un"],
	'two': 		["Page Two", "Page deux"],
	// about: ['About', 'À propos'], // -> /#About | /#À propos
	// '/vision-stage': 	['Vision Stage', 'Vision Stage'],
}

App.strings = {
	home: 			["Home", "Accueil"],
	fullscreen: 	["Fullscreen", "Plein écran"],
	title: ["MODEL", "MODÈLE"],
	settings: ["Settings","Réglages"],
	menu: ["Menu","Menu"],
	next_page: ["Next game","Jeu suivant"],
}

App.properties = {
	show_menu: false,
	show_settings: {
		value: false,
		async watcher( val){
			if( val && !this.settings_first_focusable){
				this.settings_first_focusable = q('#lang-bar button:first-of-type')
				await sleep(0)
				this.settings_last_focusable = q('#settings > div:last-child > div > p:last-child a')
				//log('purple', 'first, last:', this.settings_first_focusable, this.settings_last_focusable)
			}
		}
	},

}

App.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait (limit only for extreme case)
	portrait: 		.5,		// min horizontal space in portrait
	portrait_max: 	.65,		// max horizontal space in portrait
	// threshold: 		1.2,
	landscape: 		1.39,		// min horizontal space in landscape
	landscape_max: 16/9,		// max horizontal space in landscape
	cross_margin: '1.23%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
	portrait_height: 64,
}

define( 'vision-stage', App, ['vs-selector'])