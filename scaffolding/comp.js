import { q, qAll, log, Component, html, define, useSVG as ICON } from '../vision-stage.min.js'

const app = q('vision-stage')

class Comp extends Component {

	constructor(){
		super()

	}

	template(){
		return html`

		`
	}

	onConnected(){
		this.render()
	}
}
Comp.properties = {

}
Comp.strings = {
	fr:{

	},
	en:{

	}
}
define( 'my-comp', Comp)