import { VisionStage as VS, html, define, log }
	from '/vision-stage/vision-stage.min.js'

import { q, sleep, strIf }
	from '/vision-stage/utils.js'

import { appContent, gameHeader }
	from '/vision-stage/templates.js'

class App extends VS {

	onConnected = () => this.render()

	onPageChanged( page, prev){
		if (!page) this.show_menu = true
		else {
			this.show_menu = false
			this.show_settings = false
		}
	}

	// Templates -----------------------------------------------

	template = () => html`
		${ gameHeader.call(this) }
		${ appContent.call(this) }
	`

	settingsTemplate = () => html`
		<aside id='settings' class='layer ${ strIf('show', this.show_settings) }' flow='col top'>

			<div style='margin: auto;' class='vs-box rounded'>
				<h2>Connexion</h2>
				<div class='vs-box rounded' id='connection' flow='row wrap gaps'>
					<input type='email' id='user-email'
						placeholder='email'>
					<input type='password' id='user-password'
						placeholder='password'>
				</div>
			</div>

			<div style='margin: auto;' class='vs-box rounded'>
				<h2>Réglages</h2>
				<p>...</p>
			</div>
			<div style='margin-top: auto;'>
				<div flow='row gaps'>
					<p class='frame'>Développement&thinsp;: <a href='mailto:ncode.fun@gmail.com'>Josef Roy</a></p>
				</div>
			</div>
		</aside>
	`

	home = () => html`
		<main flow='col grow'>
			<h2>${ this.getPage(this.page).title }</h2>
			<p>Hello </p>
			<button style='margin: 2rem 0'
				@pointerdown=${ this.testModal }>Toggle modal</button>
		</main>
	`

	two = () => html`
		<main flow='col grow'>
			<h1>Two</h1>
		</main>
	`

	async testModal(){
		const answer = await this.modal.setup(["Hello","Welcome home!"], ["Cancel", "OK"])
		log('info', 'answer:', answer)
	}
}

VS.config = {
	font_size_decimals: 0,
	// sw:'/my-app/sw.js'
}

VS.aspects = {
	portrait_alt:	.6,
	portrait: 		.75,		// min horizontal space in portrait
	portrait_max: 	.75,		// max horizontal space in portrait
	threshold: 		1.2,
	landscape: 		1.39,		// min horizontal space in landscape
	landscape_max: 16/9,		// max horizontal space in landscape
	cross_margin: '1.23%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
	// portrait_height: 64,
}

VS.sounds = {
	// good: 'good.wav',
	// wrong: ['wrong.wav', { volume: 0.6 }],
	// win:	'win.mp3',
}

VS.languages = ['en', 'fr']

VS.pages = {
	'home': 		["Page One", "Page un"],
	'two': 		["Page Two", "Page deux"],
	'./gold.html':	["Gold Theme", "Theme 'gold'"],
}

VS.strings = {
	title: 			["MY GAME", "MON JEU"],
	home: 			["Home", "Accueil"],
	fullscreen: 	["Fullscreen", "Plein écran"],
	settings: 		["Settings","Réglages"],
	menu: 			["Menu","Menu"],
	next_page: 		["Next game","Jeu suivant"],
}

VS.properties = {
	show_menu: {
		value: false,
		class: 'show-menu',
		watcher( val){
			if (!val){
				this.setAttribute('hidding', 'menu')
				setTimeout( () => this.removeAttribute('hidding'), 333)
			}
		}
	},
	show_settings: {
		value: false,
		class: 'show-settings',
		async watcher( val){
			if (!val){
				this.setAttribute('hidding', 'menu')
				setTimeout( () => this.removeAttribute('hidding'), 333)
			}
			if( val && !this.settings_first_focusable){
				this.settings_first_focusable = q('#lang-bar button:first-of-type')
				await sleep(0)
				this.settings_last_focusable = q('#settings > div:last-child > div > p:last-child a')
				//log('purple', 'first, last:', this.settings_first_focusable, this.settings_last_focusable)
			}
		}
	},

}

define( 'vision-stage', App, ['vs-selector', 'vs-modal'])