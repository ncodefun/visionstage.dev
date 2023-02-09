import { Component, html, define, ifDefined, log } from '/vision-stage/vision-stage.min.js'

import { q, sleep }
	from '/vision-stage/utils.js'

const app = q('vision-stage')

class Comp extends Component {

	onConnected = () => {
		if (this.hasAttribute('placeholder'))
			this.placeholder = this.getAttribute('placeholder')

		this.render()
	}

	template = () => html`
		<input type='text' placeholder=${ ifDefined(this.placeholder) }
			@focus=${ this.onFocus } @blur=${ this.onBlur }>
	`

	onFocus(){
		// log('red', 'on focus')
		app.block_resize = true
	}

	async onBlur(){
		//log('red', 'on blur')
		sleep(200)
		app.block_resize = false

	}
}

define('vs-text-input', Comp)