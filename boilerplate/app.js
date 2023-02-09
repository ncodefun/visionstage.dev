import { VisionStage, html, cache, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { gameHeader }
	from '/_templates/templates/gameHeader.js'

import { navFooter }
	from '/_templates/templates/navFooter.js'


import { cycleValueWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = window.screenfull // embeded / global

class App extends VisionStage {

	onConnected = () => this.render()

	template = () => html`
		<!-- Lang btns in the middle -->
		${ gameHeader() }

		<section id='app-content' class='rel' flow='col top stretch grow'>
			<!-- <vs-modal type='full'></vs-modal> -->
			${ this.page !== null && cache( this[ this.page||'home' ]() ) }
		</section>

		<!-- footer pages nav -->
		<!-- ${ navFooter() } -->
	`

	home = () => html`
		<main id='home' class='text-center rel' flow='col top full'>
			<h1>Vision <small>✦</small> Stage</h1>
		</main>
	`

	onPageChanged( page, prev){
		this.show_menu = false // for normal-type apps

		// if (!page) this.show_menu = true
		// for apps where we're asking to chose a page to start
		// because each mini-game / scene has its own name in url; home has none
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

// App.config = {}


define( 'vision-stage', App, [], { /*sw:'/sw.js'*/ })