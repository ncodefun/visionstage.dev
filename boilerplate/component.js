import { Component, html, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { cycleValueWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const app = q('#app')

class MyComp extends Component {

	onConnected = () => this.render()

	template = () => html`

	`

	// onResized, onRendered, onFirstRendered,
}

MyComp.strings = {
	title: ['Boilerplate', 'Gabarit']
}

MyComp.properties = {

}

define( 'vision-stage', MyComp, [])