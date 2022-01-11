/// invert apparition of nav vs welcome so welcome is default on landing
/// make nav & lang <button-select>s
/// 404.html, re-routing spa for URL variarions support
/// offline warning banner? or popup
/// popup component
/// num input, advanced input (for ed)

import { Component, VisionStage, html, define, log, sleep, q, tempClass, useSVG as ICON, ctor }
	from './vision-stage.min.js'

const RETURN_TO_LAST_SCENE_ON_MENU_CLOSE = false

class App extends VisionStage {

	routes = ctor( this).routes

	onConnected(){
		Component.load('button-select')
		// Component.load('https://github.com/........button-select')
	}

	template(){
		const port = this.is_portrait
		// on first load, navicon is unavailable (we see both parts, no need to switch)
		const unavailable 	 = !this.scene //&& !this.last_scene && !port
		const show_quest_alt = !this.scene && this.last_scene && port

		// const show_back =
		// 	!this.scene && this.last_scene   // NAV IS OPEN, LAST SCENE EXISTS
		// 	&& !RETURN_TO_LAST_SCENE_ON_MENU_CLOSE

		const show_quest = port && !this.scene && (!this.last_scene||this.hide_nav)
			&& !this.hide_nav

		// conditions to show the question mark meaning show the about section / hide nav
		// portrait mode, no scene (menu/home),


		return html`
			<section show-for:scene='none' id='home'
				class='layer'>

				<header id='home-header'
					flow='row full'
					@click=${ this.setLang }>
					<div id='lang-bar' flow='row' class='stay-bigger x-tall-based-scaling'>
						<span class='equal'> = </span>
					${
						this.langs.length === 1 ? '' :
						this.langs.map( (lang,i,arr) => [html`
							<button class='bare medium square pseudo-link ${ this.lang === lang ? 'active':'' }'>
								<div class='text'>${ lang.toUpperCase() }</div>
							</button>
						`, i===-1 ? '' : html`<span class='equal'> = </span> `])
					}
					</div>
				</header>

				<h1 id='home-title'
					class='align-self-end' flow='col'>
					VISION<div>STAGE</div>
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

						<h2>•• from concept to reality @ lightspeed •• <br><em><small>A new level of agile…</small></em></h2>

						<div id='taglines' class='purp'>
							<h3>Native Web components</h3>
							<div>no more toolchain hell of diversions and frustration – <em>Pure focus!</em> 🙏😇</div>

							<h3>Consistant presentation on any screen</h3>
							<div>rem scaling & multi-aspect stage for resizing & framing your content</div>


							<!-- back to the simple future of the Web. -->
						</div>
<!-- <a href='#stage'>Stage</a> / app component – rem value resizing, multi aspect control for consistant presentation -->
					</article>

					<!-- > NAV (nav items) -->
					<aside flow='col ${this.is_portrait?'top':''}'
						id='home-nav'
						class='abs bottom frame ${this.lean||true?'lean':''} ${this.hide_nav ? 'nav-fade-out':''}'>
						<nav
							id='scenes-nav'
							flow-land='row wrap'
							flow-port='col top stretch'
							class='scroll mini-scrollbar stay-bigger'
							@click=${this.onClickNavItem}
							>
							${
								this.routes.filter(r=>!(r.visible===false)).map( r => html`
									<a class='button' href='#${r.path}'>${this.stringOrLocale( r.title)}</a>
								`)
							}
						</nav>
					</aside>

				</div>

			</section>

			<main id='scenes' flow='col grow' class=''>

				<section show-for:scene='ethos'
					id='sceneA' flow='col top' class='layer scene scroll mini-scrollbar'>
					<h2>Ethos abstract in French – Vive l'Indépendence!</h2>
					<p>
						La seule chose je crois qu'on perd vraiment avec l'indépendance, c'est toutes les barrières inventées par les bien-pensants, les gardiens de la vertu, les "experts" en vérité, for your own good.
						Mon coeur me dit que la simplicité libre de toute contrainte qui ne sont pas l'amour, même si tu vas pas sur la lune avec ça, c'est toujours plus payant en fin de compte... moi j'aime mieux naviguer au soleil, et que le bon vent m'emmène où mon coeur regarde.

						Je laisse les grands jouer à s'enfoncer dans leurs complexité et réinventer le monde et faire des frameworks pour les in-nénieurs... Vision Stage c'est pour le monde de demain, le monde des joueurs libérés, des créateurs conscients, les devs de très haut niveau qui n'ont plus de temps à perdre à gérer des solutions pré-digérées avec lesquelles on s'emmèlent éternellement...
					</p>

				</section>

				<section show-for:scene='components'
					id='sceneA' flow='col top' class='layer scene'>
					<h2>Components</h2>
					<p>
						<li>ES modules / class expands Component or VisionStage for the main (app) component.</li>
						<li>Lit-html templates - string literals + js expressions <sup>(syntax highlight + intellisense support with code extension)</sup></li>
					</p>
				</section>

				<section show-for:scene='stage'
					id='sceneA' flow='col top' class='layer scene'>
					<h2>Stage</h2>
					<p>

					</p>
				</section>

				<!-- EXAMPLES


				 -->
			</main>

			<!-- navicon btn + FS btn ; not in a scene => always visible -->
			<footer
				id='app-footer'
				class='stay-big'
				flow='row space-between'
				>

				<button class='dummy round'>

				</button>

				<button
					id='nav-menu-toggle'
					class='bigger round ${ unavailable ? 'unavailable' : show_quest ? 'credits' : '' }'
					self='center'
					@pointerdown=${ this.onClickNavicon }
					>
					${ ICON('navicon-round') }
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

	/*
	! prob: width of header doesn't expand...
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

	onChangeSelect( selections){
		log('check', 'onChangeSelect:', selections)
		// single (checkbox): [] or [0]
	}
	*/

	onResized( rem, AR){
		// log('check', 'resized; AR:', AR )
		if( this.is_portrait)
			this.hide_nav = true
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

	onClickBack( e){
		if( e.target.dataset.showBack === 'true')
			this.scene = this.last_scene
		else if( this.is_portrait) // toggle show welcome / nav
			this.hide_nav = !this.hide_nav
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

	onSceneChanged( scene){
		if( scene)
			this.hide_nav = false // reset for next time
	}

	onClickNavItem( e){
		if( !e.target.hash)
			return
		e.preventDefault() // <a> elements…
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


App.routes = [
	{ path:'ethos', title: { fr:"Ethos", en:"Ethos (French)" } },

]

App.aspects = {
	'x-tall': 0.35 , tall: 0.55 , //medium: 0.67 ,
	wide: 3/2 ,'x-wide': 18/9 ,
	'cross-margin': '1.33%'
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

// const my_selection_labels = ['AA','B','Ccccc aaas']; // for <button-select> demo

define( 'vision-stage', App, [])

/*
if ('serviceWorker' in navigator){
	window.addEventListener('load', () => {
		navigator
			.serviceWorker
			.register('sw.js', { scope: '/' })
			.then(
				registration => {
					log('ok','ServiceWorker registration')
				},
				err => {
					log('err', 'ServiceWorker registration failed', err)
				}
			)
	})
}
*/