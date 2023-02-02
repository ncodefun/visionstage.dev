import { log, Component, html, define, unsafeHTML }
	from '/vision-stage/vision-stage.min.js'
import {q}
	from '/vision-stage/utils.js'

const app = q('vision-stage')

class Modal extends Component {

	onConnected(){
		app.modal = this
		document.addEventListener('keydown', this.onKey.bind( this))
		this.type = this.getAttribute('type')
	}

	template(){
		return html`
		<div class='content'>
			<header>${ this.message }</header>
			${ this.mode === 'input' ? html`<input type='text'>` : '' }
			<div class='buttons' flow='row' @click=${ this.onAnswer }>
				${ this.options && this.options.map( opt => html`<button class='big'>${ opt }</button>`) }
			</div>
		</div>
		<div class='bg layer events' @click=${ e => { if (!this.force_answer) this.show = false }}></div>
		`
	}

	/**
	 * @param msg {(string|string[])} Main message, optionally a second string in an array will be smaller subtitle
	 * @param options {string[]} options Buttons texts; clicking any will close this popup
	 * @param use_text_input {boolean} if we should ask the user text input instead of choices buttons
	 * @param input_validator {Function} a function to validate input
	 * @return answer: index of button clicked
	 */
	setup( msg, options=null, use_text_input=false, input_validator=null, force_answer=false){

		if (use_text_input){
			this.mode = 'input'
			this.input_validator = input_validator
			this.message = msg
			this.force_answer = force_answer
			this.options = force_answer ? ['OK'] : ['Annuler','OK']
			setTimeout( e => {
				let input = this.q('input')
				input && input.focus()
			}, 300)
		}
		else {
			this.mode = 'buttons'
			this.options = options
			this.message = Array.isArray( msg) ?
				msg.map( (m,i) => i===0 ? html`<h1>${m}</h1>` : html`<div>${m}</div>`) :
				// -> array of html result can be accepted in templates
				html`<h1>${ msg }</h1>`
		}

			//'<h1>'+m+'</h1>' : '<div>'+m+'</div>').join('') :
			//'<h1>'+msg+'</h1>'

		// so we can wait user response (let answer = await setMessage(...))
		return new Promise( (resolve, reject) => {
			this.modal_resolve = resolve
		})
	}

	// -> listener for buttons
	onAnswer( e){
		if( e.target.localName !== 'button' )
			return

		const answer = this.options.indexOf( e.target.textContent)

		if (this.mode === 'input'){
			const text = this.q('input').value

			// Clicked Cancel
			if (answer===0 && !this.force_answer)
				return
			// No required text
			if (this.force_answer && !text)
				return
			// Invalid text
			if (this.input_validator && !this.input_validator(text))
				return // do not close / resolve

			this.modal_resolve(text)
			this.show = false
		}
		else {
			this.modal_resolve(answer)
			this.show = false
		}
		this.mode = 'buttons'
	}

	onKey( e){
		//log('check', 'e.key:', e.key)
		if( e.key==='Escape' && !this.force_answer)
			this.dismiss()
		else if( e.key==='Enter'){
			if( this.mode === 'input'){
				const text = this.q('input').value
				if (this.input_validator && !this.input_validator(text))
					return
				if (this.force_answer && !text)
					return
				this.modal_resolve(text || null)
				this.show = false
			}
		}
	}

	dismiss( e){
		this.modal_resolve(0) // -> treated like an explicit cancel
		this.show = false
		this.mode = 'buttons'
	}
}

Modal.properties = {
	// type: { // fullscreen | minimal (with blurred bg)
	// 	value: 'minimal',

	// },
	message: {
		value: '',
		watcher( val){
			if( val){
				//this.answer = null
				this.show = true
			}
		}
	},
	show: {
		value: false,
		class: 'show'
	},
}

define( 'vs-modal', Modal)