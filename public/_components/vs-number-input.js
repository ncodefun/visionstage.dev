import { live, Component, html, define } from '/vision-stage/vision-stage.min.js'

import { q, clamp, nextFrame }
	from '/vision-stage/utils.js'

// const app = q('vision-stage')

class Comp extends Component {

	onConnected(){
		this.initial_content = this.innerHTML.trim()
		this.step = parseFloat( this.getAttribute('step') || 1)
		//log('pink', 'value:', this.value)

		this.min = this.hasAttribute('min')
			? parseFloat( this.getAttribute('min'))
			: null
		this.max = this.hasAttribute('max')
			? parseFloat( this.getAttribute('max'))
			: null

		this.min_size = this.hasAttribute('min-size')
			? parseInt( this.getAttribute('min-size'))
			: 2

		this.oninputEvent = new Event('input', { bubbles:true })

		this.setAttribute('flow', 'col stretch gap-small')
	}

	template(){
		return html`
			<label>${ this.initial_content }</label>
			<div flow='row stretch' class='button-group'>
				<button flow class='dec primary-adapt' @pointerdown=${ this.dec }>−</button>
				<input type='text'
					.value=${ live(this.value) }
					@input=${ this.onInput }
					@keydown=${ this.onKeyDown }
					@blur=${ this.onBlur }>
				<button flow class='inc primary-adapt' @pointerdown=${ this.inc }>+</button>
			</div>
		`
	}

	inc( e){
		if( this.max !== null && this.value + this.step <= this.max){
			this.value += this.step
			this.onInput()
		}
	}
	dec( e){
		if( this.min !== null && this.value - this.step >= this.min){
			this.value -= this.step
			this.onInput()
		}
	}

	onInput( e){
		// let len = e.target.value.toString().length + 2
		// this.style.setProperty('--size', len)
		this.updateWidth( e && e.target.value || this.value)
		this.dispatchEvent( this.oninputEvent)
	}

	onKeyDown( e){
		let is_num = /[\d,.]/.test( e.key)
		//log('check', 'e.key:', e.key)
		if( !is_num && !['Backspace', 'Enter'].includes( e.key) ){
			e.preventDefault()
			return
		}
		if( e.key === 'Enter'){
			this.validate( e)
			e.target.blur()
		}
	}

	onBlur( e){
		this.validate( e)
	}

	validate( e){
		let num = clamp( e.target.value, this.min, this.max)
		let remainder = num % this.step
		this.value = num - remainder
	}

	updateWidth( num){
		let s = Math.max( this.min_size+2, num.toString().length + 2)
		this.style.setProperty('--size', s)
	}
}

Comp.properties = {
	value: {
		value: 11, // override with an initial value
		async watcher( val){
			await nextFrame() // first call too soon, this runs before onConnected / setup
			this.updateWidth( val)
		}
	},
}

Comp.strings = {
	fr:{

	},
	en:{

	}
}
define( 'vs-number-input', Comp)