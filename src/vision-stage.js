const VERSION = 3.24
const COMPONENTS_DIR = '/_components/'

/**
 * Vision Stage Framework
 * Stage to control aspect + rem scaling => total control of presentation / art direction
 * Native Web components
 * 	-> no build step! [lit-html template, easy insert locale strings, svg icons]
 * 	-> explicit render dependencies: this.uses([[comp, 'propX'], [comp, 'propY', 'propZ']])
 *  -> component instances are directly accessed / queried and modified without any limitations.
 *	-> smart properties: comp. self-renders on change: stored:true (for stringifyable values),
 *	   watcher(val,prev){}, transformer(val,prev){return val}, class:'' (for bool - auto add/remove), attribute:'name' (mirrors value)
 * Old school: unscoped CSS & full reload (no hot module reloading…)
 *
 */


const SCENE_HISTORY = true
const CLEAR_STORE = false  //! Warning: erase all app data...
const FONT_SIZE_DECIMALS = 1
// only one decimal => makes total rem space vary a bit,
// but we get more even layout spacing (Browsers are BAD at this…)



//! Bare imports: this is intended to be bundled w/ rollup (from node_modules)
import { html, svg, render as litRender }
	from 'lit-html/lit-html.js'
import { unsafeHTML }
	from 'lit-html/directives/unsafe-html.js'
import { ifDefined }
	from 'lit-html/directives/if-defined.js'
import { repeat }
	from 'lit-html/directives/repeat.js'
import { live }
	from 'lit-html/directives/live.js'
import { guard }
	from 'lit-html/directives/guard.js'
import { cache }
	from 'lit-html/directives/cache.js'

// z-console is kept out of the bundle by rollup externals option;
// we need to import it as a blackboxed file in chrome TO GET REAL LINE NUMBERS in console!
import log from '../z-console.js'
log('info','Vision Stage • version:', VERSION)
import { q, qAll, el, debounce, isObject, ctor, clone, loadStyleSheetAsync, objectFromString, containsHTML, nextFrame, sleep, cleanNum, chain, range, loadScriptAsync, loadScriptsAsync, tempClass  } from './utils-core.js'

/// Share with other components
export { log, q, qAll, html, svg, unsafeHTML, ifDefined, repeat, live, guard, nextFrame, sleep, ctor, range, loadScriptAsync, loadScriptsAsync, cache, tempClass }

const debug = {}

/**
 * Defines a custom element (window.customElements.define) and return whenDefined promise
 * @param components wait and load required components before define
 * @return whenDefined's promise
 * @usage `define('my-comp', MyCompClass, []).then( ...)`
 */
export async function define( tag_name, clss, components){

	// import comps (js & css) dependencies (when required right from the start)
	if( components && components.length){
		components = components.map( c => Component.load( c))
		await Promise.all( components)
	}

	window.customElements.define( tag_name, clss)

	return window.customElements.whenDefined( tag_name).then( () => {
		//log('check', 'when defined:', tag_name)
		if( tag_name === 'vision-stage'){
			app.resize()
			app.classList.add('resized')
			app.updateForURL() //! do not delay; this sets .params and they might be used immediately in callbacks

			setTimeout( () => {
				q(':root > body > #loading').classList.add('faded')
				setTimeout( () => { q(':root > body > #loading').remove() }, 1000)
			}, 100)

			setTimeout( e => {
				window.addEventListener('resize', debounce( app.resize.bind( app), 300, 300)),
				2000
			})
			// ->  Arg 1: debounce dly (wont callback until you stop calling and after a delay),
			// ->  Arg 2: throttle dly (wont callback more often than at this frequency)
		}
	})
}


let app, store, store_namespace, after_resize_timeout
let ASPECT_RATIOS
// let active_sw, redundant

export const is_mac = navigator.platform === 'MacIntel'
const is_iOS = /iPad|iPhone|iPod/.test( navigator.platform) ||
							 (is_mac && navigator.maxTouchPoints > 1)
const is_safari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent)
const isScrollbarVisible = (element) => element.scrollHeight > element.clientHeight

// Will reference all components having an onResized method
// to call them after window is resized
const resize_watchers = new Set()


const icons_mappings = {
	delete: 'trash',
	remove: 'cross',
	// signs
	'+': 'plus',
	'x': 'cross'
}
export function useSVG( id, clss='', ar, vb='0 0 32 32'){
	let src = app.icons_path || '/_assets/images/icons.svg'
	if( icons_mappings[id])
		id = icons_mappings[id]
	//log('check', 'svg path:', src)
	return html`<svg class=${clss ? 'icon '+clss : 'icon'} viewBox=${vb} preserveAspectRatio=${ ifDefined( ar) }>
		<use href='${src}#${id}'/>
	</svg>`
}

// so we don't load the same component Class multiple times
const loaded_components = new Set()

// Component base class to be extended by our custom elements
export class Component extends HTMLElement {

