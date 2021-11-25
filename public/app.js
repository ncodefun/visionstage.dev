import { Component, VisionStage, html, define, log, sleep, q, nextFrame, tempClass, useSVG as ICON } from './vision-stage.min.js'

const RETURN_TO_LAST_SCENE_ON_MENU_CLOSE = true
// if a .scene el is not here, the CSS generated will be incomplete and other scenes won't hide when that scene is selected (direct URL, link)…


const my_selection_labels = ['AA','B','Ccccc aaas']

/// todo: floating chevrons as signifiers of choice, cycle buttons & options

/** return value of o (if string) || o[lang] */
function stringOrLocale( o, _this){
	return typeof o === 'string' ? o :
		o[ _this.lang] || o[ _this.langs[0]]
}


class App extends VisionStage {

	async onConnected(){
		Component.load('button-select')
		// Component.load('https://github.com/........button-select')


		this.buildCSSForScenes() //! after updateForURL first call;
		this.setupSounds() // playSound( name), stopSound( name)

		// if ('serviceWorker' in navigator){
		// 	window.addEventListener('load', () => {
		// 		navigator
		// 			.serviceWorker
		// 			.register('sw.js', { scope: '/' })
		// 			.then(
		// 				registration => {
		// 					console.log('ServiceWorker registration')
		// 				},
		// 				err => {
		// 					console.error('ServiceWorker registration failed', err)
		// 				}
		// 			)
		// 	})
		// }
	}

	template(){
		const port = this.is_portrait
		// on first load, navicon is unavailable (we see both parts, no need to switch)
		const unavailable = !this.scene&&!this.last_scene && !port
		const show_quest_alt = !this.scene && !!this.last_scene && port
		const show_quest = !this.scene && !this.hide_nav && !this.last_scene && port
		const show_back =
			!this.scene && this.last_scene   // NAV IS OPEN, LAST SCENE EXISTS
			&& !RETURN_TO_LAST_SCENE_ON_MENU_CLOSE

		return html`
			<section show-for:scene='none' id='home'
				class='layer'>

				<header id='home-header'
					flow='row full'
					@click=${ this.setLang }>
					<div id='lang-bar'>
					${
						this.langs.length === 1 ? '' :
						this.langs.map( lang => html`
							<button class='bare medium square pseudo-link ${ this.lang === lang ? 'active':'' }'>
								<div class='text'>${ lang.toUpperCase() }</div>
							</button>
						`)
					}
					</div>
					<!-- <button
						@click=${ this.onClickMore }
						class='abs right round bare bigger'
						style='color:white ; margin:1rem'>
						i
					</buttin> -->
				</header>

				<h1 id='home-title'
					class='align-self-end'>
					VISION<div class=''>STAGE<div>
				</h1>

				<div id='home-welcome'
					class='rel'
					flow='col space-between'
					>

					<!-- main: WELCOME -->
					<article
						id='home-main'
						class='text-center ${!this.hide_nav&&this.is_portrait ? 'fade-out':''}'
						flow='col top'>

						<h2>Simple Web apps, <strong><em>fast</em></strong>.<br><small>Pure and <strong>simple</strong>.</small></h2>
						<!-- <h3><button @click=${this.onClickTest}>TEST</button></h3> -->
						<p id='intro'>
							Vanilla JS components with lit-html template<br>
							<code>=><em> no build, 5 minutes learning curve…</em></code>
							<!-- Develop prototypes / small apps without a massive framework that promise the moon. -->
							<br>
							<!-- <selector-button
							.labels=${ ['A','BBB','CC'] }
								direction='col'
								label-position='top'
							>Label</selector-button> -->
							<!-- All the essentials → staging/resizing	•	scenes (#hash routing)	•	strings/sounds/icons easy management • smart properties (change = self-render + those w/ this.uses([ 'comp-in-question', ['prop-in-question'] ]):
							{} • one menu
							<br>
							<div>
								Native components • vanilla JS / lit-html -> no build
								– p
							</div> -->
							<!-- (<button @click=… .prop=… ?disabled=… etc.) -->
						</p>
						<div style='flex-grow:1' flow>
							<!-- <button-checkbox .target=${this} property='lean'>Lean mode</button-checkbox> -->
						</div>
					</article>

					<!-- > NAV (nav items) -->
					<aside flow='col ${this.is_portrait?'top':''}'
						id='home-nav'
						class='abs bottom frame ${this.lean||true?'lean':''} ${this.hide_nav ? 'nav-fade-out':''}'>
						<nav
							id='scenes-nav'
							flow-land='row wrap'
							flow-port='col top stretch'
							class='stay-big-port scroll mini-scrollbar'
							@click=${this.onClickNavItem}
							>
							${
								routes.filter(r=>!(r.visible===false)).map( r => html`
									<a class='button' href='#${r.path}'>${stringOrLocale(r.title, this)}</a>
								`)
							}
						</nav>
					</aside>

				</div>


			</section>

			<main id='scenes' flow='col grow'>

				<section show-for:scene='A B C admin'
					flow='col top' class='layer scene partial'>
					<p>${this.getString('header')}</p>
				</section>

				<section show-for:scene='A'
					id='sceneA' flow='col top' class='layer scene'>
					<h2>Page A</h2>

					<p><a href='#B'>Go to Page B</a></p>
					<p>
						<button-select
							.onChange=${this.onChangeSelect}
							fold  multi*
								comment='-> mutually exclusive (do not set both active)'
							menu-dir='col'
							menu-pos='top-left'
							.labels=${ my_selection_labels }
							.selections=${ this.my_selections }
							icon='bar'
								comment="option to replace radio buttons and checkboxes by a led light icon"
							icon-position='right'
							>
							Please make a selection…
						</button-select>
					</p>
					<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis, dolor iusto accusamus quae quis earum odio maxime dolores tempora commodi consectetur ipsum dolorum, voluptates rerum quia laboriosam! Officia, facilis alias?</p>
				</section>

				<section show-for:scene='B'
					flow='col' class='layer scene'>
					<h2>Page B</h2>
					<p><a href='#A'>Go to Page A, it's better.</a></p>
				</section>

				<section show-for:scene='A B'
					id='page-footer' flow='row bottom space-between' class='layer scene partial'>
					<div>page</div>
					<div>footer</div>
				</section>

			</main>

			<!-- navicon btn + FS btn ; not in a scene => always visible -->
			<footer
				id='app-footer'
				class='stay-big-port'
				flow='row space-between'
				>

				<button data-show-back=${show_back?'true':'false'}
					class='round bare ${show_back?'rot90':'big'} ${show_back||show_quest_alt&&!show_quest?'':'hidden'}'
					style='--icon-height:80%'
					@click=${this.onClickBack}>
					${ show_back ? ICON('chevron-down') : '?'}
				</button>

				<button
					id='nav-menu-toggle'
					class='bigger round ${ unavailable ? 'unavailable' : show_quest ? 'credits' : '' }'
					self='center'
					@pointerdown=${ this.onClickNavicon }
					>
					${ show_quest ? '?' : ICON('navicon-round') }
				</button>

				<button id='fullscreen-toggle'
					class='bi round bare'
					aria-label=${ this.$fullscreen }
					@click=${ this.toggleFullscreen }>
					${ ICON('fullscreen-' + (screenfull.isFullscreen ? 'exit':'enter') ) }
				</button>

			</footer>
		`
	}

