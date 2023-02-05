import { Component, html, define }
	from '/vision-stage/vision-stage.min.js'

import { range }
	from '/vision-stage/utils.js'

const POSITIONS = {
	C: [0,5],
	A: [2,5],
	G: [4,5],
	E: [7,5],
	D: [9,5]
}
const DIATONIC = ['I',0,'II',0,'III','IV', 0,'V',0,'VI',0,'VII']
const HARMONIC = ['I',0,'II',0,'III','IV', 0, 0,'#V','VI',0,'VII']
const ROMANS = ['I','II','III','IV','V','VI','VII']
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
let CHORDS_LIST = ['F','C','G','D','A','E','B','F#','C#','G#','D#','A#']
CHORDS_LIST = [...CHORDS_LIST, ...CHORDS_LIST] // double to get pseudo wrapping when end>length
const CHORDS_ROMANS = ['IV','I','V','ii','vi','iii']
const STRING_SHIFTS = [4,11,7,2,9,4] // from top string 1 (III)
const CHORDS = {
	I: ['I','III','V'],
	III: ['III','V','VII'],
	V: ['V','VII','II'],
	VII: ['VII','II','IV'],
	II: ['II','IV','VI'],
	IV: ['IV','VI','I'],
	VI: ['VI','I','III']
}

export default class Fretboard extends Component {

	onConnected(){
		this.setAttribute('flow', 'col')
		let n = parseInt( this.getAttribute('strings-number'))
		this.strings_range = range( n) // [1-n]
		let pos
		if( this.hasAttribute('position')){
			pos = this.getAttribute('position')
		}
		else
			pos = this.position // dynamic / prop

		;[this.position_num, this.span] = POSITIONS[ pos]
		//this.frets_range4 = range( 4)
		this.frets_range = range( 5)
		this.render()
	}

	template(){
		//this.frets_range = this.span===4 ? this.frets_range4 : this.frets_range5
		this.triad = null
		const SCALE = this.scale==='diatonic' ? DIATONIC : HARMONIC
		const offset = CHORDS_LIST.indexOf( this.key) - 1 // C = 1 - 1 | G = 2 - 1 => [F,C,G,D,A...]
		const chords = CHORDS_LIST.slice( offset, offset+6,);

		// CHORDS_LIST.reduce( (prev, val, i) => i>=start&&i<start+7 ? prev, [])
		return html`
		${
			this.strings_range.map( n1 => html`<div class='string' flow='row-rev'>${
				this.frets_range.map( n2 => { // n2 = 1, 2, 3, 4...
					// inverse frets order (re-inverse w/ css)
					// to consume triad notes in order when on same string
					let shift = this.span - (n2) // 0,1,2,3... -> 3,2,1,0 // 4 - 1,2,3,4
					let pos = (this.position_num + STRING_SHIFTS[n1-1] + shift) % 12
					let note = SCALE[ pos]
					let clss = note ? 'note' : 'empty'
					let deg = note ? note.replace('#','') : null // remove possible #
					let level =
						this.chord === deg ? 2 :
						CHORDS[ this.chord].includes( deg) ? 1 :
						0
					if( level===1) clss += ' chord-tone'
					else if( level===2) clss += ' chord-root'
					if( !this.triad)
						this.getTriad()
					// consume triad item if match current note
					// -> we just want the 3 first match from top
					if( this.triad[0] === deg){
						clss += ' triad'
						this.triad.shift()
					}
					return html`<div flow class='dot ${clss}'><span>${note||''}</span></div>`
				})
			}</div>`)
		}
		<div id='fret-ref' class='abs left' flow>
			${ this.fret_ref }
		</div>
		<div id='chords-list' class='abs left'>
			${ chords.map( (c,i) => html`<div class='item' flow='row left'>
				<div class='roman'>${ CHORDS_ROMANS[i] }</div>
				<div class='chord'>${ c }${ i>2 ? 'm' : '' }</div>
			</div>`) }
		</div>
	`
	}

	/// According to inversion, find top-most triad possible, get its root
	//! find the first chord with which we can build a triad
	//! ex: 1st inversion, highest note is II ->
	//! -> (V)-VII-II -> V is the top-most chord / triad (1st inv => X - 3rd - 3rd)
	//! ex: 2nd inversion, highest note is II ->
	//! -> IV-VI-(II) -> II is the top-most chord... (2nd inv => X)
	//! ex: 3nd inversion, highest note is II ->
	//! -> IV-(VII)-II (3rd inv => X - 3rd)

	/// take highest note if inv===2nd -> this is the chord, if 3rd: X-3rd, if 1st: X-3rd-3rd

	getTriad(){ // get the top most triad for this.inversion
		if( this.inversion === 'none'){
			this.triad = []
			return
		}
		// ex: if inv == 1 (1,3,5) => [5,3,1] to consume 5 first (from top string)
		let c = CHORDS[ this.chord].slice()

		if( this.inversion !== '1st')
			c.push( c.shift())

		if( this.inversion === '3rd')
			c.push( c.shift())

		this.triad = c.reverse()
	}
}

Fretboard.properties = {
	position: {
		value: '',
		watcher( val){
			;[this.position_num, this.span] = POSITIONS[ val]
			this.inversion = this.inversion
		}
	},
	position_num: 0,
	span: 0,
	inversion: {
		value: '',
		watcher( inv){
			this.classList.toggle('no-focus', inv==='none')
			// if( app.playing) app.togglePlay()
			/// find first note
			for( let i=0; i<3; i++){
				let shift = this.span - i - 1
				let pos = (this.position_num + STRING_SHIFTS[0] + shift) % 12
				let note = DIATONIC[ pos]
				if( note){
					let index = ROMANS.indexOf( note)
					if( inv==='2nd') this.top_chord_index = index
					else if( inv==='3rd') this.top_chord_index = (7 + index - 2) % 7
					else if( inv==='1st') this.top_chord_index = (7 + index - 4) % 7
					// log('pink', 'Found top chord:', ROMANS[ this.top_chord_index])
					break
				}
			}
		}
	},
	chord: '',
	note: '',
	scale: '',
	key: {
		value: 'C',
	},
	fret_ref: {
		value: 0,
		getter(){
			// affected by position_num + shift of key
			return (this.position_num + NOTES.indexOf( this.key)) % 12
		}
	},
}

Fretboard.strings = {

}

define( 'fret-board', Fretboard)