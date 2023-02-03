import { VisionStage, html, cache, define, log, icon, setConfig }
	from '/vision-stage/vision-stage.min.js'

import { cycleValueWithin, sleep, strIf }
	from '/vision-stage/utils.js'

const fs = screenfull // embeded / global

const config = setConfig() // { night_modes: [0,1,2] }

class App extends VisionStage { /** callbacks: onFirstRendered, onRendered, onResized, onPageChanged */

	onConnected = () => this.render()
	onPageChanged = (page, prev) => this.menu_open = false

	// App template
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

				<button id='night-mode-toggle'
					class='square bare'
					aria-label=${ this.$night_mode }
					@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }>
					<span class='icon moon ${strIf('night',this.night_mode)}' shift='-1'>🌙</span>
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

		<section id='app-content' class='scroll tiny shadow' flow='col top stretch grow'>
			<!-- Inside middle section: will not overlay header & footer -->
			<!-- <vs-modal type='full'></vs-modal> -->
			${ this.page!==null && cache( this[ this.page||'home' ]() ) }
		</section>

		<footer id='app-footer' flow='row' class='sth-scaling rel'>

			<button id='nav-toggle' class='square bare'
				@pointerdown=${ e => this.menu_open = !this.menu_open }
				>
				${ icon('navicon-round', 'x-large') }
			</button>

			<nav flow='row gaps-large' class='v-menu nowrap'>
				${ this.pages && this.pages.map( ([page],i) =>
					this.getPageLink( page, i < this.pages.length-1 ? '✦' : '')
				)}
			</nav>

		</footer>
	`

	// Virtual pages templates

	home = () => html`
		<main id='home' class='scroll tiny shadow' flow='col top full'>

			<h1>Vision <small>✦</small> Stage</h1>
			<div id='tagline'>— <em class='strong'>${ this.$tagline }</em> —</div>

			<h2>simple it is</h2>
			<h3 class='text-center no-margin nowrap ${strIf('hide',this.is_portrait)}'>Clcik the "more" button <wbr>to see scrolling styles</h3>
			<p>
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi dicta ex illo illum cumque impedit cupiditate vero consequuntur nam ipsa necessitatibus, rem ipsam quos at. Sed recusandae error eius minus.
			</p>
			<p>
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi dicta ex illo illum cumque impedit cupiditate…
			</p>

			<button @click=${ e => this.more = !this.more }>${ this.more ? 'less' : 'more' }</button>

			<section class=${ strIf('hide', !this.more) }>
				<p>
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi dicta ex illo illum cumque impedit cupiditate vero consequuntur nam ipsa necessitatibus, rem ipsam quos at. …
				</p>
				<p>
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi dicta ex illo illum cumque impedit cupiditate vero consequuntur nam ipsa necessitatibus, rem ipsam quos at. Sed recusandae error eius minus.
				</p>
			</section>

		</main>
	`

	test = () => html`
		<main flow='col top grow' class='scroll scroll-hidden shadow'>
			<p class='card'>
				This shows how to get params from URL and sync them to props:
				On load props are set from URL, when they change, the url is updated, and inversely, the props are updated if we manually change the URL.
			</p>
			<h2>Got URL params:</h2>
			<table>
				${ this.params.map( ([name,value]) => html`
					<tr>
						<td>Name: ${name}</td>
						<td>Value: ${value}</td>
						<td>Type: ${ typeof value }</td>
					</tr>`) }
			</table>
			<h2>Synced to app properties:</h2>
			<ul>
				${ this.params.map( ([n,v]) => html`<li><code>this.${n} = ${n in this ? this[n] : html`<em class='faded'>not a prop</em>`}</code></li>`) }
			</ul>
			<button @click=${ e => this.c = !this.c }>
				Flip&nbsp;<code>this.c</code>
			</button>

		</main>
	`
}

App.languages = ['en', 'fr']

App.pages = {
	'': 		["Home", "Accueil"],
	test: {titles:["test"], path:"test/a=1/b=yes/c=true/d=maybe/night_mode=1"}
}

App.strings = {
	tagline: ['The Intuitive Web Framework', 'Le framework Web intuitif'],
}

App.properties = {
	menu_open: { value: false, class: 'menu-open'},
	a: { value:null, sync_to_url_param: true },
	b: { value:null, sync_to_url_param: true },
	c: { value:null, sync_to_url_param: true, storable: true }, /** params will override a stored value */
	more: false,
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

define( 'vision-stage', App)