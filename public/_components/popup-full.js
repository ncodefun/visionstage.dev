import { q, log, Component, html, define, unsafeHTML } from '../vision-stage.2022-04.bundle.js'

const app = q('vision-stage')

class Popup extends Component {

	onConnected(){
		app.popup = this
		document.addEventListener('keydown', this.onKey.bind( this))
	}

	template(){
		return html`
		<header>${ unsafeHTML( this.message) }</header>
		${ this.input_mode ? html`<input type='text'>` : '' }
		<div class='buttons' flow='row' @click=${ this.onAnswer }>
			${ this.options && this.options.map( opt => html`<button class='big'>${ opt }</button>`) }
		</div>`
	}

	/**
	 * @param {String|String[]} msg Main message, optionally a second string in an array will be smaller subtitle
	 * @param {String[]} options Buttons text; clicking any will close this popup
	 * @return answer: index of button clicked
	 */
	setMessage( msg, options=null){
		this.options = options

		this.message = Array.isArray( msg) ?
			msg.map( (m,i) => i===0 ? '<h1>'+m+'</h1>' : '<div>'+m+'</div>').join('') :
			'<h1>'+msg+'</h1>'
		/// so we can wait user response (let answer = await setMessage(...))
		return new Promise( (resolve, reject) => {
			this.modal_resolve = resolve
		})
	}

	// -> listener for buttons
	onAnswer( e){
		if( e.target.localName !== 'button' )
			return

		const answer = this.options.indexOf( e.target.textContent)

		if( this.input_mode){
			// if === 1 -> no validator, Two btns [0:Cancel, 1:OK] , we clicked OK
			let val = answer===1 || (this.validator ? this.q('input').value : null)
			//log('check', 'val:', val)
			if( this.validator && !this.validator( val))
				return // do not close / resolve
			this.modal_resolve( val)
			this.show = false
		}
		else {
			this.modal_resolve( answer)
			this.show = false
		}
		this.input_mode = false
	}

	getInput( msg, validator){
		this.validator = validator
		this.input_mode = true
		this.message = msg
		this.options = validator ? ['OK'] : ['Annuler','OK']
		setTimeout( e => {
			let input = this.q('input')
			input && input.focus()
		}, 300)
		return new Promise( (resolve, reject) => {
			this.modal_resolve = resolve
		})
	}

	onKey( e){
		//log('check', 'e.key:', e.key)
		if( e.key==='Escape' && !this.validator)
			this.dismiss()
		else if( e.key==='Enter'){
			if( this.input_mode){
				this.modal_resolve( this.q('input').value || null)
				this.show = false
			}
		}
	}

	dismiss( e){
		this.modal_resolve( null) // -> should be treated like an explicit cancel (answer===0)
		this.show = false
		this.input_mode = false
	}


}

Popup.properties = {
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
		attribute: ['shown', 'bool'], // bool to remove or add as a "valueless" attr.
	},
}

define( 'popup-full', Popup)