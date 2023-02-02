
import { log, Component, html, define, icon, unsafeHTML, classes, ifDefined }
	from '../vision-stage/vision-stage.min.js'

import { cycleWithin, containsHTML, nextFrame, strIf, q }
	from '/vision-stage/utils.js'

const app = q('vision-stage')

export default class Selector extends Component {

	// static get dynamicAttributes(){ return ['type'] }

	onConnected(){
		if( !this.setup_done){
			this.setup()
			this.render()
		}
		//else log('warn', 'onConnected; no .selects; cannot setup, wait for render...')
	}

	setup(){
		this.initial_content = this.innerHTML.trim()
		this.color = this.getAttribute('color') || ''

		this.type = this.type || this.getAttribute('type')
			if( !this.type) this.type = ''
			else if( this.type==='led') this.type = 'led-round'
		if( this.type.includes('stepper')){
			this.step = parseFloat( this.getAttribute('step')||1)
			let wrp = this.getAttribute('wrap')
			this.wrap = wrp==='false' ? false : true // default true
		}
		//log('ok', 'setup(); this.type:', this.id, this.type||'NONE')

		// we could just use flow='inherit' but css needs to be explicit for styles selectors
		this.folds = this.hasAttribute('folds')
			if( this.folds){
				this.folded = true
				app.foldable_components.add( this)
			}

		this.sel_color = this.getAttribute('selected-color') || ''

		if( this.selected===true || this.selected===false){
			this.is_toggle = true
		}
		else if( !this.options){ // -> must be bool / simple-toggle
			this.selected = null
			this.is_toggle = true
		}

		// AFTER .is_toggle is set
		this.direction = this.getAttribute('direction')||'vertical'
			if( !this.hasAttribute('direction') && !this.is_toggle)
				this.setAttribute('direction', this.direction)
			else if( this.direction === 'row')
				this.direction = 'horizontal'
			else if( this.direction === 'col')
				this.direction = 'vertical'
			//log('err', 'this.type:', this.type)
			if( this.type!=='grid'){
				this.flow = this.direction==='horizontal' ? 'inline row' : 'inline col stretch'
				this.setAttribute('flow', this.flow)
			}

		this.opts = this.options

		// if not folding (so no header/label for "please select...")
		// and nothing selected -> auto select first option
		if( !this.folds && this.opts && this.selected===null)
			this.selected = this.val( this.opts[0])

		// AFTER .selected is set
		this.multi = Array.isArray( this.selected)

		this.onchange = new Event('change', { bubbles:true }) // -> dispatch on changing selected

		this._btn_class = (this.getAttribute('btn-class') || '').split(/\s+/)
		this._btns_class = (this.getAttribute('btns-class') || '').split(/\s+/)
		// this.id==='dark-sel' && log('check', 'btn-class:', this._btn_class)
		this.setup_done = true
	}

	async updateMinWidth(){
		//this.id==='foldable-1' && log('err', 'updateMinWidth()')
		// find the buttons' natural width as a min-width for all to use
		// so the fold header keep the same width even when menu is folded
		//
		await nextFrame() // leave time for fonts to also render...
		if( this.type.includes('stepper')){
			let btn = this.q('button')||this
			let font = getFontProps( btn)
			// Only labels for current lang…
			let labels = this.opts.map( o => typeof o === 'string' ? o : this.getLocale(o.label)).flat()
			let widest, max = 0
			labels.forEach( label => {
				let w = getTextWidth( label, font)
				// totally wrong value, but we only need the relatively wider
				if( w > max){
					widest = label
					max = w
				}
			})
			this.widest = widest
			// await sleep(200)
			// log('pink', 'widest for:', this.id, widest)
			this.render()
			// this.style.setProperty('--min-width', 'calc(' + max +'px + 0rem)')
		}
		else {
			this.style.setProperty('--min-width', '0')

			let btn = this.q('.menu > button')
			let btn_width = btn && btn.offsetWidth || 0
			// log('pink', 'btn_width:', this.id, btn_width)
			this.style.setProperty('--min-width', 'calc(' + btn_width +'px + 1.25rem)')
		}

	}

	beforeRender(){
		if( (this.folds || this.type.includes('stepper')) && this.lang !== app.lang){
			this.updateMinWidth()
			this.lang = app.lang
		}
	}

