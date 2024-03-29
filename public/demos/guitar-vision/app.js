/// To do
/// - metronome sounds
/// - custom chord sequence
/// - custom chords ?

import { VisionStage as VS, html, define, log }
	from '/vision-stage/vision-stage.min.js'

import { tempClass, labelOptionsMapper }
	from '/vision-stage/utils.js'

import { appHeader, appContent, appFooter }
	from '/vision-stage/templates.js'

// Bare strings is supported instead of standard obj: { label: ''|[], value: * }
// to use localized labels without creating option objects,
// use labelOptionsMapper (will map the first locale string to the value).
const POSITIONS = ['C', 'A', 'G', 'E', 'D']
const KEYS = ['C','G','D','A','E']
const INVERSIONS = ['none','1st','2nd','3rd']
const CHORDS = ['I','II','III','IV','V','VI','VII']
const SCALES = [['diatonic','diatonique'],['harmonic minor','mineure harmonique']]
.map( labelOptionsMapper )
const PLAY_MODES = [['normal','normale'],['reverse','inverse'],['alternate','alternée']]
.map( labelOptionsMapper )

class App extends VS {

	onConnected = () => {
		// log('info', 'this.position:', this.position)
		this.render()
		document.body.addEventListener('keydown', this.onKeyDown.bind( this))
	}

	template = () => html`
		${ appHeader.call(this) }
		${ appContent.call(this) }
		${ appFooter.call(this, 'nav') }
	`

	home = () => html`
		<main id='home' class='grow text-center'
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
				<label>${ this.$key }</label>
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
				<label>${ this.$scale }</label>
				<vs-selector folds
					.options=${ SCALES }
					.selected=${ this.scale }
					@change=${ e => this.scale = e.target.selected }>
				</vs-selector>
			</span>

			<div></div>

			<span flow='col'>
				<label>${ this.$chord }</label>
				<vs-selector direction='horizontal'
					.options=${ CHORDS }
					.selected=${ this.chord }
					@change=${ e => this.chord = e.target.selected }>
				</vs-selector>
			</span>

			<span flow='col'>
				<label>${ this.$inversion }</label>
				<vs-selector direction='horizontal'
					.options=${ INVERSIONS }
					.selected=${ this.inversion }
					@change=${ e => this.inversion = e.target.selected }>
				</vs-selector>
			</span>

			<div></div>

			<div flow='row bottom gaps wrap' style='padding: 0 2rem'>

				<div flow='col'>
					<label>${ this.$sequence }</label>
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
					<label>${ this.$beats }</label>
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

	// onPageChanged( page, prev){

	// }

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

VS.config = {
	// sw:'/my-app/sw.js',
	font_size_decimals: 1,
}

VS.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait (limit only for extreme case)
	portrait: 		.5,		// min horizontal space in portrait
	portrait_max: 	1.1,		// max horizontal space in portrait
	threshold: 		1.1,
	landscape: 		1.1,		// min horizontal space in landscape
	landscape_max: 16/9,		// max horizontal space in landscape
	cross_margin: '1.33%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

VS.sounds = {
	// good: 'good.wav',
	// wrong: ['wrong.wav', { volume: 0.6 }],
	// win:	'win.mp3',
}

VS.languages = ['en', 'fr']

VS.pages = {
	'': 		["Home", "Accueil"],
	about: ['About', 'À propos'],
}

VS.strings = {
	home: 			["Home", "Accueil"],
	fullscreen: 	["Fullscreen", "Plein écran"],
	key:				["Key", "Clé"],
	scale:			["Scale", "Gamme"],
	chord:			["Chord", "Accord"],
	inversion:		["Inversion Focus", "Focus sur l'inversion"],
	sequence:		["Sequence", "Séquence"],
	beats:			["Beats per chord", "Beats par accord"],


}

VS.properties = {
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


define( 'vision-stage', App, ['vs-selector', 'vs-slider', 'vs-number-input', './fret-board'])