	constructor(){
		super()
		if( this.localName === 'vision-stage'){
			app = this
			this.langs = this.getAttribute('langs').split(/\s*,\s/)
			const path = decodeURI(location.pathname)
			this.app_name =
			this.ns = path.replace(/\//g, '') || 'home' //this.getAttribute('store')
			log('info', 'app_name (pathname):', this.ns)
			initStore( this.ns)
			this.buildCSSForLangs()
		}
		this._init()

		//if( this.localName==='menu-options') log('err', 'side menu strings?', this.strings)
		//// default; changing lang updates ALL components
		if( this.localName !== 'vision-stage') // && this.strings ! some comp may use string from a .target
			this.uses([['vision-stage', 'lang']])
	}

	connectedCallback(){ /// VisionStage overrides this
		//log('check', 'base component connected')
		this.onConnected && this.onConnected()
	}

	_init(){
		this.is_component = true
		this._state = {}
		const _ctor = ctor( this)
		let properties
		if( _ctor.properties && _ctor._properties)
			properties = Object.assign( {}, _ctor._properties, _ctor.properties)
		else
			properties = _ctor.properties || _ctor._properties

		// to array of [key,val]
		let flat_properties = properties ? Object.entries( properties) : []
		for( let [prop, desc] of flat_properties){
			if( !isObject( desc)) // wrap if primitive value
				desc = { value: desc }

			else if( desc.stored && !this.id && debug.store){
				log('warn', '--trying to store:', prop, '...but no id on element (for store); will use the tagName as the store key', '<'+this.tagName+'>','*** MAKE SURE THAT THIS ELEMENT IS ONLY USED ONCE ***')
				//throw Error('an element needs an id to be stored, tag:' + this.tagName)
			}
			let store_id = this.id||this.localName
			let stored_val = !!store_id ? storedValue( store_id, prop) : undefined
			if( stored_val !== undefined){
				//log('pink', 'stored val:', prop, stored_val, desc.stored)
				if( desc.stored)
					this._state[ prop] = stored_val
				else //! DELETE / CLEAN UP
					saveStore( store_id, prop, null, true)
			}
			else if( desc.stored){ // store initial value
				//if( debug.store)
				//log('info','--storing initial value:', store_id, prop, desc.value)
				saveStore( store_id, prop, desc.value)
			}

			if( desc.class){
				this.classList.toggle( desc.class, !!desc.value)
			}

			if( desc.attribute){ // ['open', 'bool']
				//!! wait for ctor to finish, else attr will be set to prop initial value before we read initial attr value
				requestAnimationFrame( t => {
					if( typeof desc.attribute === 'string'){
						//log('err', 'setup attr:', desc.attribute, desc.value, this)
						this.setAttribute( desc.attribute, desc.value)
					}
					else { // Array
						let attr = desc.attribute[0]
						if( desc.attribute[1] === 'bool'){
							if( desc.value === true)
								this.setAttribute( attr, '')
							else
								this.removeAttribute( attr)
						}
						else // we shouldnt need this, use string instead
							this.setAttribute( attr, desc.value)
					}
				})
			}

			Object.defineProperty( this, prop, {
				get(){
					//log('warn','GET', prop, '=>', this['__'+prop] )
					//// can use a getter on desc for computed prop
					return desc.getter ? desc.getter.call( this, this._state[ prop]) : this._state[ prop]
				},
				set( val){ /// SET:
					//log('pink', 'SET prop:', prop, 'val:', val)
					let store_id = this.id||this.localName
					if( !store_id){
						log('err', 'no store id, debugger...')
						debugger
					}
					if( prop in properties){ //// in? ==> is a reactive prop

						let prev_val = this._state[ prop]
						if( desc.transformer && !this.bypass_transformer)
							val = desc.transformer.call( this, val, prev_val, desc.value, stored_val)

						if( desc.stored){
							/// throttled_saveStore will only be fired once – though it may be called with different params...
							/// like rx and ry during a continuous dragging, then only one of them would be stored in the end
							//+ so store value directly and leave the global localstorage saving for the throttled callback
							store[ store_id] = store[ store_id] || {}
							store[ store_id][ prop] = val
							throttled_saveStore() /// global store (will be called at least once after multiple)
						}

						this._state[ prop] = val

						if( !this.block_watchers)
							desc.watcher && desc.watcher.call( this, val, prev_val)

						if( desc.attribute){ /// ['open', 'bool']
							if( typeof desc.attribute === 'string'){
								this.setAttribute( desc.attribute, val)
							}
							else { // Array
								let attr = desc.attribute[0]
								if( desc.attribute[1] === 'bool'){
									if( val === true)
										this.setAttribute( attr, '')
									else
										this.removeAttribute( attr)
								}
								else
									this.setAttribute( attr, val)
							}
						}

						if( desc.class){
							this.classList.toggle( desc.class, !!val)
						}

						this.render()

						//if( debug.renders && this.renders) log('err','this, renders:', prop, this.renders, this.renders.get( prop))

						// take care of dependencies ( this.uses([target,propA,propB]) )
						if( this.renders && this.renders.has( prop)){
							requestAnimationFrame( e => {
								for( let render_target of this.renders.get( prop)){
									if( debug.renders) log('check', 'prop, render target:', prop, render_target)
									render_target.render()
								}
							})
						}
					}
					else {
						log('err','NO own prop on this:', prop, properties)
					}
				}
			})

			const v = stored_val!==undefined ? stored_val : desc.value

			if( desc.init_watcher)
				this[ prop] = v
			else  // init "silently": no watcher/transformer etc...
				this._state[ prop] = v
		}

		// combine attribs and static strings
		const strings = (_ctor.strings ? clone( _ctor.strings) : {})

		if( _ctor._strings){
			for( let l in _ctor._strings){
				strings[ l] = strings[ l] || {}
				Object.assign( strings[ l], _ctor._strings[ l])
			}
		}

		let no_strings = !_ctor.strings

		for( let name of this.getAttributeNames()){
			if( name.startsWith('strings')){
				no_strings = false
				let lang = name.includes(':') ? name.split(':')[1] : undefined //app.langs[0]
				let values = objectFromString( this.getAttribute( name))
				//log('purple', 'got strings from attr:', values)

				if( lang==='*' || !lang){
					// * all : define first if others; need to be overriden with specific langs
					// assign same values to all languages
					for( let l of app.langs){
						strings[ l] = strings[ l] || {}
						Object.assign( strings[ l], values)
					}
				}
				else {
					if( !strings[ lang])
						strings[ lang] = {}
					Object.assign( strings[ lang], values)
				}
				this.removeAttribute( name)
			}
			// single string definition -> // string:hello="fr: Allô le monde, en: Hello world"
			else if( name.startsWith('string:')){
				let str_name = name.split(':')[1]
				let val = this.getAttribute( name)
				//log('check', 'str_name:', str_name, val)
				try {
					val = objectFromString( val)
				}
				catch {
					log('err', 'problem with string:name="val":\nformat should be object-like, each key a lang code.\nNow:', this.getAttribute( name))
				}
				for( let k in val){
					strings[ k] = strings[ k] || {}
					strings[ k][ str_name] = val[ k]
				}
				this.removeAttribute( name)
			}
		}

		if( !no_strings){

			if( !app.langs){
				log('err', 'no app langs yet', this)
			}
			this.strings = strings
			// get / set string
			// the default lang obj should contains all strings keys; others might miss some
			let default_lang_strings = strings[ app.langs[0]]
			// if we have strings KEYS, store each as this.$str
			if( default_lang_strings){
				for( let name of Object.keys( default_lang_strings)){
					Object.defineProperty( this, '$'+name.replace(/-/g,'_'), {
						get(){
							return this.getString( name)
						},
						set(){ throw 'cannot set a string' }
					})
				}
			}
		}

		if( this.onResized && !resize_watchers.has( this)){
			resize_watchers.add( this)
			//log('check', 'resize_watchers	:', resize_watchers)
		}

		if( _ctor.attributes){
			for( let attr of _ctor.attributes){
				this[ attr] = this.getAttribute( attr)
			}
		}

		if( _ctor.sounds)
			app.sounds_list = _ctor.sounds
	}

	//  ->  When these [[comp, ...props]] changes, also render me –
	uses( entries){
		//log('pink', 'this, uses:', this, entries)
		//
		// -> for each target:  target.renders = Map([['prop1', Set.add(this)],[prop2, Set.add(this)]])
		// 											app.renders = Map([['lang', ADD this]])
		for( let entry of entries){
			/// non destructive...
			let prop_holder = entry[0]
			let props = entry.slice(1) /// copy the rest
			// if( props.length > 1) /// 1 => only lang
			//! @TODO only `uses` lang when a comp actually uses lang ?
			//! -> check for: 1. [lang] attr and 2. strings is not empty
			if( debug.uses && props.length){
				log('info', '<'+(this.id||this.tagName+'::'+this.className)+'>', 'will render when any of [',...props,'] on', '<'+prop_holder+'>', 'is set')
			}

			if( typeof prop_holder === 'string'){
				let prop_holder_selector = prop_holder
				prop_holder = q( prop_holder_selector)
				if( !prop_holder)
					throw 'uses(); prop_holder do not exist (yet?): ' + prop_holder_selector
					//debugger
			}
			if( !prop_holder) {
				log('err', 'no prop holder, entry:', entry)
				log('info', '<'+(this.id||this.tagName+'::'+this.className)+'>', 'will render when any of [',...props,'] on', '<'+prop_holder+'>', 'is set')
				debugger
			}
			prop_holder.renders = prop_holder.renders || new Map()

			for( let prop of props){
				if( prop_holder.renders.has( prop)) /// value exist (Set of render targets)
					prop_holder.renders.get( prop).add( this)
				else
					prop_holder.renders.set( prop, new Set([this]))
			}
		}
	}

	/** set an attribute and render this */
	attr( name, value){
		this.setAttribute( name, value)
		this.render()
	}

	async render( evt_ctx){
		if( !this.template){
			if( this.localName !== 'vision-stage')
				log('warn', '--no template, cannot render(): '+ this.id +', '+ this.tagName)
			return
		}

		const debugging = debug.render===true ||
			Array.isArray( debug.render) && debug.render.includes( this.id||this.classList[0])

		if( !this.needsRender){
			this.needsRender = true
			await nextFrame()
			this.needsRender = false
			const tmpl = this.template()
			//! => we might return null if something is missing for rendering the template
			if( !tmpl){ // === null){
				if( debugging)
					log('err', '--tmpl: no value -> no render', this.id, this.localName)
				return
			}

			!this.rendered && this.beforeFirstRender && this.beforeFirstRender()
			if( debugging)
				log('gold','--GOT TMPL, RENDER ', this.localName, (this.id||this.classList[0]))

			//log('warn', 'eventContext: this:', this)
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
					this.onResized( app.REM, ...this.skipped_params)
					this.skipped_params = null
				}
				//-- delete this.onFirstRendered
				/// -> IT'S SUPPOSEDLY BETTER NOT TO DELETE ANYTHING AFTER AN OBJECT DEFINITION
			}
			this._onRendered && this._onRendered()
			this.onRendered && this.onRendered()
		}
		else if( debugging)
			log('gold','already needsRender, waiting:', this.localName, (this.id||this.classList[0]))
	}

	q( sel){
		return this.querySelector( sel)
	}
	/** query elements and transform to an array */
	qAll( sel){
		return Array.from( this.querySelectorAll( sel))
	}

	/**
	 * ! warning: will return result of unsafeHTML if contains HTML (looks for <tag> or HTML entity),
	 * ! use raw=true argument if we need raw string to use outside a lit-html template
	 * ! (like with prop binding or directly setting .innerHTML)
	 * @str_name the key for the requested string
	 * @return the string corresponding to the actual language
	 */
	getString( str_name, raw=false){
		if( !str_name) return
		let lang = (app || this).lang
		let strings_for_lang = this.strings[ lang]
		let str = strings_for_lang && strings_for_lang[ str_name]

		if( !str){ // try special prefix for scenes '$'
			str = strings_for_lang && strings_for_lang[ '$'+str_name]
		}
		// try with default lang
		if( !str){
			strings_for_lang = this.strings[ app.langs[0]]
			str = strings_for_lang && strings_for_lang[ str_name]
		}
		if( !str){
			log('warn','NO STRING FOUND FOR:', str_name)//, 'for:', this)
			return ''
		}
		return raw ? str :
			containsHTML( str) ? unsafeHTML( str) :
			str.startsWith('>') ? unsafeHTML( str.slice(1)) : // EXPLICITLY DECLARED AS HTML (! what cannot be detected still?)
			str
	}

	static async load( file_path, scripts){
		if( debug.load)
			log('ok','load() file_path:', file_path)

		// first check if already loaded
		if( loaded_components.has( file_path)){
			//log('info', 'component already loaded:', file_path)
			return
		}
		else
			loaded_components.add( file_path)

		/*if( scripts){
			scripts = scripts.split(/\s*,?\s/)
				.map( src => loadScriptAsync( src.includes('/') ? src : `/scripts/${src}`))
			await Promise.all( scripts)
		}*/

		let js, css
    if( Array.isArray( file_path)){
      js = file_path[0] + '.js'
      css = file_path[1] + '.css'
    }
    else if( file_path.endsWith('.js')){
      js = file_path
    }
    else { // normal: extensionless => same for both
      js = file_path + '.js'
      css = file_path.replace('.min','') + '.css'
    }
		//log('check', 'css:', css)
		// if starts with / or ./ leave as is (rel to pathname), else assume is in /_components/
		if( ! /^\.?\//.test( css))
			css = `${COMPONENTS_DIR}${ css }`
		else
			css = location.pathname + css

		if( !/^\.?\//.test( js))
			js = `${COMPONENTS_DIR}${ js }`
		else
			js = location.pathname + js

		log('check', 'load js, css? :', js, css)
		// make sure CSS is loaded before we import js so no flash of unstyled components
		css && await loadStyleSheetAsync( css)
		return import( js)
	}

	static loadAll( ...components){
		components = components.map( c => Component.load( c))
		return Promise.all( components)
	}
}


// App base class
export class VisionStage extends Component {

	constructor(){
		super()
		// -> disable right-clicking
		// this.addEventListener( 'contextmenu', e => e.preventDefault())
		this.classList.add('app')
		this.is_iOS = is_iOS
		this.scrolls = this.classList.contains('scroll')
		window.addEventListener('popstate', () => this.updateForURL( true))

		// Save store on pagehide / unload
		if( !CLEAR_STORE){
			const termination_event = 'onpagehide' in self ? 'pagehide' : 'unload';
			window.addEventListener( termination_event, e => saveStore())
		}

		// auto filled by each component
		this.foldable_button_select_components = new Set()

		document.body.addEventListener('mousedown', (e) => {

			document.body.classList.add('using-mouse')

			// means we click on a button-select component, leave it manage clicks
			if( e.target.closest('button-select[fold]'))
				return
			// else we clicked something else, close all button-selects
			for( let sel_btn of this.foldable_button_select_components){
				// log('pink', 'close button-select:', sel_btn)
				sel_btn.folded = true
			}
		})
		document.body.addEventListener('keydown', (e) => {
			if( !e.key) return // -> autofill
			document.body.classList.remove('using-mouse')
		})

		app.updateAspect( ctor( this).aspect)
	}

	connectedCallback(){
		//log('ok', 'APP connected', this.localName)

		this.url_segments =
			location.pathname.split('/').filter( item => item!=='').map( item => decodeURI( item))
		this.onConnected && this.onConnected() // -> before setting scene

		if( this.$doc_title){
			document.title = this.$doc_title + (this.scene ? (' #' + this.scene) : '')
		}
		// else title remain as defined in the <title> tag

		if( this.localName === 'vision-stage'){
			setTimeout( e => {
				this.faded = false
			}, 200)
		}
		else log('err','What???')
	}

	_onFirstRendered(){
		// const veil = el('div','',{ id:'veil', class: 'layer' })
		// veil.addEventListener('pointerdown', this._closeOpenedMenu)
		// this.append( veil)
		if( !this.menu_scenes)
			this.classList.remove('waiting-scenes')
		this.lang = this.lang // trigger watcher

		// if we use app-header, set class: .has-app-header, and only then set listener:
		// if( this.q('app-header')){
		// 	this.classList.add('has-app-header')
		// 	main = this.q('main')
		// 	if( !main) return
		// 	const throttledScrollListener = debounce( this.onMainScroll.bind( this), 0, 500)
		// 	main.addEventListener('scroll', throttledScrollListener)
		// }
	}

	// onMainScroll(e){
	// 	this.classList.toggle('scrolled', main.scrollTop > 10)
	// }

	afterResize( e){
		app.resizing = false
	}

	resize(){
		if( this.resize_locked)
			return // mobile + menu auth open -> prevent resize by onscreen keyboard

		this.resizing = true
		clearTimeout( after_resize_timeout)
		after_resize_timeout = setTimeout( this.afterResize, 1000)

		//tempClass( this, 'resizing', 1) //! tempClass doesn't reset its timeout...
		const threshold = ASPECT_RATIOS.threshold
		const root = document.documentElement
		const FSD = this.font_size_decimals || FONT_SIZE_DECIMALS
		//log('check', 'FSD:', FSD)
		let w = window.innerWidth,
				h = window.innerHeight
		const AR = { now: parseFloat( cleanNum( w / h)), min: 0 }

		const is_portrait = (AR.now < threshold&&ASPECT_RATIOS['tall']) || !ASPECT_RATIOS['wide'] // true if we specify only portrait
		if( this.is_portrait !== is_portrait) // only set if different; causes render EACH TIME (A LOT)
			this.is_portrait = is_portrait
		// defines what relative height we want (in rem)
		let height_rem =
			this.is_portrait && ASPECT_RATIOS.port_height ||
			ASPECT_RATIOS.land_height ||
			40

		if( this.is_portrait){
			AR.min = ASPECT_RATIOS['x-tall'] 					// STAGE TALLEST
			AR.base = ASPECT_RATIOS['tall'] 					// STAGE NORMAL
			AR.max = ASPECT_RATIOS['medium'] 					// STAGE WIDEST
				AR.tall = AR.base
		}
		else {
			AR.min =
			AR.base = ASPECT_RATIOS['wide']||1.6			// STAGE NORMAL
			AR.max = ASPECT_RATIOS['x-wide']||AR.base // STAGE WIDEST
				AR.wide = AR.base
		}

		let margin = 0,
			above_ultra_wide = AR.now > AR.max,
			below_land_base = AR.now < AR.base

		const cm = ASPECT_RATIOS['cross-margin']

		if( this.is_portrait){
			// just below threshold, side "black bars"
			if( cm && AR.now > AR.max){
				margin = cm
			}
		}
		else { // landscape
			margin =
				(above_ultra_wide || below_land_base) &&
					(cm || ASPECT_RATIOS['wide-cross-margin']) ||
				above_ultra_wide &&
					ASPECT_RATIOS['x-wide-cross-margin'] ||
					0
		}

		this.setAttribute('orientation', this.is_portrait ? 'portrait' : 'landscape')

		//!! eventually we'll need to pass this info from source (inp.unit==='%')
		if( typeof margin === 'string') // assumes %, implicit or explicit
			margin = parseFloat(margin) * h / 100

		// Adjust size for margin
		if( AR.now > AR.max){
			if( margin)
				h -= (margin * 2)
			w = Math.floor( h * AR.max) // smallest of: window width or max AR
		}
		else if( AR.base && AR.now < AR.base){ // was (AR.base||AR.min) ?
			if( margin)
				w -= margin * 2
			if( this.margin)
				h -= margin * 2
			// cap height (h) to base AR
			const MIN_AR = 1 / (AR.wide || AR.min)
			h = Math.floor( Math.min( w * MIN_AR, h)) // smallest of: window height (h) or base AR
		}
		else if( this.margin){
			w -= margin * 2
			h -= margin * 2
		}
		this.classList.toggle('has-margins', !!margin)

		this.sth = h
		this.stw = w

		this.AR = w/h
		// limit stage's height based on portrait's min AR
		const base_h = !this.is_portrait ? h : Math.min( h, w * (1/AR.base))
		root.style.setProperty('--stw',w+'px')
		root.style.setProperty('--sth',h+'px')

		let fs = Math.floor( base_h / height_rem * 10**FSD) / 10**FSD
		root.style.fontSize =	fs + 'px'

		this.scale = fs / 16
		log('purple', 'this.scale:', this.scale)
			// -> floor else we might overflow and get scrollbar
		//log('info', 'fontSize :', root.style.fontSize)
		// VALUE OF ONE REM IN PX (0.00)
		this.REM = Math.round((base_h / height_rem) * 100) / 100

		// log('purple', 'resize() ->resize_watchers:', ...resize_watchers)
		for( let comp of resize_watchers){ // components with onResized method
			//log('check', 'call resize for comp?, rendered? :', comp.rendered, comp)
			if( comp.rendered){
				comp.onResized( this.REM, AR, ASPECT_RATIOS)
			}
			else {
				//log('warn', 'skipped onResized', this)
				comp.skipped_onResized = true
				comp.skipped_params = [AR,ASPECT_RATIOS]

			}
		}


		// WE MIGHT WANT TO STYLE THE STAGE DIFFERENTLY WHEN THERE'S A SCROLLBAR
		// e.g. BY DEFAULT WE USE ROUNDED CORNERS WHEN WE SET A MARGIN / CROSS-MARGIN ATTR ON <vision-stage>, BUT IT BECOME "UGLY" WITH A SCROLLBAR, SO WE REMOVE ROUNDED CORNERS THEN…
		if( isScrollbarVisible( app))
			document.body.classList.add('has-scrollbar')
	}

	updateAspect( ratios){
		if(!this.initial_ratios)
			this.initial_ratios = ratios

		if( !ratios)
			ratios = this.initial_ratios

		ASPECT_RATIOS = ratios

		if( ASPECT_RATIOS['tall']){
			if( !ASPECT_RATIOS['x-tall'])
				ASPECT_RATIOS['x-tall'] = ASPECT_RATIOS['tall']
			if( !ASPECT_RATIOS['medium'])
				ASPECT_RATIOS['medium'] = ASPECT_RATIOS['tall']
		}

		if( ASPECT_RATIOS['wide']){
			if( !ASPECT_RATIOS['x-wide'])
				ASPECT_RATIOS['x-wide'] = ASPECT_RATIOS['wide']
		}

		if( !ASPECT_RATIOS.threshold)
			ASPECT_RATIOS.threshold = 1

		if( !ASPECT_RATIOS['cross-margin'])
			ASPECT_RATIOS['cross-margin'] = 0

		this.resize()

	}

	updateForURL( pop=false){

		this.params = location.hash.slice(1).split('/')
		// scene from first param
		let scene = decodeURI( this.params[0]) || ''

		if( scene.includes('--')){
			this.transit( ...scene.split('--'))
			return
		}

		// if( !pop)
		// 	// we might not be ready to render
		// 	this._state.scene = scene
		// else
		//if( pop) log('info', 'pop for scene:', scene)
		//else log('info', 'initial updateForURL();', scene)
		// log('check', 'this::', this)

		/// must know if pop or not
		this.popping = true
		this.scene = scene
		// log('info', 'updateForURL(); scene:', scene, 'pop?', pop)
	}


	// must be called from the app after user event, or onConnected but then the first time it won't play on iOS
	/**
	 * Basic audio playback with Web Audio. No lib! ;)
	 * the main limitation is that the volume, althought it can be adjusted by individual sounds, is global, so if two sounds with different volume option||default are overlapping, the volume will sharply change; the ideal is to have sounds prerendered at the right volume. This does not concern this.global_volume which is another layer (fract. multiplier) that the user can adjust.
	 * Sounds are fetched and stored: this.sounds[ name] = { audio_buffer, options }
	 * @return {Promise}
	 */
	setupSounds(){
		const sounds_data = ctor( this).sounds
		if( !sounds_data)
			return

		this.sounds = {}
		window.AudioContext = window.AudioContext || window.webkitAudioContext
		this.audio_context = new window.AudioContext()
		this.gain_node = this.audio_context.createGain() // global volume control
		// more verbose, eventually delete...
		if( is_iOS || is_safari){
			return Promise.all(
				sounds_data.map( ([name, url, options={}]) => fetch( url)
					.then( response => response.arrayBuffer())
					.then( array_buffer => {
						this.audio_context.decodeAudioData( array_buffer, audio_buffer => {
							this.sounds[ name] = { audio_buffer, options }
						})
						return 'success'
					})
				)
			)
		}
		else
			return Promise.all(
				sounds_data.map( ([name, url, options={}]) => fetch( url)
					.then( response => response.arrayBuffer())
					.then( array_buffer => this.audio_context.decodeAudioData( array_buffer))
					.then( audio_buffer => this.sounds[ name] = { audio_buffer, options })
					.catch( err => log('err',err))
				)
			)
	}
	playSound( name){
		if( !this.sounds[ name]){
			log('err', 'no sound with name:', name, 'check if sounds are set up')
			return
		}
		const { audio_buffer, options } = this.sounds[ name]
		//log('info', 'playSound:', name, options.volume)
		const source = this.audio_context.createBufferSource()
		source.buffer = audio_buffer
		this.gain_node.gain.value = this.global_volume * (options.volume || 1)
		source.connect( this.gain_node).connect( this.audio_context.destination)
		this.playing_source = source

		if( options.delay)
			setTimeout( e => {
				source.start()
			}, options.delay)
		else
			source.start()
	}
	stopSound( name){
		//log('err', 'stop:', this.playing_source)
		if( this.playing_source){
			this.playing_source.stop()
			this.playing_source = null
		}
	}

	// build CSS to hide elements with a lang attribute not matching the app's
	buildCSSForLangs(){
		let str = ''
		for( let lang of this.langs)
			str += `vision-stage[lang='${lang}'] [lang]:not([lang='${lang}']) { display: none !important }\n`
		const stylesheet = document.createElement('style')
		stylesheet.textContent = str
	  document.head.appendChild( stylesheet)
	}
}

// these static members are underscore prefix so they are merged and not overriden next by MyApp.properties

VisionStage._properties = {
	title: '',
	resizing: {
		value: false,
		class: 'resizing',
	},
	global_volume: {
		value:.6,
		stored:true
	},
	lang: {
		value: navigator.language.slice(0,2),
		stored: true,
		watcher( val, prev){
			// set complete lang code on <html> for speak function
			let [lang, country] = navigator.language.split('-')
			document.documentElement.setAttribute('lang', val + '-' + country)
			this.country = country
			// set val (2 letter) on this element for CSS auto hide of els w/ [lang] not matching
			this.setAttribute('lang', val)

			if( this.$doc_title){
				document.title = this.$doc_title + (this.scene ? (' #' + this.scene) : '')
			}
			//log('info', 'lang, country:', lang, country)
		},
		//init_watcher: true // causes render (SET lang), maybe too soon, keep manual
		// -> instead just re-trigger after this is rendered (lang = lang)
	},

	// bool props defining CSS classes when true
	faded: {
		value: true,
		class: 'faded',
	},
	portrait: {
		value: false,
		class: 'portrait'
	},
	dark_mode: {
		value: false,
		stored: true,
		class: 'dark-mode'
	},
	is_iOS: {
		value: false,
		class: 'ios'
	},
	admin: {
		value: false,
		class: 'admin'
	},

	/// Menus

	// menu_options: null,
	// menu_auth: null,
	// opened_menu: { // <[opened-menu]>
	// 	value: '',
	// 	attribute: 'opened-menu',
	// 	watcher( val, prev){
	// 		//log('check', 'opened-menu:', val)
	// 		//if( !val) debugger
	// 		if( !this.scene && prev==='auth'&& !val && this.default_scene!==''){
	// 			this.menu_scenes && setTimeout( e => {
	// 				this.menu_scenes.open = true
	// 			}, 500)
	// 		}
	// 	}
	// },

	scenes: null,
	scene: {
		value: null, /// {}
		stored: false, //!! depends on url, should not override...
		watcher( val, prev){
			//log('pink', 'scene:', val, 'prev:', prev, 'last scene:', this.last_scene)
			if( this.$doc_title)
				document.title = this.$doc_title + (val ? (' #' + val) : '')

			this.setAttribute('scene', val)
			this.onSceneChanged && this.onSceneChanged( val, prev)

			if( !SCENE_HISTORY) return

			const requested_path = decodeURI(location.pathname + (val ? '#'+val : ''))
			const current_path = decodeURI( location.pathname+location.hash||'')
			const is_new_path = requested_path !== current_path
			const is_new_scene = val && val !== this.last_scene // so implies !!val
			const is_same_scene = val && val === this.last_scene
			//const is_new = is_new_scene||is_new_path
			const pop = this.popping
			this.popping = false // reset

			// condensed version of below
			// initial load
			const pop_scene_and_prev_is_null = 					 pop && prev===null
			const empty_scene_request = 								!pop && !val
			const new_scene_request_and_prev_exists = 	!pop && !!prev && is_new_scene // implies !!val
			const new_scene_request_and_prev_is_empty = !pop && prev==='' && is_new_scene
			const same_scene_request = !pop && is_same_scene

			/// what if: scene=A, scene='', scene=A ?
			const same_scene_and_prev_is_empty = 				!pop && prev==='' && is_same_scene

			if( pop_scene_and_prev_is_null || empty_scene_request || new_scene_request_and_prev_exists){
				history.pushState( null, '', requested_path)
				log('warn', 'shorthand pushState:', requested_path)
			}
			else if( new_scene_request_and_prev_is_empty || same_scene_request){
				// we've made a choice from nav menu
				//! replaces the empty scene entry in history, not the last scene...
				//! -> we still can have doubles (we must allow them in this case)
				history.replaceState( null, '', requested_path)
				log('warn', 'shorthand replaceState:', requested_path)
			}
			else {
				log('warn', 'shorthand; no action')
			}

			if( val)
				this.last_scene = val



			//log('purple', 'HISTORY REPLACE:', requested_path)
			/// FULL VERSION WITH LOGS FOR DEBUGGING
			/*
			if( !pop){
				if( val){
					if( is_new_scene){
						if( prev===''){
							// conds.push('!pop&&val&&is_new')
							history.replaceState( null, '', requested_path)
							log('purple', 'new scene; NO prev; REPLACE (prev empty) history', requested_path)
						}
						else {
							history.pushState( null, '', requested_path)
							log('purple', 'new scene; prev NOT EMPTY; PUSH history:', requested_path)
						}
					}
					else if( is_same_scene){
						log('red', 'SAME SCENE;', val, this.last_scene)
						/// embeded this logic also in shorthand above
						history.replaceState( null, '', requested_path)
					}
				}
				else {
					history.pushState( null, '', requested_path)
					log('ok', 'NO scene; PUSH (empty) history:', requested_path)
				}
			}
			else {
				if( prev===null){
					history.pushState( null, '', requested_path)
					log('purple', 'FIRST POP; (prev null); PUSH history:', requested_path)
				}
				else {
					log('notok', 'POP; do not touch history:', requested_path, 'PREV:', prev)
				}
			}
			*/



		},
	},
}

VisionStage._strings = {
	fr: {
		cached: "🌟 Appli installée&thinsp;! 🌟<br><small>Vous pouvez maintenant l'utiliser hors-ligne<br><i>(&#8239;gardez le Wi-Fi ou l'Ethernet de cet appareil activé&#8239;)</i></small>",
		update_ready: "🌟 Une mise à jour est prête 🌟<br><small>Veuillez rafraîchir la page.</small>",
		refresh: "Rafraîchir",
		later: "Plus tard",
		dark_mode: "Mode sombre",
	},
	en: {
		cached: "🌟 App is installed&hairsp;! 🌟<div class='message'>You can now use it offline<br><i>(&#8239;keep your device's Wi-Fi or Ethernet activated&#8239;)</i></div>", //🥳
		update_ready: "🌟 An update is ready 🌟<div>Please refresh the page.</div>",
		refresh: "Refresh",
		later: "Later",
		install_standalone: "Standalone window<small>Will install a shortcut</small>",
		dark_mode: "Dark Mode"
	}
}


///  STORE  ///

/** Parse store from localStorge or init a new one */
function initStore( ns){
	// log('check', 'init store:', ns)
	store_namespace = ns
	if( !ns){
		log('err', 'no store namespace');
		return
	}

	if( CLEAR_STORE){
		log('err','--CLEAR_STORE')
		store = {}
		localStorage.setItem( store_namespace, "{}")
		return
	}

	let stored_data = localStorage.getItem( ns);
	//log('ok','RAW:', stored_data)
	if( stored_data){
		try { store = JSON.parse( stored_data); }
		catch( err){
			log('err','JSON parse error')
			log('warn', 'stored_data:', stored_data)
		}
	}

	if( ! store || ! isObject( store)){
		if( debug.store) log('notok', 'NO STORE, CREATING ONE')
		store = {}
	}
	else if( debug.store) {
		log('ok', 'GOT store:')
		//log(JSON.stringify(store,null,2))
		log( store)
	}
}
/** Get a possibly stored value || undefined */
function storedValue( elem_id, prop){
	let s = store[ elem_id]
	if( debug.store) log('err', 'get stored:', s, 'elem_id:', elem_id)
	return s ? s[ prop] : undefined
}
/** either save after setting a prop on elem, or just save */
export function saveStore( elem_id, prop, val, remove=false){

	if( app && app.do_not_store) return

	//! was async: problem if used on unload event... cannot block
	//!  => should make async + another sync version for unload

	if( !store) return null //|| CLEAR_STORE

	//log('err', '--save to store, elem id:', elem_id)

	if( elem_id){ //// WE WANT TO SET A STORE VALUE BEFORE SAVING

		if( remove){
			log('err', 'DELETE:', elem_id, prop)
			if( store[ elem_id]){
				delete store[ elem_id][ prop]
				/// if this elem has no more stored props, delete its store
				if( ! Object.keys( store[ elem_id]).length)
					delete store[ elem_id]
			}
		}
		else {
			if( debug.store) log('pink', 'STORE:', elem_id, prop, val)
			if( store[ elem_id] === undefined)
				store[ elem_id] = {}
			store[ elem_id][ prop] = val
		}
	}

	// if( !willSave){ //// BATCH CALLS
	// willSave = true
	// await 0;
	// willSave = false
	const str = JSON.stringify( store)
	if( debug.store){
		log('pink', '--will store string:', str)
	}
	localStorage.setItem( store_namespace, str)
	// }
}
export function clearStore( e){
	log('err', 'clear store')
	app.do_not_store = true // prevent storing on before reload
	localStorage.removeItem( store_namespace)
	log('err', 'Store cleared')
	location.reload()
}
//  Setting many props at once with stored:true, each will call saveStore (writes to LS),
//  so use a throttled "version" instead
const throttled_saveStore = debounce( saveStore, 200)


// screenfull.min.js
!function(){"use strict";var e=window.document,n=function(){for(var n,r=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],l=0,t=r.length,c={};l<t;l++)if((n=r[l])&&n[1]in e){for(l=0;l<n.length;l++)c[r[0][l]]=n[l];return c}return!1}(),r={change:n.fullscreenchange,error:n.fullscreenerror},l={request:function(r,l){return new Promise(function(t,c){var u=function(){this.off("change",u),t()}.bind(this);this.on("change",u);var s=(r=r||e.documentElement)[n.requestFullscreen](l);s instanceof Promise&&s.then(u).catch(c)}.bind(this))},exit:function(){return new Promise(function(r,l){if(this.isFullscreen){var t=function(){this.off("change",t),r()}.bind(this);this.on("change",t);var c=e[n.exitFullscreen]();c instanceof Promise&&c.then(t).catch(l)}else r()}.bind(this))},toggle:function(e,n){return this.isFullscreen?this.exit():this.request(e,n)},onchange:function(e){this.on("change",e)},onerror:function(e){this.on("error",e)},on:function(n,l){var t=r[n];t&&e.addEventListener(t,l,!1)},off:function(n,l){var t=r[n];t&&e.removeEventListener(t,l,!1)},raw:n};n?(Object.defineProperties(l,{isFullscreen:{get:function(){return Boolean(e[n.fullscreenElement])}},element:{enumerable:!0,get:function(){return e[n.fullscreenElement]}},isEnabled:{enumerable:!0,get:function(){return Boolean(e[n.fullscreenEnabled])}}}),window.screenfull=l):window.screenfull={isEnabled:!1}}();