	template(){
		//log('purple', 'render:', this.id/* , this.selected */)

		// for defered loading where this is connected after initial app render
		// which has already created bindings
		if( !this.setup_done)
			this.setup()

		let sel_color = this.sel_color
		if( !sel_color && (!this.type||this.type==='grid') && !this.folds)
			sel_color = 'primary-adapt'

		if( this.is_toggle){
			let simple_class = classes(
				'simple-toggle', this.type,
				this.selected && 'selected',
				this.selected && sel_color,
				this.classList.contains('bare') && 'bare',
				...this._btn_class, this.btn_class
			)
			//log('pink', 'btn class', simple_class)
			return html`
			<button type='button'
				flow='row baseline'
				class=${ simple_class }
				@pointerdown=${ this.toggle }
				@keydown=${ this.onKeyDown }
				>
				${
					this.type==='checkbox' ?
						icon(`checkbox-${ this.selected ? '':'un'}checked`, 'checkbox icon') :
					this.type==='led-round' ? html`<span class='led icon' flow></span>` :
					this.type==='led-square' ? html`<span class='led square icon' flow></span>` :
					this.type==='led-bar' ? html`<span class='led-bar icon'></span>` :
					this.type==='switch' ? html`<span class='switch icon' flow></span>` :
					''
				}
				<span>
				${
					this.label && typeof this.label==='function' ? this.label() :
					this.label || unsafeHTML( this.initial_content) || 'no selection'
				}
				</span>
			</button>`
		}

		let sel_index = this.opts && !Array.isArray( this.selected) &&
			this.opts.findIndex( o => this.val(o) === this.selected)

		if( sel_index < 0){
			log('err', 'no sel_index:', this.selected, this.opts)
			return
		}

		if( this.type && this.type.includes('stepper')){
			let o = this.opts[ sel_index]

			let simple_class = classes(
				'simple-toggle', 'stepper', this.type,
				o&&o.class,
				this.classList.contains('bare') && 'bare',
				...this._btn_class, this.btn_class
			)

			return html`
			<button type='button'
				flow='row baseline'
				class=${ simple_class }
				@pointerdown=${ this.toggle }
				@keydown=${ this.onKeyDown }
				>
				${ this.type==='steppers' || this.step<0 ? html`<span class='left'>⮜</span>` : '' }
				<span flow='col'>
					<span class='widest-label' style='visibility:hidden ; height:0'>${this.widest}</span>
					${ this.opt('label', sel_index) }
				</span>
				${ this.type==='steppers' || this.step>0 ? html`<span class='right'>⮞</span>` : '' }
			</button>`
		}


		let c = this.folds && classes('toggle', this.type, ...this._btn_class, this.btn_class)
		let c2 = classes('menu','button-group', this.folds&&'abs', ...this._btns_class, this.btns_class)
		return [
			// use as header/selection
			this.folds ?
				html`
				<button type='button'
					flow='row baseline space-between'
					class=${ c }
					@pointerdown=${ this.toggle }
					@keydown=${ this.onKeyDown }
					>
					<span flow='col'>
						${
							// show label until there's a selection, if ever (multi + folds)
							this.multi || this.selected===null ?
								this.label && typeof this.label==='function' ?
									this.label() :
									this.label || unsafeHTML( this.initial_content) || 'no selection' :
								this.opts ?
									this.opt('label', sel_index) :
									''
						}

					</span>
					${ this.folds ? icon('chevron-down', 'small') : '' }

				</button>` :
				null
				,
				html`
				<div
					class=${ c2 }
					flow='${ ifDefined(this.flow) } top'
					@keydown=${ this.onKeyDown }
					>
					${ this.opts && this.opts.map( (o,i,arr) => {
						//log('err', 'this.opts.details[ i]:', this.opts.details[ i])
						const is_top_button = !this.folds && i===0 && arr.length>1
						const val = this.val(o)
						const selected =
							this.multi ? this.selected.includes( val) :
							val === this.selected
						let c3 = classes( o.class, this.type, this.color,
							selected && 'selected', selected && sel_color,
							selected && this.opts[i].selected_class,
							is_top_button&&'top-button',
							...this._btn_class, this.btn_class)

						return html`
						<button type='button' .index=${ i }
							flow='row ${ strIf('baseline', !this._btn_class.includes('icon')) } ${ strIf('space-between', !!this.type) }'
							tabindex=${ this.folded ? -1 : 0 }
							@pointerdown=${ this.onClickItem }
							class=${ c3 }
							>
							${ this.type==='checkbox' ?
									icon(`checkbox-${ selected ? '':'un'}checked`, 'checkbox icon') :
								this.type==='led-round' ?
									html`<span class='led icon' flow></span>` :
								this.type==='led-square' ?
									html`<span class='led square icon' flow></span>` :
								this.type==='led-bar' ?
									html`<span class='led-bar icon'></span>` :
								this.type==='switch' ?
									html`<span class='switch icon' flow></span>` :
								this.type==='radio' ?
									html`<span class='radio icon'>${selected ? '◉' : '◎' }</span>` :
								this.type==='underline' ?
									html`<span class='led-bar underline icon'></span>` :
								''
							}
							<span flow='col' class='text'>
								${ this.opt( 'label', i) }
								<span class='details'>${ this.opt('details', i) }</span>
							</span>
						</button>
					`})}
				</div>
				`
		]
	}

