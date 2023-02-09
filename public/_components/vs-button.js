import { define, log, litRender } from '/vision-stage/vision-stage.min.js'
import { nextFrame } from '/vision-stage/utils.js'

/** lightweight Component version just for basic vs-button  */
class ButtonComponent extends HTMLButtonElement {

	constructor(){
		super()
		// this.uses([['vision-stage', 'lang']])
		this._state = {}
	}

	connectedCallback(){ // VisionStage overrides this
		this.onConnected && this.onConnected()
	}

	uses( entries){
		for (let entry of entries){
			// non destructive...
			let prop_holder = entry[0]
			let props = entry.slice(1) /// copy the rest

			if (typeof prop_holder === 'string'){
				let prop_holder_selector = prop_holder
				prop_holder = document.querySelector(prop_holder_selector)
				if (!prop_holder)
					throw 'uses(); prop_holder do not exist (yet?): ' + prop_holder_selector
			}
			prop_holder.renders = prop_holder.renders || new Map()

			for (let prop of props){
				if (prop_holder.renders.has(prop)) // value already exist (Set of render targets)
					prop_holder.renders.get(prop).add(this)
				else
					prop_holder.renders.set(prop, new Set([this]))
			}
		}
	}

	async render( evt_ctx){

		if (!this.template){
			if (this.localName !== 'vision-stage' && this.localName !== 'button')
				log('warn', '--no template, cannot render(): '+ this.id +', '+ this.tagName)
			return
		}

		if( !this.needsRender){
			this.needsRender = true
			await nextFrame()

			!this.rendered && this.beforeFirstRender && this.beforeFirstRender()
			if( this.beforeRender && this.beforeRender()===false){
				return
			}

			this.needsRender = false
			const tmpl = this.template()
			if (!tmpl)
				return

			litRender( tmpl, this, {
				scopeName: this.localName,
				eventContext: evt_ctx || this.event_context || this
			})

			const has_been_rendered = this.rendered
			this.rendered = true //! BEFORE CALLBACK TO PREVENT IFINITE LOOP
			if( !has_been_rendered){
				this._onFirstRendered && this._onFirstRendered()
				this.onFirstRendered && this.onFirstRendered()
				if( this.skipped_onResized){
					this.skipped_onResized = false
					this.onResized( ...this.skipped_params)
					this.skipped_params = null
				}
				//-- delete this.onFirstRendered
				// -> it's supposedly better not to delete anything after an object definition
			}
			this._onRendered && this._onRendered()
			this.onRendered && this.onRendered()
			if( this.setOnRendered){
				let [prop,val] = this.setOnRendered
				this[prop] = val
				this.setOnRendered = null
			}
		}
	}

	setState( name, value){ this._state[ name] = value }
}

/**
 * Simple button that allow using @pointerdown event
 * while also triggering on spacebar, like @click does natively
 * Does not bubble up.
 */
class MyButton extends ButtonComponent {

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
define('vs-button', MyButton, null, 'button')