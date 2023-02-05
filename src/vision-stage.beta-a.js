/// --- Vision Stage Framework --- ///

const VERSION = '1.0.0'

/** See infos for each option at `define(…)` */
export const config = {
	sw: null,
	components_dir: '/_components/',
	update_check_min: 30,
	font_size_decimals: 0,
	icons_path: '/_assets/images/icons.svg',
	icons_mappings: {
		delete: 'trash',
		remove: 'cross',
		add: 'plus',
		// signs
		'+': 'plus',
		'x': 'cross'
	},
	icons_viewbox: {
		'double-chevron-right': '0 0 1024 1024',
		'arrow-right-rounded': '0 0 45.6 45.6',
		'fanion': '0 -11 100 120',
	},
	night_modes: [0,1], // CSS [night-mode='1|2'] styles are pre-defined
}

/// lit-html 1.4.1
// Bare imports: this file is intended to be bundled w/ rollup from node_modules
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
// import { templateContent }
// 	from 'lit-html/directives/template-content.js'

import { q, debounce, isObject, ctor, clone, loadStyleSheetAsync, containsHTML, nextFrame, cleanNum, is_iOS, is_safari, clamp, strIf  }
	from './utils-core.js'

export { log, html, svg, unsafeHTML, ifDefined, repeat, live, guard, cache }



// z-console is kept out of the bundle by rollup externals option;
// we need to set it as a blackboxed file in chrome TO GET REAL LINE NUMBERS in console!
import log from './z-console.js'
log('info','•• Vision Stage ••', VERSION, '(w/ lit-html 1.4.1)')


const stores = {}
const debug = { /* load:true */ }

// Will reference all components having an onResized method
// to call them after window is resized
const resize_watchers = new Set()

// keep track of the loaded ones, so we don't load the same component Class multiple times
const loaded_components = new Set()

let app, after_resize_timeout, aspect_ratios, active_sw, redundant

/** Component base class, to be extended by our components **/
export class Component extends HTMLElement {