	onResized( rem, AR){
		// log('check', 'resized; AR:', AR )
		// if( this.portrait)
				//! compute diff between aspect-ratios tall and x-tall and set the progress in a 0-1 range

		const range = AR.base - AR.min // ex: 0.1,  / 0.16 = 0.83333
		let xtra = null
		if( this.is_portrait){
			xtra = (AR.base - AR.now) / range // .66 - .6 = .06 over .16
			xtra = Math.max(0, Math.min(1, xtra))
			log('check', 'xtra:', xtra)
		}
		this.style.setProperty('--extra', xtra===null?0:xtra) //[0,1]

	}

	onChangeSelect( selections){
		log('check', 'onChangeSelect:', selections)
		// single (checkbox): [] or [0]
	}

	onClickBack( e){
		if( e.target.dataset.showBack === 'true')
			this.scene = this.last_scene
		else if( this.is_portrait) // toggle show welcome / nav
			this.hide_nav = !this.hide_nav
	}

	setLang( e){
		if( e.target.localName !== 'button') return
		let txt = e.target.textContent.trim().toLowerCase()
		if( txt.length!==2) throw "lang code not of lenght 2:"+txt
		this.lang = txt
	}

	toggleFullscreen( e){
		if( screenfull.isEnabled)
			screenfull.toggle()
		else
			log('err','screenfull not enabled')
		//this.open = false
		setTimeout( e => {
			this.render()
		}, 100)
	}



	async transit( a, b){ //! called from vision-stage, move this also later
		return
		log('info', 'transit from a to b:', a, b)
		const o = this.scene // o = old
		const elemO = q(`.scene:not(.partial)[show-for\\:scene="${o}"]`)
		const elemA = q(`.scene:not(.partial)[show-for\\:scene="${a}"]`)
		const elemB = q(`.scene:not(.partial)[show-for\\:scene="${b}"]`)
		/// transit-target attribute is targeted by CSS
		/// -> generally we want to make transition duration longer like with the main scene and another
		/// so basically we want a or b to behave like the main scene, w/ different fade-in/fade-out
		//elemO.setAttribute('transit-target','o')
		tempClass( elemO, 'dismissed', 2000) // will fadeout fast current scene, no delay

		await sleep( 2000)

		// now a: opac change is quick, no delay
		//elemA.setAttribute('transit-target','a')
		tempClass( elemA, 'transit-a', 2000) // will fadeout fast current scene, no delay
		this.scene = a

		await sleep( 2000)

		// now b: opac change is quick (.5s), medium delay (.5s) (while a fades out)
		// elemB.setAttribute('transit-target','b')
		tempClass( elemB, 'transit-b', 2000)
		this.scene = b
	}