// if needed, should be a member of app
// export const px2rem = (px, decimals=FONT_SIZE_DECIMALS) => {
// 	return app && px/app.REM || 0 // ex: px=100, app.REM=16 = 100/16 = 6.25rem
// }
/*
export function STR( str_name, raw=false){
	if( !str_name) return
	let lang = this.lang
	let strings_for_lang = this.strings[ lang]
	let str = strings_for_lang && strings_for_lang[ str_name]

	if( !str){ // try special prefix for scenes '$'
		str = strings_for_lang && strings_for_lang[ '$'+str_name]
	}
	// try with default lang
	if( !str){
		strings_for_lang = this.strings[ app.langs[0]]
		str = strings_for_lang && strings_for_lang[ str_name]
	}
	if( !str){
		log('warn','NO STRING FOUND FOR:', str_name)//, 'for:', this)
		return ''
	}
	return raw ? str :
		containsHTML( str) ? unsafeHTML( str) :
		str.startsWith('>') ? unsafeHTML( str.slice(1)) : // EXPLICITLY DECLARED AS HTML (! what cannot be detected still?)
		str
}
*/

/*
		CTOR:

		// this.getActiveSW().then( SW => {
		// 	active_sw = SW || null
		// })

		// let icons_path = this.getAttribute('icons')
		// if( icons_path)
		// 	this.icons_path = icons_path


		// this._onInstallable = this.onInstallable.bind( this)
		// this._onClickInstall = this.onClickInstall.bind( this)
		// window.addEventListener('beforeinstallprompt', this._onInstallable)
 */