	constructor(){
		// Note: this (Component ctor) runs *after* VisionStage (app) ctor
		super()
		if( this.localName === 'vision-stage'){
			app = this
			this.id = 'app'
			this.languages = ctor(this).languages
			const path = decodeURI( location.pathname)
			this.app_name =
			this.ns = path.slice(1,-1).replace(/\//g, '-') || 'home'
			// log('err', 'app_name (for props local storage key):', this.ns)
			initStore(this.ns)

			this.buildCSSForLangs()
		}
		this.#init()

		// default; changing app.lang updates ALL components
		// && this.strings ! some comp may use string from a .target
		if( this.localName !== 'vision-stage')
			this.uses([['vision-stage', 'lang']])
	}

	connectedCallback(){ // VisionStage overrides this
		this.onConnected && this.onConnected()
	}

	#init(){
		const _ctor = ctor( this)
		this.is_component = true
		this._state = {}

		let properties
		if (_ctor.properties && _ctor._properties)
			properties = Object.assign( {}, _ctor._properties, _ctor.properties)
		else
			properties = _ctor.properties || _ctor._properties

		// to array of [key,val]
		let flat_properties = properties ? Object.entries( properties) : []

		for (let [prop, desc] of flat_properties) {

			if (!isObject( desc)) // wrap if primitive value
				desc = { value: desc }

			else if (desc.storable && !this.id){
				log('warn', 'trying to store:', prop, '...but no id on element (for store); ')
				// will use the tagName as the store key', '<'+this.tagName+'>','*** MAKE SURE THAT THIS ELEMENT IS ONLY USED ONCE ***')
				// throw Error('an element needs an id to be stored, tag:' + this.tagName)
			}
			let store_id = this.id
			let ns = typeof desc.storable === 'string' ? desc.storable : this.ns
			//log('err', 'Got ns:', ns, prop)
			let stored_val = store_id ? storedValue(ns, store_id, prop) : undefined
			let use_value = stored_val !== undefined ? stored_val : desc.value

			if (stored_val !== undefined){

				if (desc.delete_storable){
					saveStore(ns, store_id, prop, null, true)
				}
				else if (desc.storable /* && !this.params?.find(p=>p[0]===prop) */){
					//log('err', 'set stored value for prop:', prop, stored_val, this.params)
					this._state[prop] = stored_val

					//! not sure it is needed here…
					if (typeof desc.storable === 'string' && !stores[ns]){
						//log('err', 'init global store:', ns, 'stored_val:', stored_val)
						initStore(ns)
					}
				}
				else //! DELETE / CLEAN UP
					saveStore(this.ns, store_id, prop, null, true)
			}
			else if (desc.storable){ // store initial value
				if (typeof desc.storable === 'string' && !stores[ns]){
					initStore(ns)
				}
				// log('err', 'Comp init; saveStore:', ns, store_id, prop, desc.value)
				saveStore(ns, store_id, prop, desc.value)
			}

			if (desc.sync_to_url_param)
				this.sync_props_to_params ||= true

			if (desc.class)
				this.classList.toggle( desc.class, !!use_value)

			if (desc.attribute){ // ['open', 'bool']
				//! wait for ctor to finish, else attr will be set to prop initial value before we read initial attr value
				requestAnimationFrame( () => {

					if( typeof desc.attribute === 'string'){
						this.setAttribute( desc.attribute, use_value)
					}
					else { // Array
						let attr = desc.attribute[0]
						// remove if falsy value, otherwise set to empty value ("")
						if( desc.attribute[1] === 'bool'){
							if( !use_value) // falsy; remove
								this.removeAttribute( attr)
							else
								this.setAttribute( attr, '')
						}
						// set to a truthy value, otherwise remove
						else if( desc.attribute[1] === 'auto'){
							if( !use_value) // falsy; remove
								this.removeAttribute( attr)
							else
								this.setAttribute( attr, use_value)
						}
						else {
							throw 'Unknown attribute type'
						}
					}
				})
			}

			Object.defineProperty( this, prop, {
				get(){
					// log('info','GET', prop, '=>', this._state[ prop] )
					// can use a getter on desc for computed prop
					return desc.getter ? desc.getter.call( this, this._state[ prop]) : this._state[ prop]
				},
				set( val){ /// SET:
					// log('pink', 'SET prop:', this.id, prop, val)
					let store_id = this.id
					if (desc.storable && !store_id)
						log('err', 'no store id for prop:', prop, this)

					if (prop in properties){ //// in? ==> is a reactive prop
						let no_render = false
						let prev_val = this._state[prop]
						let t_val
						if (desc.transformer && !this.bypass_transformer)
							t_val = desc.transformer.call( this, val, prev_val, desc.value, stored_val)

						let force_render = desc.force_render

						// do not return -> WE MAY STILL NEED WATCHER FOR SIDE EFFECTS
						if (val===prev_val && !force_render || t_val === 'cancel' /* MAGIC WORD :| */)
							no_render = true

						if (t_val !== undefined)
							val = t_val

						if (desc.storable){
							// throttled_saveStores will only be fired once –
							// though it may be called again with different params...
							// like for rx and ry during a continuous dragging,
							// then only one of them would be stored in the end
							// so store value here directly on state and leave the global
							// localstorage saving the state for the throttled callback
							const ns = typeof desc.storable === 'string' ? desc.storable : this.ns
							stores[ns][store_id] ||= {}
							stores[ns][store_id][prop] = val

							// global store (will be called at least once after multiple set)
							throttled_saveStores()
							// setTimeout( e => saveStore(ns), 200)
						}

						this._state[prop] = val

						if (!this.block_watcher)
							desc.watcher && desc.watcher.call( this, val, prev_val)

						if (desc.sync_to_url_param){
							// Update param - find param w/ name matching prop, sync it's val [1]
							// this prop may be global and app doesn't use or have params
							if (this.params){
								this.params[this.params.findIndex(p => p[0]===prop)][1] = val
								// Update hash
								let page = this.getPage().path.split('/')[0] // remove possible params
								let hash = page + '/' +
									this.params.map( p => p.map(seg=>seg.toString()).join('=')).join('/')
								location.hash = hash
							}
						}

						if( desc.attribute){ /// ['open', 'bool']
							if( typeof desc.attribute === 'string'){
								this.setAttribute( desc.attribute, val)
							}
							else { // Array
								let attr = desc.attribute[0]
								// remove if falsy value, otherwise set to empty value ("")
								if( desc.attribute[1] === 'bool'){
									if( !use_value) // falsy; remove
										this.removeAttribute( attr)
									else
										this.setAttribute( attr, '')
								}
								// set to a truthy value, otherwise remove
								else if( desc.attribute[1] === 'auto'){
									if( !val) // falsy; remove
										this.removeAttribute( attr)
									else
										this.setAttribute( attr, val)
								}
								else {
									throw 'Unknown attribute type'
								}
							}
						}

						if( desc.class)
							this.classList.toggle( desc.class, !!val)

						if( desc.reactive !== false && !no_render)
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

			if( desc.init_watcher===true){
				//! should not cause render; call manually
				// log('check', 'init_watcher true; prop:', prop)
				let prev_val = this._state[ prop]
				this._state[ prop] = use_value
				desc.watcher && desc.watcher.call( this, use_value, prev_val)
			}
			else {
				// init "silently": no watcher/transformer etc...
				this._state[ prop] = use_value
				if( desc.init_watcher==='onRendered'){
					this.setOnRendered = [prop, use_value]
				}
				else if( desc.init_watcher === 'deferred'){
					setTimeout( () => {
						this[ prop] = use_value
					})
				}
			}
		}

		//! We should only clone once and store on another static prop...
		//! in case there's many instances...
		const strings = (_ctor.strings ? clone( _ctor.strings) : {})

		if( _ctor._strings)
			Object.assign( strings, _ctor._strings)

		// removed : attribute strings

		if( _ctor.strings){
			if( !app.languages)
				log('err', 'no app languages yet', this)

			this.strings = strings

			// this.$name -> getters for strings
			for( let name in strings){
				Object.defineProperty( this, '$'+name, {
					get(){ return this.getString( name) },
					set(){ throw 'cannot set a string' }
				})
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

	/**
	 * Declares that a component uses one or more props from another component
	 * and must also be rendered when this other component's prop changes.
	 */
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

	/** sets the state without triggering render or watcher/transformer */
	setState( name, value){ this._state[ name] = value }

	/** set an attribute and render this */
	setAttr( name, value){
		this.setAttribute( name, value)
		this.render()
	}

	/**
	 * Component render function
	 * @param evt_ctx {Component} We may use another component as the events context (so `this` will refer to this other component instead of the one where the handler is defined).
	 */
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
			// debugging && log('warn', 'needsd render:', this.id)

			await nextFrame()

			!this.rendered && this.beforeFirstRender && this.beforeFirstRender()

			if( this.beforeRender && this.beforeRender()===false){
				log('err', 'Aborted render for:', this.id)
				return
			}

			this.needsRender = false
			const tmpl = this.template()
			//! => we might return null if something is missing for rendering the template
			if( !tmpl){ // === null){
				if( debugging)
					log('err', '--tmpl: no value -> no render', this.id, this.localName)
				return
			}

			if( debugging)
				log('gold','--GOT TMPL, RENDER ', (this.id||this.classList[0]))

			// log('warn', 'eventContext: this:', this)
			// log('info', 'rendering…', this.id || this.localName)
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
				this[ prop] = val
				this.setOnRendered = null
			}
		}
		else if( debugging)
			log('gold','already needsRender, waiting:', (this.id||this.classList[0]))
	}

	/**
	 * this.querySelector shorthand.
	 * @param sel {string} CSS selector string
	 * @return {Array<HTMLElement>}
	 */
	q( sel){
		return this.querySelector( sel)
	}

	/**
	 * this.querySelectorAll shorthand – Query elements and transform to an array.
	 * @param sel {string} CSS selector string
	 * @return {HTMLElement}
	 */
	qAll( sel){
		return Array.from( this.querySelectorAll( sel))
	}

	/**
	 * Method automatically called by generated string getters using the syntax: this.$welcome
	 * ! warning: will return result of unsafeHTML if contains HTML (looks for <tag> or HTML entity),
	 * ! use raw=true argument if we need the raw HTML string to use outside a lit-html template,
	 * ! like in a prop binding: <div .html_str=${ getString(…) } or when directly setting .innerHTML
	 * @param str_name {string} The name for the requested string.
	 * @param raw {bool} If we should return the raw string for a string containing HTML instead of the result of unsafeHTML.
	 * @return the string corresponding to the actual language
	 */
	getString( str_name, raw=false){
		if( !str_name) return ''
		if( !this.strings[ str_name]){
			log('warn','NO STRING FOUND FOR:', str_name)
			return ''
		}
		let lang = (app || this).lang
		let lang_index = this.languages.indexOf( lang)
		let str = this.strings[ str_name][ lang_index] || this.strings[ str_name][0]
		return raw ? str : // force 'as is' even if contains html
			containsHTML( str) ? unsafeHTML( str) : // detected html
			str.startsWith('>') ? unsafeHTML( str.slice(1)) : // explicit html
			str // as is
	}

	/** Toggle between two classes based on a condition */
	switchClasses( a, b, condition){
		this.classList.toggle(a, condition)
		this.classList.toggle(b, !condition)
	}

	/**
	 * Returns an array from an attribute value consisting of
	 * space or comma (w/ possible spaces around) separated strings.
	 * @param name {string} Name of the attribute whose value is to parse.
	 * @param alt {string} A possible alternate attribute name if first is not declared.
	 * @return {array<string>}
	 */
	getAttributeList( name, alt){
		// log('pink', 'attr list from:', name)
		return (this.getAttribute( name)||this.getAttribute( alt)).split(/\s*[,\s]\s*/)
	}

	/**
	 * Returns an array for a string consisting of
	 * space or comma (w/ possible spaces around) separated strings.
	 * @param str {string} The string to parse.
	 * @return {array<string>}
	 */
	getStringList( str){
		return str.split(/\s*[,\s]\s*/)
	}

	/**
	 * Load a component JS and CSS files dynamically,
	 * either from the `/_components/` dir if bare path,
	 * or relative to app dir if path starts with `./`
	 * or absolutely if path starts with `/`
	 * @param file_path {string} Path for component
	 * @return {Promise<ModuleNamespaceObject>} an object that describes all exports from a module
	 */
	static async load( file_path){
		// log('err', 'config.components_dir:', config.components_dir)
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
			css = file_path/* .replace('.min','') */ + '.css'
		}

		// if starts with ./ -> remove and use pathname, else assume is in /_components/
		// unless abs (/) -> then leave as is
		if (/^\./.test( css))
			css = location.pathname + css.replace(/^\.\//,'') // if starts with dot, remove it
		else if (! /^\./.test( css))
			css = `${ config.components_dir }${ css }`

		if (/^\./.test( js))
			js = location.pathname + js.replace(/^\.\//,'') // if starts with dot, remove it
		else
			js = `${ config.components_dir }${ js }`

		if (debug.load)
			log('purple', 'load js, css :', js, css)
		// make sure CSS is loaded before we import js so no flash of unstyled components
		css && await loadStyleSheetAsync( css)
		return import( js)
	}

	static loadAll( ...components){
		components = components.map( c => Component.load( c))
		return Promise.all( components)
	}
}

/** App Component **/
export class VisionStage extends Component {

	constructor(){
		super()
		this.lang = this.lang // trigger watcher now

		// -> disable right-clicking
		// this.addEventListener( 'contextmenu', e => e.preventDefault())

		this.is_iOS = is_iOS
		this.scrolls = this.classList.contains('scroll')

		// Save store to localStorage on pagehide / unload
		if (!window.do_not_store){
			const termination_event = 'onpagehide' in self ? 'pagehide' : 'unload';
			window.addEventListener(termination_event, e => saveStores())
		}

		// auto filled by each component
		this.foldable_components = new Set()

		// add 'using-mouse' class which hides input outlines
		// fold all <vs-selector> components
		document.body.addEventListener('pointerdown', (e) => {

			document.body.classList.add('using-mouse')

			// means we clicked on a vs-selector component, leave it manage clicks
			if (e.target.closest('vs-selector[folds]'))
				return

			// else we clicked something else, close all <vs-selector>
			for (let sel_btn of this.foldable_components)
				if (!sel_btn.folded) sel_btn.folded = true
		})

		// remove 'using-mouse' class which hides input outlines
		document.body.addEventListener('keydown', (e) => {
			if (!e.key) return // -> autofill
			document.body.classList.remove('using-mouse')
		})

		window.addEventListener('hashchange', this.#onHashChanged.bind( this))
		this.#updateAspect( ctor( this).aspects)

		this._onInstallable = this.#onInstallable.bind( this)
		this._onInstalled = this.#onInstalled.bind( this)

		window.addEventListener('beforeinstallprompt', this._onInstallable)
		window.addEventListener('appinstalled', () => this._onInstalled)
	}


	connectedCallback(){
		this.onConnected && this.onConnected()
		this.updateDocTitle()
		if( ctor( this).sounds)
			this.setupSounds() // playSound( name), stopSound( name)

		if (config.sw){
			this.getActiveSW().then( SW => {
				active_sw = SW || null
				this.registerSW()
			})
		}
	}

	updateDocTitle(){
		const title = this.$doc_title || this.$title
		const page = this.getPage()?.title || decodeURI(location.hash.slice(1).split('/')[0])
		if (title && page){
			const doc_title = title + ' • ' + page
			document.title = doc_title
			//log('red', 'set doc title:', doc_title)
		}
		else if (title){
			document.title = title
		}
		// else: keep the static title in index.html
		else {
			log('red', 'no title', )
		}
	}

	async getActiveSW(){
		//log('check', 'getActiceSW()')
		if( 'serviceWorker' in navigator){
			const registrations = await navigator.serviceWorker.getRegistrations()
			for (let registration of registrations){
				// registration.unregister()
				return registration.active // only first, should not be more
			}
		}
	}

	async #onInstallable(e){
		// Prevent the mini-infobar from appearing on mobile
		e.preventDefault()
		// Stash the event so it can be triggered later.
		this.deferredPrompt = e
		// Update UI notify the user they can install the PWA
		// ...showInstallPromotion()
		log('ok','App is installable')
		this.classList.add('installable') /// use to show install shortcut/standalone button
	}

	#onInstalled(){
		log('ok', 'App installed')
		this.deferredPrompt = null
		this.classList.remove('installable')
		// Note: app only mount once, thus classes can be managed procedurally
	}

	/** user want to "install" a shortcut, trigger native prompt */
	install(){
		if( !this.deferredPrompt){
			log('err','no deferredPrompt', this)
			return
		}

		this.deferredPrompt.prompt() // native prompt
		// this.deferredPrompt.userChoice
		// 	.then( choiceResult => {
		// 		if( choiceResult.outcome === 'accepted')
		// 			// hides install section in menu
		// 			this.classList.remove('installable')
		// 		// else user dismissed prompt
		// 		this.deferredPrompt = null
		// 	})
	}

	#onHashChanged(){
		this.#setPageFromHash()

	}

	#setPageFromHash(){ // sets this.page name (coresp to [page] attribute)
		let h = decodeURI( location.hash.slice(1))
		if (!h){
			if( this.page !== ''){
				//log('err', 'set page empty')
				this.page = ''
			}
			this.updateDocTitle()
			return
		}
		// find corresp. path in pages to get key
		if( h.endsWith('/')) h = h.slice(0,-1)
		let [page, ...params] = h.split('/')
		// log('err', 'raw params:', params)

		this.params = !params.length ? null : params
			.map( p => p.split('='))
			.map( ([k,v]) => [k, v==='true'?true : v==='false'?false : !isNaN(v)?parseFloat(v) : v])
		// log('pink', 'Got params from hash:', h, this.params)
		let page_name = ''
		//log('info', 'match page, in pages:', page, this.pages)
		outer:
		for (let [name, data] of this.pages){
			for (let lang in data){
				let path = data[ lang].path.split('/')[0]
				if (path === page){
					page_name = name
					break outer
				}
			}
		}

		if (!page_name){ // unknown
			log('err', 'unknown path:', h)
			this.page = ''
			return
		}

		this.page = page_name
		this.updateDocTitle()
	}

	/**
	 * gets the page sub-object {title,path} for the current lang
	 */
	getPage (page_name=null){

		if (!this.pages){
			log('warn', 'no pages yet')
			return null
		}
		let p_name = (page_name===null ? this.page : page_name)
		let page = this.pages.find( ([name]) => p_name === name)
		let lang = this.lang
		if( page && !page[1][lang]){
			//log('warn', 'Missing string for page with current lang: ' + p_name + ' -> ' + lang, 'Using default lang (en).')
			lang = 'en'
		}
		if( page && !page[1][lang])
			throw 'Missing string for page with default (en) lang: ' + p_name + ' -> ' + lang

		return page ? page[1][lang] : {} // [1] == data
	}

	getPageLink (page, postfix='', clss=''){
		if( !this.pages) return ''
		//log('check', 'page link:', page)
		const pre =
			!page ? '':
			page.startsWith('/') ? '/' : // abs path
			page.startsWith('./') ? '' : // rel path
			'#' // bare path -> virtual page

		const p = this.getPage( page)
		// log('red', 'page obj:', p)
		let path = p.path
		// log('red', 'link path:', path)
		if( pre === '/')
			path = page.slice(1)

		//let clss = btn ? ' button' : ''
		return postfix ?
			html`<a class=${ strIf('selected', page === this.page)}
				href='${ pre }${ page ? path : '' }'>${ p.title }</a><span class='nav-sep'>${ postfix }</span>`
			:
			html`<a class=${strIf('selected', page === this.page) + ' ' + clss}
				href='${ pre }${ page ? path : '' }'>${ p.title }</a>`
	}

	_onFirstRendered(){

		let pages = ctor(this).pages
		if (pages){
			// map each title to {title, path} (path is title with spaces replaced by -)
			this.pages = Object.entries(pages).map(([name, titles]) => {
				let path
				// titles may be an object with titles and path
				if (isObject(titles)){
					path = titles.path
					titles = titles.titles
				}
				// real path (not a virual page (#)) -> use name for path, not title…
				else if (name.startsWith('./') || name.startsWith('/')){
					path = name
				}
				let obj = {}
				let lang_index = 0
				for (let title of titles){
					let lang = this.languages[ lang_index++]
					obj[ lang] = { title, path: path||title.replace(/\s/g, '-') }
				}
				return [name, obj]
			})
		}
		this.#setPageFromHash()
	}

	// Scrolled detection for setting different styles
	// onMainScroll(e){
	// 	this.classList.toggle('scrolled', main.scrollTop > 10)
	// }

	// delayed
	afterResize(){
		app.resizing = false
		app.updateScrollbarClass()
	}

	_onRendered(){
		let main = this.q('main')
		if( main) this.main = main
		this.updateScrollbarClass()
	}

	//! this.main.scrollHeight > this.main.offsetHeight may be true even when no scrollbar
	//! some styles can mess this up ??
	/** sets .main-has-scrollbar for app-header/footer shadows */
	updateScrollbarClass(){
		// log('pink', 'update scrollbar class')
		if (this.main && this.main.classList.contains('scroll')){
			let has = this.main.scrollHeight > this.main.offsetHeight
			this.classList.toggle('main-has-scrollbar', has)
			//if( has) log('check', 'main has scrollbar; scroll height, main height:', this.main.scrollHeight, this.main.offsetHeight)
		}
	}

	resize(){
		if (this.resize_locked)
			return // mobile + menu auth open -> prevent resize by onscreen keyboard

		this.resizing = true
		clearTimeout( after_resize_timeout)
		after_resize_timeout = setTimeout( this.afterResize, 200)

		//tempClass( this, 'resizing', 1) //! tempClass doesn't reset its timeout...
		const threshold = aspect_ratios.threshold
		const root = document.documentElement
		const FSD = config.font_size_decimals
		//log('check', 'FSD:', FSD)
		let w = window.innerWidth,
			 h = window.innerHeight
		const AR = { now: parseFloat( cleanNum( w / h)), min: 0 }

		// true also if we specify only portrait
		const is_portrait = (aspect_ratios.portrait && AR.now < threshold) || !aspect_ratios.landscape

		if( this.is_portrait !== is_portrait) // is reactive
			this.is_portrait = is_portrait

		// defines what relative height we want (in rem)
		let height_rem = // aspect_ratios.height ||
			this.is_portrait
				? (aspect_ratios.portrait_height || aspect_ratios.height || 40)
				: (aspect_ratios.landscape_height || aspect_ratios.height || 40)
		// log('warn', 'rem height:', height_rem)
		if( this.is_portrait){
			AR.min = aspect_ratios.portrait_min
			AR.base = aspect_ratios.portrait
			AR.max = aspect_ratios.portrait_max
			AR.tall = AR.base
		}
		else {
			AR.min =
			AR.base = aspect_ratios.landscape||1.6
			AR.max = aspect_ratios.landscape_max||11 	// 0 = 11 => virtually no limit
			AR.wide = AR.base
		}

		let margin = 0,
			above_landscape_max = AR.now > AR.max,
			below_landscape = AR.now < AR.base

		const cm = aspect_ratios.cross_margin

		if( !this.is_portrait)
			margin = (above_landscape_max || below_landscape) ? cm : 0
		// just below threshold, above portrait max -> side "black bars"
		else if( cm && AR.now > AR.max)
			margin = cm

		this.setAttribute('orientation', this.is_portrait ? 'portrait' : 'landscape')
		let ar = AR.now
		let asp =
			ar < aspect_ratios.portrait 		? 'portrait-min'	: // below portrait
			ar < aspect_ratios.portrait_max 	? 'portrait-mid'	: // between portrait & portrait_max
			ar < aspect_ratios.threshold 		? 'portrait-max'	: // between portrait_max & threshold
			ar < aspect_ratios.landscape 		? 'landscape-min'	: // between threshold & landscape
			ar < aspect_ratios.landscape_max ? 'landscape-mid'	: // between landscape and landscape_max
			'landscape-max' // above landscape_max
		this.setAttribute('aspect-range', asp)

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
			// if( this.margin)
			// 	h -= margin * 2
			// cap height (h) to base AR
			const MIN_AR = 1 / (AR.wide || AR.min)
			h = Math.floor( Math.min( w * MIN_AR, h)) // smallest of: window height (h) or base AR
		}
		// else if( this.margin){
		// 	w -= margin * 2
		// 	h -= margin * 2
		// }
		this.classList.toggle('has-margins', !!margin)

		this.sth = h
		this.stw = w
		this.AR = w/h


		// limit stage's height based on portrait_min AR
		const base_h = !this.is_portrait ? h : Math.min( h, w * (1/AR.base))
		root.style.setProperty('--stw',w+'px')
		root.style.setProperty('--sth',h+'px')
		let fs = Math.floor( base_h / height_rem * 10**FSD) / 10**FSD
		root.style.fontSize = fs + 'px'

		let fs2 = Math.floor( h / height_rem * 10**FSD) / 10**FSD
		root.style.setProperty('--sth-based-fs', fs2 + 'px')
		// em to allow super-scaling (follow parent if it's scaled)
		root.style.setProperty('--sth-based-fs-em', fs2/fs + 'em')

		//log('err', 'base, h:', base_h, h)
		/// fs2 em should be the scale relative to normal fs?
		/// fs = h (1000) / height_rem (40) = 1em

		// log('warn', 'sth-based-fs:', h / height_rem)

		this.scaling = fs / 16
		// root.style.setProperty('--scale', this.scaling)
		//log('purple', 'this.scale:', this.scale)
			// -> floor else we might overflow and get scrollbar
		//log('info', 'fontSize :', root.style.fontSize)
		// VALUE OF ONE REM IN PX (0.00)
		//this.REM = Math.round((base_h / height_rem) * 100) / 100

		// log('purple', 'resize() ->resize_watchers:', ...resize_watchers)
		for( let comp of resize_watchers){ // components with onResized method
			//log('check', 'call resize for comp?, rendered? :', comp.rendered, comp)
			if( comp.rendered){
				comp.onResized( AR, aspect_ratios)
			}
			else {
				//log('warn', 'skipped onResized', this)
				comp.skipped_onResized = true
				comp.skipped_params = [AR,aspect_ratios]
			}
		}

		// calc progress between tall AR (0) and x-tall AR (1);
		// can be useful to adjust something progressively from one to the other AR
		const range = AR.base - AR.min // ex: 0.1,  / 0.16 = 0.83333
		let xtra = null
		if( this.is_portrait){
			// log('check', 'AR.base - AR.now) / range:', AR.base, AR.now, range, AR.min)
			xtra = (AR.base - AR.now) / range // .66 - .6 = .06 over .16
			xtra = Math.max( 0, Math.min( 1, xtra))
			//log('info', '--extra (-tall progress):', xtra)
		}
		this.style.setProperty('--extra', xtra===null ? 0 : xtra) //[0,1]
	}

	#updateAspect (ratios){

		if(!this.initial_ratios)
			this.initial_ratios = ratios

		if( aspect_ratios)
			Object.assign( aspect_ratios, ratios)
		else
			aspect_ratios = ratios

		if( aspect_ratios.portrait){
			if( !aspect_ratios.portrait_min)
				aspect_ratios.portrait_min = .01 /// can't be 0...
			if( !aspect_ratios.portrait_max)
				aspect_ratios.portrait_max = aspect_ratios.portrait
		}

		if( !aspect_ratios.threshold)
			aspect_ratios.threshold = 1

		if( !aspect_ratios.cross_margin)
			aspect_ratios.cross_margin = 0

		this.resize()
	}

