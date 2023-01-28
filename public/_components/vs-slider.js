import { Component, html, define, log, ifDefined } from '/vision-stage/vision-stage.min.js'

// const app = q('vision-stage')

class RangeSlider extends Component {

	constructor(){
		super()
		this.min = this.getAttribute('min')
		//this.removeAttribute('min')
		this.max = this.getAttribute('max')
		//this.removeAttribute('max')
		this.step = this.getAttribute('step')
		//this.removeAttribute('step')

		let min = parseInt( this.min)
		let max = parseInt( this.max)
		let range = max - min
		this.params = { min, max, range }
		this.oninputEvent = new Event('input', { bubbles:true })
		this.onchangeEvent = new Event('change', { bubbles:true })
	}

	template(){
		return html`
		<input type="range" min=${this.min} max=${this.max} step=${ifDefined(this.step)}
			value=${ this.value }
			@input=${ this.onInput }
			@change=${ this.onChange }>
		<div class='steps'></div>
		`
	}

	onConnected(){
		let {min,range} = this.params
		this.progress = (this.value - min) / range
		this.style.setProperty('--progress-percent', Math.round(this.progress * 100) +'%')
		this.style.setProperty('--step-percent', Math.round((this.step / range) * 100) +'%')

		this.render()
	}

	onInput( e){
		this.value = e.target.value
		//log('check', 'slider value:', this.value)
		let {min,range} = this.params
		this.progress = (this.value - min) / range
		this.style.setProperty('--progress-percent', Math.round(this.progress * 100) +'%')

		this.dispatchEvent( this.oninputEvent)
	}

	onChange( e){
		this.dispatchEvent( this.onchangeEvent)
	}
}

RangeSlider.properties = {
	value: 0
}

RangeSlider.strings = {

}

define('vs-slider', RangeSlider)