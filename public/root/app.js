import { VisionStage, html, cache, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { cycleWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global
const PRES = [0,1] // presentation galery indices
const NIGHT_MODES = [0,1,2]

class App extends VisionStage {

	constructor(){
		super()
		//this.registerSW()
		navigator.serviceWorker.getRegistrations()
		.then( registrations => {
			if( registrations.length){
				for( let registration of registrations){
					registration.unregister()
				}
			}
		})
	}

	onConnected = () => this.render()

	template = () => html`
		<header id='app-header' class='sth-scaling lang-center'>

			<span></span>

			<span flow='row gaps' id='lang-bar'>
				<span class='equal-deco'> = </span>
				${ this.languages.map( (lang,i) => html`
					<button
						@pointerdown=${ e => this.lang = lang }
						class='bare uppercase underline josefin-400 ${ strIf('selected', this.lang === lang) }'
						>
						${ lang.toUpperCase() }
					</button>
					<span class='equal-deco'> = </span>
				`)}
			</span>

			<span flow='row right gaps'>

				<button id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
					@pointerdown=${ e => this.night_mode = cycleWithin(NIGHT_MODES, this.night_mode) }>
					<span class='icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
				</button>

				<button id='fullscreen-toggle'
					class='square bare'
					aria-label=${ this.$fullscreen }
					@click=${ async e => { fs.isEnabled && fs.toggle() ; await sleep(100) ; this.render() } }
					>
					${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'large') }
				</button>

			</span>

		</header>

		${ this.page!==null && cache( this[(this.page||'home')]() ) }

		<footer id='app-footer' flow='row' class='sth-scaling rel'>

			<button id='nav-toggle' class='square bare'
				@pointerdown=${ e => this.menu_open = !this.menu_open }
				>
				${ icon('navicon-round', 'x-large') }
			</button>

			<nav flow='row gaps-large' class='v-menu nowrap'>
				${ this.pages && this.pages.map( ([page],i) =>
					this.pageLink( page, i < this.pages.length-1 ? '✦' : '')
				)}
			</nav>

		</footer>
	`

	home = () => html`
		<main id='home' class='text-center rel' flow='col top full'>

			<h1>Vision <small>✦</small> Stage</h1>
			<div id='tagline'>— <em class='strong'>${ this.$tagline }</em> —</div>

			<div lang='en' class='intro'>
				<strong>Prototypes and beyond&thinsp;:</strong>
				<br>
				Web apps with zero fuss <span class='portrait-break'>—</span>
				the framework to start, <em>fast&hairsp;!</em>
			</div>

			<div lang='fr' class='intro'>
				<b>Prototypes et au delà</b>
				<br>Des applis Web sans tracas <span class='portrait-break'>—</span> le framework pour commencer, vite&thinsp;!
			</div>

			<div id='presentation' class='rel' style='margin:auto 0 2.5rem ; top:.75rem'>
				<div style='margin: 0 1rem' class='frame strong' flow='col'>

					<div class='rel ${ strIf('hide', this.pres_index !== 0) }'>

						<div lang='en'>
							<em>This</em> is agile…
							<hr class='medium'>
							<div class='small'>
								Skip the toolchain hell
								<span class='nowrap'>of diversions and frustration…</span><br>
								No build step, no tools, no config <span class='nowrap'>– pure focus&thinsp;!</span><br>
								A really simple and intuitive API,
								<br>no arbitrary barrier…
							</div>
						</div>

						<div lang='fr'>
							Être <em>agile</em> pour vrai…
							<hr class='medium'>
							<div class='small'>
								Évitez la frustration
								<span class='nowrap'>et les diversions sans fin&hairsp;;</span><br>
								Pas de build, pas d'outils, pas de config <span class='nowrap'>— pure focus&thinsp;!</span><br>
								Une API vraiment simple et intuitive,
								<br>et aucune barrière artificielle…
							</div>
						</div>
					</div>

					<div class=${ strIf('hide', this.pres_index !== 1) }>
						<div lang='en'>
							<div style='line-height:1.33'>
								Bring your vision to life on
								<span class='nowrap'>
								a truly unique stage
								</span>
							</div>
							<hr class='medium'>
							<div class='small '>
								Multi-aspect stage for framing
								<span class='nowrap'>& resizing your content (rem scaling)</span><br>
								Perfect for Full page apps, games, stories,
								<span class='nowrap'>landing pages or presentations</span>
							</div>
						</div>

						<div lang='fr'>
							<div style='line-height:1.33'>
								Pour porter votre vision
								<span class='nowrap'>
								sur une scène vraiment unique
								</span>
							</div>
							<hr class='medium'>
							<div class='small '>
								Une scène multi-aspects pour encadrer
								<span class='nowrap'>& redimensionner votre contenu (rem scaling)</span><br>
								Parfait pour les applis pleine page, les jeux, histoires,
								<span class='nowrap'>pages d'arrivé ou présentations.</span>
							</div>
						</div>
					</div>

				</div>

				<div flow='row gaps' id='btns-presentation'
					class='sth-scaling'
					style='margin: .25rem 0 0'>

					<button ?disabled=${ this.pres_index===0 }
						id='btn-prev-presentation'
						class='bare square'
						@pointerdown=${ e => this.pres_index = cycleWithin( PRES, this.pres_index, -1) }
						>
						${ icon('arrow-right-rounded', 'large') }
					</button>

					<button ?disabled=${ this.pres_index===1 }
						id='btn-next-presentation'
						class='bare square'
						@pointerdown=${ e => this.pres_index = cycleWithin( PRES, this.pres_index, 1) }
						>
						${ icon('arrow-right-rounded', 'large') }
					</button>
				</div>
			</div>

			<!-- <footer style='margin:0 0 1.2rem; font-size:.92em; '>
				<a href='mailto:june@mystic.vision'>June@mystic.vision</a>
			</footer> -->
		</main>
	`

	why = () => html`
		<main id='why' flow='col top full' class='scroll shadow'>
			<h1>Vision Stage</h1>
			<h2>Why&hairsp;?</h2>
			<div lang='en'>
				<p>
					Unless you build a monster app, simplicity, free of artificial constraints always pays more in the end. Leave the over-engineered things to the big shots of the past – Vision Stage is for tomorrows dev, high-level conscious creators with no time to waste managing overly complex, confusing, pre-digested solutions you eternally get tangled with… Start simple, and see if you'll ever want to look back… It's not super optimal? So what! Are you obsessed with perfection? Speed? Or about kilobytes? In my book, elegance IS perfection, simplicity IS speed, in many ways…
				</p>
				<p>
					Plus, Vision Stage being pure and modern JS/HTML, it's easy to build on top of it with any plugin or custom solution for more robust applications.
				</p>
			</div>
			<div lang='fr'>
				<p>

				</p>
			</div>
		</main>
	`

	how = () => html`
		<main flow='col full'>
			<div lang='en'>
				<p>
					Vision Stage is using lit-html at its core as the template manager to render the content, but its components are built using a purely native approach to enhance custom elements, without requiring a build step. Everything is kept native, using the latest ES features whenever possible, like async imports to load components.
				</p>
			</div>
			<div lang='fr'>
				<p>
					Vision Stage utilise lit-html pour gérer le rendu de <i>templates<i> incrustables sans fin écrite en standard JS+HTML, part de composantes construit en utilisant une approche purement native pour faire des éléments custom évolués, personalisé, et sans besoin build step. Everything is kept native, using the latest ES features whenever possible, like async imports to load components.
				</p>
			</div>
		</main>
	`
	learn = () => html`
		<main flow='col full'>
			learn
		</main>
	`

	onPageChanged( page, prev){
		//log('info', 'page:', page, this.params)
		if( page===prev) return // just changed language
		if( this.params)
			for( let [p,val] of this.params){
				if( p in this && val){
					//log('check', 'set hash param on this:', p)
					this[ p] = val
				}
			}
		this.menu_open = false
	}
}

App.languages = ['en', 'fr']

App.pages = {
	'': 		["Home", "Accueil"],
	//why:		["Why", "Pourquoi"],
	how: 		["How", "Comment"],
	learn:	["Learn", "Apprendre"],
}

App.strings = {
	tagline: ['The Intuitive Web Framework', 'Le framework Web intuitif'],
}

App.properties = {
	dark_mode: {
		value: 0, // unset = user pref; once set is cycling 1,2,3 ->
		attribute: ['night-mode', 'auto'],
		watcher( val){ document.body.classList.toggle('night-mode', val===2)}
	},
	pres_index: {
		value: 0,
		watcher( val){
			log('check', 'pres index:', val)
		},
	},
	menu_open: { value: false, class: 'menu-open'},
}

App.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait (limit only for extreme case)
	portrait: 		.6,		// min horizontal space in portrait
	portrait_max: 	.6,		// max horizontal space in portrait
	landscape: 		4/3,		// min horizontal space in landscape
	landscape_max: 1.85,		// max horizontal space in landscape
	threshold: 		1.2,
	cross_margin: '1.23%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

App.dev = true // load components locally, else will load from Web (visionstage.dev/_components)

define( 'vision-stage', App)