	/**
	 * Build CSS to hide elements with a lang attribute not matching the app's
	 *
	 */
	buildCSSForLangs(){
		let str = ''
		for( let lang of this.languages)
			str += `vision-stage[lang='${lang}'] [lang]:not([lang='${lang}']) { display: none !important }\n`
		const stylesheet = document.createElement('style')
		stylesheet.textContent = str
	  document.head.appendChild( stylesheet)
	}

	// must be called from the app after user event, or onConnected but then the first time it won't play on iOS (?still true?)
	/**
	 * Basic audio playback with Web Audio. No lib! ;)
	 * the main limitation is that the volume, althought it can be adjusted by individual sounds, is global, so if two sounds with different volume option||default are overlapping, the volume will sharply change; the ideal is to have sounds prerendered at the right volume. This does not concern this.global_volume which is another layer (a fract. multiplier) that the user can adjust.
	 * Sounds are fetched and stored: this.sounds[ name] = { audio_buffer, options }
	 * @return {Promise}
	 */
	setupSounds (){
		log('info', 'setupSounds')
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
	playSound (name){
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
	stopSound (){
		//log('err', 'stop:', this.playing_source)
		if( this.playing_source){
			this.playing_source.stop()
			this.playing_source = null
		}
	}

	/** Get or Set; @param path string of nested prop with dot notation */
	prop (path, value){ // 'this.prop.sub-prop'

		let target = this
		let keys = path.split('.')
		let last_key = keys.pop()

		for (let k of keys)
			target = target[ k]

		if (!target){
			log('err', 'cannot get prop', path)
			return
		}
		// GET
		if (value === undefined){
			P.init( this, target, last_key, keys[0]||last_key)
			return P
		}
		// SET
		else {
			try {
				target[last_key] = value
			}
			catch (err){
				log('err', 'err:', err)
			}
			this[keys[0]] = this[keys[0]] // trigger top-level prop
			return this
		}
	}

	/**
	 * Utility to get a value / validate it and compute a new value from it to return
	 * Will render right after returning;
	 * @return the result of computer if validator returns true, otherwise returns null
	 */
	validateAndCompute( value, validator, computer){
		setTimeout( t => this.render())
		return validator( value) ? computer( value) : null
	}

	registerSW(){
		//log('info', 'registerSW()', config.sw)
		if ('serviceWorker' in navigator)
		navigator.serviceWorker.register(config.sw)
			.then( reg => {
				log('info',"Service Worker Registered")
				reg.onupdatefound = () => {
					log('ok', 'SW update found')
					let installing_worker = reg.installing
					installing_worker.onstatechange = async () => {
						log('ok', 'SW State: ', installing_worker.state)
						switch( installing_worker.state){
							case 'installed':
								// WAIT FOR A POSSIBLE "REDUNDANT" STATE
								// CHROME MOBILE MAY BYPASS CACHE REFRESH ?
								setTimeout( () => {
									// navigator.serviceWorker.controller is unreliable when calling update manually
									if( !active_sw && !redundant){
										// log('info', 'App is now available offline')
										this.classList.add('cached')
										// this.toast.setMessage( this.$cached, ['OK', this.$install_standalone])
										// 	.then( answer => {
										// 		this.toast.show = false
										// 		if( answer === 1 && this.deferredPrompt)
										// 			this.install()
										// 	})
									}
									else {
										// LONG RUNNING NETWORK CONNECTION (LIKE FIREBASE FIRESTORE)
										// MAY PREVENT ACTIVATION FOR A WHILE; LOG TO KNOW
										log('info', 'SW Update is available, waiting for activation…')
									}
								}, 200)
								break

							case 'activated':
								/// IF NOT FIRST INSTALL, SHOW UPDATE READY: PLEASE REFRESH | LATER
								if( active_sw || redundant)
									this.onCacheUpdated && this.onCacheUpdated()
									// this.toast.setMessage( this.$update_ready, [this.$later, this.$refresh])
									// 	.then( answer => {
									// 		if( answer === 0)
									// 			this.toast.show = false
									// 		else
									// 			location.reload()
									// 	})
								break

							case 'redundant':
								redundant = true
								break
						}
					}
				}

				setTimeout( e => {
					let btn = q('#test-update-btn')
					if (btn)
					btn.onclick = () => {
						reg.update()
					}
				}, 100)

				// check for sw.js update once in a while to notify a user using the app for a long time
				// We can just change the const VERSION in sw.js and user will be notified of a new update available when cache has been updated
				setInterval( () => {
					log('ok', 'checking for service worker update...')
					reg.update()
				}, 1000 * 60 * config.update_check_min)
			})
	}
}

// these next static properties are underscore prefixed
// so they are merged instead of overriden next by > MyApp.properties

VisionStage._properties = {
	is_portrait: null,
	title: '',
	resizing: {
		value: false,
		class: 'resizing',
		reactive: false
	},
	global_volume: {
		value: .6,
		storable: '/', // shared accross all apps
		reactive: false
	},
	lang: {
		value: navigator.language.slice(0,2),
		storable: '/', // shared accross all apps
		force_render: true,
		watcher( val, prev){
			//log('pink', 'lang:', val)
			// set complete lang code on <html> for speak function
			let [lang, country] = navigator.language.split('-')
			document.documentElement.setAttribute('lang', val)// + '-' + country)
			this.country = country
			// set val (2 letter) on this element for CSS auto hide of els w/ [lang] not matching
			this.setAttribute('lang', val)
			this.lang_index = this.languages.indexOf( val)
			this.onLanguageChanged && this.onLanguageChanged( val, prev)
			// log('err', 'this.lang_index:', this.lang_index)
			// update hash and doc title

			if( this.pages && this.page){
				// update hash / page title for current lang
				let {path} = this.getPage()
				let new_page = path.split('/')[0]
				let h = decodeURI( location.hash.slice(1))
				let [old_page, ...params] = h.split('/')
				location.hash = new_page + '/' + params.join('/')
				this.updateDocTitle()
			}
			log('info', 'lang, country:', lang, country)
		},
		//init_watcher: true // causes render (SET lang), maybe too soon, keep manual
		// -> instead just re-trigger after this is rendered (this.lang = this.lang)
	},
	night_mode: {
		value: 0,
		sync_to_url_param: true, //! what happens with stored value??
		storable: '/', // shared accross all apps
		attribute: ['night-mode', 'auto'], // auto -> remove if falsy, otherwise use value
		init_watcher: true,
		watcher( val){
			document.body.classList.toggle('night-mode-1', val===1)
			document.body.classList.toggle('night-mode-2', val===2)
			//this.classList.toggle('has-dark-bg', !!val)
			//this.switchClasses('has-bright-bg', 'has-dark-bg', val==='whitish')
		}
	},
	menu_open: {
		value: false,
		class: 'menu-open'
	},
	page: {
		value: null,
		attribute: 'page',
		watcher( val, prev){

			// remove trailing #
			if( !val && location.href.endsWith('#') && window.self === window.top)
				history.replaceState( null, '', location.pathname)

			if (this.params && this.sync_props_to_params){ // skip if no props are syncable
				for (let [p,val] of this.params){
					if (p in this){
						this[p] = val
					}
				}
			}

			this.onPageChanged && this.onPageChanged( val, prev)
		}
	},
}

VisionStage._strings = {
	fullscreen: ["Fullscreen", "Plein écran"],
	night_mode: ["Night Mode", "Mode nuit"],
}

/**
 * Helper object which is setup and returned by this.prop()
 * Gives methods to operate on array and object props and render the target.
 */
export const P = {

	init (target, prop_object, prop_name, parent_prop_name){
		//log('ok', 'init prop:', this.parent_prop_name)
		this.target = target
		this.prop_object = prop_object
		this.prop_name = prop_name
		this.parent_prop_name = parent_prop_name
		this.prop = this.prop_object[ this.prop_name]
		//log('err', 'prop obj:', this.prop_object, prop_name)
		//debugger
	},
	/** triggers transformer/watcher/render by re-setting the top prop */
	resetTarget(){
		// log('check', 'reset target:', this.parent_prop_name, this.prop_name)
		this.target[ this.parent_prop_name] = this.target[ this.parent_prop_name]
		return this
	},

	// -> this.prop('todo', this.prop('todos').push( this.newTodo( val)))

	/** @return the new value */
	push (value){
		this.prop.push( value)
		this.resetTarget()
		return value
	},
	/** @return the new value */
	pushStart (value){
		this.prop.unshift( value)
		this.resetTarget()
		return value
	},
	pop(){
		setTimeout( t => this.resetTarget())
		return this.prop.pop()
	},
	popStart(){
		setTimeout( t => this.resetTarget())
		return this.prop.shift()
	},
	splice (index, delete_count=1, ...inserts){
		this.prop.splice( index, delete_count, ...inserts)
		this.resetTarget()
	},
	remove (index){ this.splice( index) },
	insert (index, ...values){ this.splice( index, 0, ...values) },

	/** flips a nested prop value and re-set: this.prop('options.xmode').flip() */
	flip(){
		this.prop_object[ this.prop_name] = !this.prop_object[ this.prop_name]
		this.resetTarget()
	},

	/** select an item or unselect it if already set, as the value for a prop */
	toggleSelect (item){
		//! what if nested prop?
		// this.prop = this.prop===item ? null : item
		this.prop_object[ this.prop_name] = this.prop===item ? null : item
		this.resetTarget()
	},
	// -> this.prop('todo').toggleSelect( todo) // instead of
	// 	this.todo = this.todo===todo ? null : todo ; this.render()

	/** find a [name,value] pair by name for the selected prop
     * and return the value only, unless we want the whole pair */
	get (name, return_value_only=true){
		log('check', 'get:', name, 'this.prop:', this.prop)
		let found = this.prop.find( ([n,v]) => n===name)
		return return_value_only ? (found||[])[1] : found
	},
	set (name, value){ // pair is created if not found
		let pair = this.get( name, false)
		if( pair)
			pair[1] = value
		else
			this.prop.push( [name, value])
		this.resetTarget()
	},

	// cycle
	nextIn (values, steps=1, wrap=true){
		let start = values.indexOf( this.prop)
		let next = (values.length + start + steps)
		if( wrap) next = next % values.length
		else next = clamp( next, 0, values.length-1)
		return this.prop_object[ this.prop_name] = values[ next]
	},
}

/**
 * Defines a custom element (window.customElements.define) and return whenDefined promise
 * @param {string[]} components wait and load required components before define
 * @param {object} config_obj Custom config; all props are optional, use default values
 * @param {string} config_obj.sw Path of service worker
 * @param {string} config_obj.components_dir - Path of the components directory
 * @param {number} config_obj.update_check_min  - Number of minutes for checking sw.js update
 * @param {number} config_obj.font_size_decimals - Integer. How many decimal places to use when setting html font-size.
 * @param {string} config_obj.icons_path Path to the icons file
 * @param {object} config_obj.icons_mappings
 * 	maps alternative (reprensentative rather than descriptive)
 * 	icon names to the real svg ids
 * @param {object} config_obj.icons_viewbox
 * @param {string[]} night_modes
 * @return whenDefined's promise
 * @usage `define('my-comp', MyCompClass, [])`
 */
export async function define( tag_name, clss, components=null, config_obj=null){

	if (config_obj && tag_name === 'vision-stage')
		Object.assign(config, config_obj)

	// import comps (js & css) dependencies (when required right from the start)
	if (components && components.length){ // app is not defined yet
		components = components.map(c => Component.load( c))
		await Promise.all(components)
	}

	window.customElements.define(tag_name, clss)

	return window.customElements.whenDefined(tag_name).then( () => {
		//log('check', 'when defined:', tag_name)
		if (tag_name === 'vision-stage'){

			app.resize()
			app.classList.add('resized')

			setTimeout( e => {
				window.addEventListener('resize', debounce( app.resize.bind( app), 300, 300)),
				2000
			})
			// ->  Arg 1: debounce dly (wont callback until you stop calling and after a delay),
			// ->  Arg 2: throttle dly (wont callback more often than at this frequency)
		}
	})
}

/**	=> html`<svg><use src='#'>...</svg>` */
export function useSVG( id, clss, ar){
	let src = config.icons_path
	// proxy names
	if( config.icons_mappings[id])
		id = icons_mappings[id]
	let vb = config.icons_viewbox[id] || '0 0 32 32'

	return html`<svg class=${clss ? 'icon '+clss : 'icon'} viewBox=${vb} preserveAspectRatio=${ ifDefined( ar) }>
		<use href='${src}#${id}'/>
	</svg>`
}
/** wraps useSVG symbol inside a `span.vs-icon` */
export const icon = (svg_id, clss='', opts={}) =>
	html`<span class='vs-icon ${clss}'>${ useSVG( svg_id, opts.svg_class||'', opts.ar) }</span>`
export const maybe = thing => thing || {}
export const classes = (...classes) => classes.filter( c => c).join(' ')


///  STORE  ///

/**
 * Global localStorage key is the path for the app (/ => -)
 * Other components must have an id as sub-key to use storable on a property.
 */

/** Parse store from localStorge or init a new one */
function initStore(ns){
	//log('purple', 'init store:', ns)
	// debugger
	//store_namespace = ns
	if (!ns){
		log('err', 'no store namespace');
		return
	}

	const stored_data = localStorage.getItem(ns)

	if (stored_data){ // set stored_data in stores[ns]
		log('purple','initStore(); ns, stored_data:', ns)
		log(stored_data)
		try { stores[ns] = JSON.parse(stored_data) }
		catch (err) {
			log('err','JSON parse error')
			log('warn', 'stored_data:', stored_data)
		}
	}
	// no stored_data or failed to parse
	if (! stores[ns] || ! isObject(stores[ns])){
		//if (debug.store) log('notok', 'no stored_data or failed to parse, set a new one empty')
		log('purple', 'initStore(); no stored data; set new empty store', ns)
		stores[ns] = {}
	}
	else if (debug.store) {
		log('ok', 'GOT store:')
		log( stores[ns])
		//log(JSON.stringify(store,null,2))
	}
}
/** Get a possibly stored value || undefined */
function storedValue(ns, elem_id, prop){
	if (!ns) return undefined
	let s = stores[ns]?.[elem_id]
	if( !stores[ns]){
		// store not initialized
		initStore(ns)
		s = stores[ns]?.[elem_id]
	}
	s?.[prop]!==undefined && log('purple', 'Got storedValue:', prop, s[prop])
	return s ? s[prop] : undefined
}
/** either save to localStorage after setting a prop on elem, or just save */
export function saveStore(ns, elem_id, prop, val, remove=false){
	// log('check', 'saveStore(ns, elem_id, prop, val):', {ns, elem_id, prop, val})
	if (window.do_not_store){
		return
	}
	//! was async: problem if used on unload event... cannot block
	//!  => should make async + another sync version for unload

	const store = stores[ns]

	if (!store) return null

	//log('err', '--save to store, elem id:', elem_id)

	if (elem_id){ /// WE WANT TO SET A STORE VALUE BEFORE SAVING

		if (remove){
			log('err', 'DELETE:', elem_id, prop)
			if( store[elem_id]){
				delete store[elem_id][ prop]
				/// if this elem has no more stored props, delete its store
				if( ! Object.keys(store[elem_id]).length)
					delete store[elem_id]
			}
		}
		else {
			//if( debug.store)
			log('check', 'STORING:', ns, elem_id, prop, val)
			if( store[elem_id] === undefined)
				store[elem_id] = {}
			store[elem_id][prop] = val
		}
	}

	const str = JSON.stringify(store)
	if (debug.store)
		log('pink', '--will store string:', str)

	// log('purple', 'set localstorage:', ns, str)
	localStorage.setItem(ns, str)
}

function saveStores(){
	// log('purple', 'saveStores()', )
	for (let ns in stores)
		saveStore(ns)
}

export function clearStore(ns){

	if(!ns){ // recreate this.ns
		const path = decodeURI(location.pathname);
		ns = path.slice(1,-1).replace(/\//g, '-') || 'home';
	}

	if (localStorage.getItem('store_cleared') === 'true'){
		// log('warn', 'store_cleared value', localStorage.getItem('store_cleared'))
		localStorage.removeItem('store_cleared')
		//log('warn', 'store_cleared value', localStorage.getItem('store_cleared'))
		return
	}

	log('err', 'clear store:', ns)
	localStorage.removeItem(ns)
	log('err', 'Store cleared')
	localStorage.setItem('store_cleared', 'true')
	window.do_not_store = true // prevent storing on before reload
	location.reload()
}
/** clear all stores for current app */
export function clearStores(){
	if (localStorage.getItem('store_cleared') === 'true'){
		log('err', 'stores all cleared; return:', )
		localStorage.removeItem('store_cleared')
		return
	}
	log('err', 'clearStores()', JSON.stringify(stores))
	for (let ns in stores){
		log('err', 'clear store:', ns)
		localStorage.removeItem(ns)
		log('err', 'Store cleared')
	}
	localStorage.setItem('store_cleared', 'true')
	window.do_not_store = true // prevent storing on before reload
	location.reload()
}

const throttled_saveStores = debounce( saveStores, 200)

// screenfull.min.js
!function(){"use strict";var e=window.document,n=function(){for(var n,r=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],l=0,t=r.length,c={};l<t;l++)if((n=r[l])&&n[1]in e){for(l=0;l<n.length;l++)c[r[0][l]]=n[l];return c}return!1}(),r={change:n.fullscreenchange,error:n.fullscreenerror},l={request:function(r,l){return new Promise(function(t,c){var u=function(){this.off("change",u),t()}.bind(this);this.on("change",u);var s=(r=r||e.documentElement)[n.requestFullscreen](l);s instanceof Promise&&s.then(u).catch(c)}.bind(this))},exit:function(){return new Promise(function(r,l){if(this.isFullscreen){var t=function(){this.off("change",t),r()}.bind(this);this.on("change",t);var c=e[n.exitFullscreen]();c instanceof Promise&&c.then(t).catch(l)}else r()}.bind(this))},toggle:function(e,n){return this.isFullscreen?this.exit():this.request(e,n)},onchange:function(e){this.on("change",e)},onerror:function(e){this.on("error",e)},on:function(n,l){var t=r[n];t&&e.addEventListener(t,l,!1)},off:function(n,l){var t=r[n];t&&e.removeEventListener(t,l,!1)},raw:n};n?(Object.defineProperties(l,{isFullscreen:{get:function(){return Boolean(e[n.fullscreenElement])}},element:{enumerable:!0,get:function(){return e[n.fullscreenElement]}},isEnabled:{enumerable:!0,get:function(){return Boolean(e[n.fullscreenEnabled])}}}),window.screenfull=l):window.screenfull={isEnabled:!1}}();

// if needed, should be a member of app
// export const px2rem = (px, decimals=FONT_SIZE_DECIMALS) => {
// 	return app && px/app.REM || 0 // ex: px=100, app.REM=16 = 100/16 = 6.25rem
// }

/**
 Font size decimals:
 Decimals allow for more precise scaling of content compare to stage:
 - 0 or 1 means that when resizing the window, content may not be sized or positioned exactly the same in relation to stage (which doesn't rounds its dimensions)
 - But fractional font-size may sometimes results in artifacts in rendering, like uneven, blurry lines.
 */
