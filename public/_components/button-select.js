/**
 *
 * <button-select
			menu-dir='col'
			.onChange=${this.onChangeSelect}
			.labels=${ my_selection_labels }
			.selections=${ this.my_selections }
			>
		</button-select>
 */
/// todo: floating chevrons as signifiers of choice, cycle buttons & options

/** select / tabs / checkbox  */
import { q, qAll, log, Component, html, define, useSVG as ICON } from '../vision-stage.min.js'

const app = q('vision-stage')

class ButtonSelect extends Component {

	constructor(){
		super()

		this.initial_content = this.innerHTML.trim()
		this.direction = this.getAttribute('dir')
		this.setAttribute('flow', this.direction==='row' ? 'inline row' : 'inline col stretch')
		this.folds = this.hasAttribute('fold')
		if( this.folds){
			this.folded = true
			app.foldable_button_select_components.add( this)
		}
		this.icon = this.getAttribute('icon')
		let multi = this.hasAttribute('multi')

		this.icon_pos = this.getAttribute('icon-position')||'left'

		if( multi && this.folds)
			throw ('<button-select>  multi and folds are mutually exclusive')
		this.multi = multi && !this.folds
	}

	onConnected(){
		if( !this.selections){
			throw ('selections not defined')
		}
		if( this.selections.length>1 && !this.multi){
			log('err','more than one selections set but multi=false')
			this.selections.length = 1
		}
		if( this.labels.length === 1){
			this.multi = true // checkbox mode
			this.folds = false // no header / toggle
		}
		this.render()
	}

	onFirstRendered(){

		if( this.direction==='row')
			return

		// find the buttons' natural width as a min-width for all to use
		// so the fold header keep the same width even when menu is folded
		let btn_width = this.q('.menu button').offsetWidth
		this.style.setProperty('--min-width', btn_width+'px')
	}

	template(){
		return [
			this.folds ?
				html`<button class='toggle' @click=${ this.toggleFolding }>
							${ !this.selections.length ? this.initial_content||'no selection' : this.labels[ this.selections[0]] }
						</button>` :
				null,
				html`
				<div class='menu abs' flow='inherit'>
					${
						this.labels.map( (label,i,arr) => {
							const selected = this.selections.includes( i)
							const is_top_button = !this.folds && i===0 && arr.length>1
							return html`
							<button .index=${i} flow='row space-between stretch'
								@click=${ this.onClickItem }
								class='${ selected ? 'selected' : '' } ${ is_top_button ? 'top-button':'' }'
								>
								<span flow class='icon ${this.multi?'checkbox':'radio'} ${this.icon==='led'?'led':''}'>${
									this.icon==='led' ? (selected ? '☀' : '☀') :
									this.multi ? (selected ? '☑' : '☐') :
									selected ? '◉' : '◎'
								}</span>
								<span flow='row right' class='text'>${label}</span>
							</button>
						`})
					}
				</div>
				`

		]
	}

	toggleFolding(){
		this.folded = !this.folded
	}

	onClickItem(e){
		// clicked toggle
		if( this.folded){
			this.folded = false
			return
		}
		else if( this.folds){ // clicked item && folds => fold / close menu
			this.folded = true
		}

		if( !this.multi){ // = single choice = radio buttons => reset
			this.selections.length = 0
		}
		const i = e.target.index
		if( this.selections.includes( i)){
			this.selections.splice( this.selections.indexOf( i), 1)
		}
		else {
			this.selections.push( i)
		}
		this.onChange && this.onChange( this.selections)
		this.render()
	}
}

ButtonSelect.properties = {
	folded: {
		value: false,
		class: 'folded'
	},
	folds: {
		value: false,
		class: 'folds'
	},
}

ButtonSelect.strings = {
	fr:{

	},
	en:{

	}
}
define( 'button-select', ButtonSelect)