	/**
	 *  VIRTUAL NAV (hash) – SCENES / ROUTES
	 *  pregenerated-CSS based automatic transitions for fade-in/out of #home/nav and scenes
	 */

	buildCSSForScenes(){
		let str = []

		// hide all other than show-for='none' when no scene
		str.push(`.app[scene=''] [show-for\\:scene]:not([show-for\\:scene='none'])`)

		for( let r of routes){

			// hide all that do not match scene or is not 'all' or is not 'none'
			str.push(`.app[scene='${r.path}'] [show-for\\:scene]:not([show-for\\:scene='all']):not([show-for\\:scene~='${r.path}']):not([show-for\\:scene='none'])`)

		}
		str = str.join(',\n') + '{ visibility: hidden ; opacity: 0 }'
		const stylesheet = document.createElement('style')
		stylesheet.classList.add('show-for-styles')
		stylesheet.textContent = str
		document.head.appendChild( stylesheet)

		this.has_scenes = routes.length > 1
	}

	onSceneChanged( scene, prev){
		if( !scene)
			return

		// immediate scenes fade-out transition (no delay) OF .no-dly… > section.scene
		tempClass( this, 'no-delay-fade-out', .5)

		this.hide_nav = false

		// store it so we know after its erased so we can return to it
	}

	onClickNavItem( e){
		e.preventDefault()
		let scene = e.target.hash.slice(1)
		// log('check', 'link hash / scene:', scene)
		this.scene = scene
	}
	onClickNavicon( e){
		if( !this.scene){
			if( RETURN_TO_LAST_SCENE_ON_MENU_CLOSE && this.last_scene)
				this.scene = this.last_scene

			// in port. if we can't go back, toggle between welcome/about msg and nav
			// – the icon changes to an "about" question mark (or italic serif "i")
			// to signify "show info(i)/about(?)"
			else if( this.is_portrait)
				this.hide_nav = !this.hide_nav
		}
		else
			this.scene = '' // hide scenes, show #home/nav
	}

	onClickTest( e){
		this.scene = 'A'
	}
}

// could be just a const (only used here); set on App for consistancy
const routes = [
	{ path:'A', title:{fr:"Page A fr",en:"Page A en"} },
	{ path:'B', title:{fr:"Page B fr",en:"Page B en"}, enabled:false },
	{ path:'C', title:{fr:"Page C",en:"Page C"} },
	{ path:'admin', title:"-- Admin --", access:'admin' },

	// { path:'credits', title:{fr:"credits",en:"credits"}, visible: false },
	{ path:'C', title:{fr:"Page C",en:"Page C"} },

	// { path:'C', title:{fr:"Page C",en:"Page C"} },
	// { path:'C', title:{fr:"Page C",en:"Page C"} },
	// { path:'C', title:{fr:"Page C",en:"Page C"} },
	// { path:'C', title:{fr:"Page C",en:"Page C"} },
	// { path:'Z', title:{fr:"Page Zfr",en:"Page Zen"} },
]

App.aspect = {
	'x-tall': 0.5 , tall: 0.6 , medium: 0.67 ,
	wide: 3/2 ,'x-wide': 18/9 ,
	'cross-margin': '1.8%'
}

App.properties = {
	my_selections: {
		value: [], stored: true,
		watcher( val){
			log('check', 'my_selections watcher', val)
			//this.my_selections_arr = Array.from( val)
			//log('purple', 'now my_selections_arr', this.my_selections_arr)
		}
	},

	lean: {
		value: true,
		stored: true,
	},
	hide_nav: false,
	inputs1: {
		value: [
			{ label:"tall", type:'number' , value:0.6 , step: 0.1 },
			{ label:"wide", type:'number' , value:1.6 , step: 0.1 },
			{ label:"cross-margin", type:'number', value:1.6 , step: 0.1 , unit:'%' },
			// nesting??
		]
	}
}

App.strings = {
	fr: {
		fullscreen: "Plein écran",
		header: "Entête du site",
	},
	en: {
		fullscreen: "Fullscreen",
		header: "Site header"
	},
}

App.sounds = [
	// { name:'click', url:'sounds/click.mp3', options:{ volume:0.5 } },
]

define( 'vision-stage', App, [])