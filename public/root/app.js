import { VisionStage as VS, html, define, log }
	from '/vision-stage/vision-stage.min.js'

import { appHeader, appContent, appFooter }
	from '/vision-stage/templates.js'

const minibrand = html`<h1 class='mini'>Vision Stage</h1>`

class App extends VS {

	onConnected = () => this.render()

	template = () => html`
		${ appHeader.call(this, 'lang-center', minibrand)}
		${ appContent.call(this, { class: 'typo-gridd scroll shadow' }) }
		${ appFooter.call(this, 'nav') }
	`

	home = () => html`
		<main id='home' class='text-center' flow='col top grow'>

			<h1>Vision <small>✦</small> Stage</h1>

			<div lang='en' class='intro'>

				<div id='tagline'><strong>Web apps, <em>simply.</em></strong></div>

				<h2><em>✦ Zero friction ⇢ Pure focus ! ✦</em></h2>
				<p>
					Vision stage is a minimalist & intuitive Web component & Web app library, using lit-html templates and reactive properties – all with vanilla JS/HTML. No build step required.

				<h2>KISS ❤</h2>
				<p>
					Vision Stage provides – I beleive – the best developer experience out there… Its simplicity frees you from wasteful diversions with the concerns, confusion and frustrations of working with non-standard syntax, concepts and workflow / tooling that other, complex libraries and frameworks force you to deal with.
				<p>
					Such true simplicity means you can **stay in the creative flow**, and **focus on what matter – *your* app !** In my book, **that** is truly agile, and future-proof development…
				<p>
					Forget about ultra-optimizing everything; simplicity is already, by nature, lightweight and fast. Quite fast enough in fact, compared to so many small and medium apps using way overkill frameworks…
				<p>
					I hope you find the same joy working to build your ideas with Vision Stage as the joy I had and still have developing it ! ✌
			</div>

			<div lang='fr' class='intro'>
				<div id='tagline'><strong>Des applications Web, <em>simplement.</em></strong></div>

				<h2><em>✦ Zéro friction ⇢ Pure focus ! ✦</em></h2>
				<p>
					Vision stage, c'est une librairie minimaliste et intuitive pour bâtir des composantes & des applis Web moderne, utilisant des <i>templates</i> lit-html et des propriétés réactives – tout ça en pure JS/HTML. Pas de <i>build step<i> requit.

				<h2>KISS ❤</h2>
				<p>
					Vision Stage procure – je le crois – la meilleure expérience développeur ici-bas… Sa simplicité nous libère des pertes de temps en diversions avec les préoccupations, la confusion et les frustrations à travailler avec une syntaxe, des concepts et un workflow / outillage non-standard, que les autres librairie et frameworks complexes nous forces à utiliser.
				<p>
					Une telle simplicité veux dire qu'on peut <strong>rester dans le <i>flow</i> créatif<strong>, et <strong>focaliser sur ce qui compte – <i>son</i> appli !</strong> Pour moi, <strong>ça</strong> c'est vraiment du développement agile, et <i>future-proof</i>…
				<p>
					Oubliez l'ultra-optimisation de tout; la simplicité est déjà, par nature, légère et rapide. Bien assez rapide en fait, comparé à tant d'applis, petites et mediums, qui utilisent des librairies ou framework totalement <i>overkill</i>…
				<p>
					J'espère que vous aurez autant de joie à travailler à réaliser vos idées avec Vision Stage que j'en ai eu à le concevoir ! ✌
			</div>
		</main>
	`

	motivation = () => html`
		<main id='motivation' flow='col top grow' class='text-justify'>
			<h2>Motivation</h2>
			<div lang='en'>



				<p>❤️</p>
			</div>

			<div lang='fr'>
				<p>

				</p>
			</div>
		</main>
	`

