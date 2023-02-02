/// To do
/// - metronome sounds
/// - custom chord sequence
/// - custom chords ?

import { VisionStage, html, cache, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { cycleWithin, tempClass, sleep }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global

// log('info', 'Updated 2022.07.29')


/// thinsp:" "
/// hairsp:" "


const NIGHT_MODES = [0,1,2]

const POSITIONS = ['C', 'A', 'G', 'E', 'D']
const KEYS = ['C','G','D','A','E']
const INVERSIONS = ['none','1st','2nd','3rd']
const CHORDS = ['I','II','III','IV','V','VI','VII']
const PLAY_MODES = ['normal','reverse','alternate']
const SCALES = ['diatonic','harmonic minor']

class App extends VisionStage {

	onConnected = () => {
		// log('info', 'this.position:', this.position)
		this.render()
		document.body.addEventListener('keydown', this.onKeyDown.bind( this))
	}

	template = () => {
		// log('check', 'this.position:', this.position)

		return html`
		<header id='app-header' flow='row space-between' class='sth-scaling text-center'>

			<span flow='row left' id='lang-bar'>
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
					@pointerdown=${ e => this.night_mode = cycleWithin(NIGHT_MODES, this.night_mode) }
					>
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
					this.getPageLink( page, i < this.pages.length-1 ? '✦' : '')
				)}
			</nav>

		</footer>`}

	home = () => html`
		<main id='home'
			class='grow text-center scroll shadow'
			flow='row baseline divide wrap gaps-small'>

			<!-- <h1>Triads Practice</h1> -->

			<fret-board strings-number='6'
				.position=${ this.position }
				.chord=${ this.chord }
				.inversion=${ this.inversion }
				.note=${ this.note }
				.scale=${ this.scale }
				.key=${ this.key }
				>
			</fret-board>

			<div></div>

			<span flow='col'>
				<label>Key</label>
				<vs-selector folds
					.options=${ KEYS }
					.selected=${ this.key }
					@change=${ e => this.key = e.target.selected }>
				</vs-selector>
			</span>

			<span flow='col'>
				<label>Position</label>
				<vs-selector direction='horizontal'
					.options=${ POSITIONS }
					.selected=${ this.position }
					@change=${ e => this.position = e.target.selected }>
				</vs-selector>
			</span>

			<span flow='col'>
				<label>Scale</label>
				<vs-selector folds
					.options=${ SCALES }
					.selected=${ this.scale }
					@change=${ e => this.scale = e.target.selected }>
				</vs-selector>
			</span>

			<div></div>

			<span flow='col'>
				<label>Chord</label>
				<vs-selector direction='horizontal'
					.options=${ CHORDS }
					.selected=${ this.chord }
					@change=${ e => this.chord = e.target.selected }>
				</vs-selector>
			</span>

			<span flow='col'>
				<label>Inversion Focus</label>
				<vs-selector direction='horizontal'
					.options=${ INVERSIONS }
					.selected=${ this.inversion }
					@change=${ e => this.inversion = e.target.selected }>
				</vs-selector>
			</span>

			<div></div>

			<div flow='row bottom gaps wrap' style='padding: 0 2rem'>

				<div flow='col'>
					<label>Sequence</label>
					<vs-selector id='play-mode-ctrl'
						direction='horizontal'
						.options=${ PLAY_MODES }
						.selected=${ this.sequence }
						@change=${ e => this.sequence = e.target.selected }>
					</vs-selector>
				</div>

				<button id='play-btn'
					@pointerdown=${ this.togglePlay }
					class='round ${ this.playing ? 'active' : '' }'>
					${ this.playing ? '⯀' : '▶' }
				</button>

				<div flow='col'>
					<label>Beats per Chord</label>
					<div>
						<vs-number-input min='1' max='8' min-size='1'
							.value=${ this.beats_per_chord }
							@input=${ e => this.beats_per_chord = e.target.value }>
						</vs-number-input>
					</div>
				</div>

				<div flow='col'>
					<label>Tempo</label>
					<div flow class='rel'>
						<vs-slider min='60' max='200' step='10'
							tickmarks
							.value=${ this.tempo }
							@input=${ e => this.tempo = e.target.value }
							>
						</vs-slider>
						<span id='tempo-value'>${ this.tempo } bpm</span>
					</div>
				</div>

			</div>

		</main>
	`

	about = () => html`
		<main id='about' class='grow' flow='col'>
			<h1>Demo</h1>
		</main>
	`

	onPageChanged( page, prev){
		//log('info', 'page changed:', page, this.params)
		if( page===prev) return // only changed language -> different page.path

		if( this.params)
		for( let [p,val] of this.params){
			if( p in this && val){
				//log('check', 'set hash param on this:', p)
				this[ p] = val
			}
		}

		this.menu_open = false
	}

	onKeyDown( e){
		//log('check', 'key:', e.code)
		if( e.code === 'Space'){
			if( this.playing) this.togglePlay()
			else {
				this.chord_index = (this.q('fret-board').top_chord_index + 1) % 7
				this.setChord()
				setTimeout( e => this.togglePlay(), 2000)
			}

		}
	}

	togglePlay(){
		this.playing = !this.playing
		if( this.playing){
			// (top most + 1) % 7 = bottom most
			this.chord_index = (this.q('fret-board').top_chord_index + 1) % 7
			this.setChord( true) // immediate, init won't increment chord_index
			this.play()
		}
		else {
			clearTimeout( this.timer)
		}
	}

	play(){
		this.beat = 0
		clearTimeout( this.timer)
		this.timer = setInterval( t => this.onBeat(), this.beat_delay)
	}

	onBeat(){
		if( this.beat === 0){
			this.setChord()
		}
		tempClass( this, 'beat-flash', .05)
		this.beat = (this.beat+1) % this.beats_per_chord
	}

	setChord( init=false){
		// log('check', 'setChord:', this.chord_index)
		if( isNaN(this.chord_index)) this.chord_index = 0
		this.chord = CHORDS[ this.chord_index]
		let top_chord_index = this.q('fret-board').top_chord_index

		if( this.sequence === 'alternate'){
			if( this.chord_index === top_chord_index && !this.reverse){
				this.reverse = true
			}
			else if( this.chord_index === (top_chord_index+1) % 7 && this.reverse){
				this.reverse = false
			}
		}

		if( init) return

		if( this.reverse || this.sequence === 'reverse'){ // manual or auto reverse when this.alternate
			this.chord_index = (7 + this.chord_index - 1) % 7
		}
		else {
			this.chord_index = (this.chord_index + 1) % 7
		}
	}
}

App.languages = ['en', 'fr']

App.pages = {
	'': 		["Home", "Accueil"],
	about: ['About', 'À propos'], // -> /#About | /#À propos
	// '/vision-stage': 	['Vision Stage', 'Vision Stage'],
	// '/todo': ['Todo', 'Todo'],
	// '/test': ['Components', 'Composantes'],
	// '/triads': ['Guitar', 'Guitare']
}

App.strings = {
	home: 			["Home", "Accueil"],
	fullscreen: 	["Fullscreen", "Plein écran"],

}

App.properties = {
	position: {
		value: 'C',
		storable: true,
	},
	inversion: {
		value: '1st',
		storable: true,
	},
	chord: {
		value: 'I',
		storable: false
	},
	// note: { // single focused note for sequencing exercise
	// 	value: 'I',
	// 	storable: true
	// },
	tempo: {
		value: 120,
		storable: true,
		init_watcher: true,
		watcher( val){
			// 60 beats per minutes -> 1 beat per second => 1000ms delay * 4 beat per bar
			this.beat_delay = 60 / val * 1000
			this.bar_delay = this.beat_delay * this.beats_per_chord

			if( this.playing){
				this.play() // clear interval and re-launch with new values
			}
		}
		// use a control for how many beats we want per chord (mesure)
		//
	},
	sequence: {
		value: 'normal',
		storable: true,
	},
	playing: false,
	reverse: {
		value: false,
		watcher( val){
			tempClass( this, 'flash', .12)
		}
	},
	scale: {
		value: 'diatonic',
		storable: false,
	},
	beats_per_chord: {
		value: 2,
		storable: true,
		watcher( val){
			log('check', 'beats per chord:', val)
		}
	},
	key: {
		value: 'C',
		storable: true,
	}
}

App.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait (limit only for extreme case)
	portrait: 		.5,		// min horizontal space in portrait
	portrait_max: 	1.1,			// max horizontal space in portrait
	threshold: 		1.1,
	landscape: 		1.1,			// min horizontal space in landscape
	landscape_max: 16/9,		// max horizontal space in landscape
	cross_margin: '1.33%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

define( 'vision-stage', App, ['vs-selector', 'vs-slider', 'vs-number-input', './fret-board'])

