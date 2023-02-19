import { ComponentMixin, define } from '/vision-stage/vision-stage.min.js'
// import { nextFrame } from '/vision-stage/utils.js'

/**
 * Simple button that allow using @pointerdown event
 * while also triggering on spacebar, like @click does natively
 * Does not bubble up.
 */
class VSButton extends ComponentMixin(HTMLButtonElement) {

	onConnected = () => {
		this.addEventListener('keyup', this.onKey.bind(this))
		this.onPointerDown = new Event('pointerdown', { bubbles:false })
		this.onPointerUp = new Event('pointerup', { bubbles:false })
		// no bubbling to body -> prevent .using-mouse class
		this.render()
	}

	onKey = e => {
		if (e.key === ' '){
			this.dispatchEvent( this.onPointerDown)
			this.dispatchEvent( this.onPointerUp)

		}
	}
}
define('vs-button', VSButton, null, 'button')