	val( o){
		return typeof o === 'string' ? o : o.value !== undefined ? o.value : this.getLocale( o.label)
	}

	opt( type, index){
		let o = this.opts[ index]
		if( o === undefined){
			log('err', 'opt undefined:', type, index)
			return ''
		}
		switch( type){
			case 'label':
				return typeof o === 'string' ? o :
				o.label !== undefined ? this.getLocale(o.label) :
				o.icon ? icon( o.icon) :
				this.getLocale(this.opts[0].label) || '?'
			case 'details':
				return this.getLocale(o.details)
			case 'value':
				return o.value !== undefined ? o.value : this.opt('label', index)
			case 'class':
				return o.class !== undefined ? o.class :
				o.label === undefined ? this.opts[0].class : ''
			case 'selected_class':
				return o.selected_class !== undefined ? o.selected_class :
				o.label === undefined ? this.opts[0].selected_class : ''
			case 'icon_class':
				return o.icon_class

			default:
				return 'unknown-option'
		}
	}

	getLocale( label){
		//! unsafeHTML if contains html...
		let rtrn = Array.isArray(label) ? label[ app.lang_index] : label
		if( !rtrn) return ''
		return containsHTML( rtrn) ? unsafeHTML( rtrn) : rtrn
	}

	// will set .type=val when type attr prop changes
	onAttributeChanged( name, val){
		log('info', 'onAttributeChanged:', name, val)
	}

	dispatchChange(){
		// unless we clone array, we'd have to force_render
		// every app prop bound to a vs-selector
		if( Array.isArray( this.selected)){
			this.selected = this.selected.slice()
		}
		this.dispatchEvent( this.onchange)
	}

	toggle( e){
		if( this.type.includes('stepper')){
			let step = e.target.classList.contains('left') ?
				-this.step : this.step
			let vals = this.opts.map( o => this.val(o))
			this.selected = cycleWithin( vals, this.selected, step, this.wrap)
			this.dispatchChange()
		}
		else if( this.is_toggle){
			this.selected = !this.selected
			this.dispatchChange()
		}
		else
			this.folded = !this.folded
	}

	onKeyDown( e){
		//log('check', 'key:', e.key, 'keycode:', e.keyCode, 'code:', e.code)
		let from_menu = e.currentTarget.classList.contains('menu')
		if( e.code === 'Space'){
			if( from_menu)
				this.onClickItem(e)
			else
				this.toggle()
		}
		else if( e.code === 'Enter'){
			if( from_menu)
				this.onClickItem(e)
		}
	}

	onClickItem(e){
		// clicked toggle
		if( this.folded){
			this.folded = false
			return
		}
		else if( this.folds && !this.multi){ // clicked item && folds => fold / close menu
			this.folded = true
		}

		const i = e.target.index

		if( this.multi){
			// remove selection if was selected
			let selected_val = this.val( this.opts[i])
			//this.last_selected = selected_val
			if( this.selected.includes( selected_val)){
				this.selected.splice( this.selected.indexOf( selected_val), 1)
				this.last_op = ['removed', selected_val]
			}
			else {
				this.selected.push( selected_val)
				this.last_op = ['added', selected_val]
			}
		}
		else {
			this.selected = this.val( this.opts[i])
		}
		this.dispatchChange()
		// this.render()
	}
}


Selector.properties = {
	folded: {
		value: false,
		class: 'folded',
	},
	folds: false,
	selected: {
		value: null,
		//force_render: true, // if value is array, its identity/value never change
		watcher( val, prev){
			if( val === undefined){
				log('err', '-> selected :', this.id, val)
				log('err', 'this:', this)
				throw '<vs-selector> .selected value is undefined'

			}
			//! only when set from prop? how to know?
			// this.block_watcher = true
			// this.selected = Array.isArray(val) ? val.slice() : val
			// this.block_watcher = false

			// if( Array.isArray(val) )
			// 	log('pink', 'sliced() .selected:', this.selected === val)
		}
	},
	classes_for_items: null,
	//options: { value:null, reactive: false },
	type: '',
	btn_class: '',
}

Selector.strings = {
	fr:{

	},
	en:{

	}
}

// .label is required, copied to value if no value


define( 'vs-selector', Selector)

/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  *
  * @param {String} text The text to be rendered.
  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  *
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
function getTextWidth( text, font) {

	// re-use canvas object for better performance
	const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"))
	const context = canvas.getContext("2d")
	context.font = font
	const metrics = context.measureText( text)
	return metrics.width
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getFontProps(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}