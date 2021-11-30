import { q, qAll, log, Component, html, define, useSVG as ICON } from '../vision-stage.min.js'

const app = q('vision-stage')

class Comp extends Component {

	constructor(){
		super()
		this.name = parseFloat( this.getAttribute('name'))
		this.value = parseFloat( this.getAttribute('value'))
		this.step = parseFloat( this.getAttribute('step'))
		this.size = this.getAttribute('size')||'3'

		this.setAttribute('flow', 'row stretch')
	}

	template(){
		return html`
			<button class='dec'>-</button>
			<input type='text' size=${ this.size } .value=${ this.value }>
			<button class='inc'>+</button>
		`
	}

	onConnected(){
		this.render()
	}
}

Comp.properties = {
	value: 0, //! how to have both: predefined as .prop + here to auto-render ??
}

Comp.strings = {
	fr:{

	},
	en:{

	}
}
define( 'input-number', Comp)