	stage = () => html`
		<main id='stage' flow='col top grow' class='text-justify'>
			<h2>The Stage</h2>
			<p>
				Vision Stage came about as a framework for developing full page apps / mini-games, where you want your "staged" content to always remain visible and look the same on any screen aspect. Thus the top-level, "App" element <code>&lt;vision-stage></code> acts as a stage:
			</p>
			<p>
				1) It scales the rem value (&lt;html> font-size), therefore the content sized in em/rem units scales to always fit the stage vertically, or horizontally – if we define a <code>portrait</code> aspect-ratio – when the viewport aspect-ratio is under that ratio.
			</p>
			<p>
				2) Optionally, using aspect-ratio boundaries provides a neat way to frame your landscape and portrait layouts by keeping the stage's dimensions within specific aspect-ratios. This prevents the layout space to extend or contract to much, so you don't have to manage how your content displays within extreme or in-between aspect-ratios. You only define a layout for landscape, and maybe allow for a wider space up to a defined <code>landscape_max</code> ratio, and you can also make a layout for portrait, and by default we allow vertical space on very narrow screens to extend without limit, for it would look weird to have empty space above and beyond the stage on phone screens… There's also a <code>portrait_alt</code> ratio that we can define for elements with the class <code>alt-scaling</code>, so their content will still be scaled relative to the stage height down to a lower ratio than portrait, thus content will be bigger than the normal content on narrow screens; this is useful for header and footer items where theres enough room.
			</p>
			<p>To see this in action, just make this window very wide and slowly reduce its width til it's very narrow like a phone; you will see all different aspects, which here are:
			</p>
			<ul class='frame text-left'>
				<li><code>portrait_alt: 0.5</code> <wbr><em>// alternative min horizontal space <wbr>in portrait, for elements with class <code>alt-scaling</code>.</em></li>
				<li><code>portrait: 0.6</code> <wbr><em>// min horizontal space in portrait.</em></li>
				<li><code>portrait_max: 0.6</code> <wbr><em>// max horizontal space in portrait.</em></li>
				<li><code>landscape: 4/3</code> <wbr><em>// min horizontal space in landscape.</em></li>
				<li><code>landscape_max: 1.85</code> <wbr><em>// max horizontal space in landscape.</em></li>
				<li><code>threshold: 1.2</code> <wbr><em>// point at which we switch between <wbr>portrait & landscape.</em></li>
				<li><code>cross_margin: '1.23%'</code> <wbr><em>// margins opposite to empty space <wbr>("black bars") to detach the stage visually <wbr>and prevent the letterbox effect.</em></li>
				<li><code>height: 40</code> <wbr><em>// rem - base vertical space.</em></li>
			</ul>
		</main>
	`

	demos = () => html`
		<main id='demos' flow='col top grow' class=''>
			<!-- <h1>Vision Stage</h1> -->
			<!-- <div class='boxx' flow='col stretch'> -->
				<h2>Demos</h2>
				<ul class='frame'>
					<li><a href='/demos/todo'>Todo</a></li>
					<li><a href='/demos/guitar-vision'>Guitar Vision</a></li>
				</ul>

				<h2>Layouts and themes examples</h2>
				<ul class='frame'>
					<li>
						<a href='/demos/game/'>Game</a>
						<div>Game style nav menu, auth & settings menu.</div></li>
					<li>
						<a href='/demos/game/gold.html'>Gold</a>
						<div>Game with Gold color theme.</div></li>
					<li>
						<a href='/demos/vs-selector/'>vs-selector</a>
						<div>Universal selector component.</div>
						<div>(state toggle / cycling, multi-button selector, foldable or not, single or multi-choice)</div></li>
					<li>
						<a href='/demos/scroll'>URL Params</a>
						</li>
				</ul>
			<!-- </div> -->
	`

	start = () => html`
		<main flow='col grow'>
			learn
		</main>
	`

	onPageChanged( page, prev){
		this.show_menu = false
	}
}

VS.config = {
	font_size_decimals: 1,
	// sw:'/my-app/sw.js'
}

VS.aspects = {
	// portrait_min: 	.37,	// max vertical space in portrait
	portrait_alt: .5,			//
	portrait: 		.6,		// min horizontal space in portrait
	portrait_max: 	.6,		// max horizontal space in portrait
	landscape: 		4/3,		// min horizontal space in landscape
	landscape_max: 1.85,		// max horizontal space in landscape
	threshold: 		1.2,
	cross_margin: '1.23%', 	// margins opposite to "black bars" to detach the stage visually
	height: 40,					// rem - base vertical space
}

VS.sounds = {
	// good: 'good.wav',
	// wrong: ['wrong.wav', { volume: 0.6 }],
	// win:	'win.mp3',
}

VS.languages = ['en', 'fr']

VS.pages = {
	'': 					["Home", "Accueil"],
	//why:				["Why", "Pourquoi"],
	motivation: 		["Motivation"],
	stage:				["The Stage", "Le Stage"],
	demos:				["Demos", "Démos"],
	start:				["Start!", "Commencer!"],
	'https://github.com/ncodefun/visionstage.dev' : ["Github"],
}

VS.strings = {
	tagline: [
		'Web apps, simply',
		'Des applications Web, simplement'
	],
}

VS.properties = {
	pres_index: {
		value: 0,
		watcher( val){
			log('check', 'pres index:', val)
		},
	},
}

define( 'vision-stage', App)