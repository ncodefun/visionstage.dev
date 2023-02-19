

import { ComponentMixin, define, log }
	from '/vision-stage/vision-stage.min.js'

import { q, sleep }
	from '/vision-stage/utils.js'

const app = q('vision-stage')

/**
 * Simple input extension that blocks resize when focused.
 * This prevents the onscreen keyboard on mobile browser
 * to cause a stage resize when it pops up.
 * @usage:  <input is="vs-input">
 */
class VSInput extends ComponentMixin(HTMLInputElement) {

	onConnected = () => {
		this.addEventListener('focus', this.onFocus.bind(this))
		this.addEventListener('blur', this.onBlur.bind(this))
		this.render()
	}

	onFocus(){
		log('red', 'focus', )
		app.block_resize = true
	}

	async onBlur(){
		sleep(200)
		app.block_resize = false
	}
}

define('vs-input', VSInput, null, 'input')