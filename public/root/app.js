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

				<p class='text-thin nowrap'>
					Embrace <em>modern vanilla,</em> with pure JS/HTML <wbr>(thanks to <a href='https://lit.dev/docs/v1/lit-html/template-reference/'>lit-html</a> templates), <wbr>super intuitive Web components. <wbr <wbr>No tooling, no build step. <wbr>No strange, non-standard concepts. <wbr>No confusion, frustration and diversion…
				</p>
				<p>
					Stay in the flow, <wbr>and <strong>focus on what matter – <em>your</em> app !</strong>
				</p>
			</div>

			<div lang='fr' class='intro'>
				<div id='tagline'><strong>Des applications Web, <em>simplement.</em></strong></div>

				<h2><em>✦ Zéro friction ⇢ Pure focus ! ✦</em></h2>
				<p class='text-thin nowrap'>
					Embrassez le <em>modern vanilla,</em> avec <wbr>des composentes Web super intuitives <wbr>en pure JS/HTML, <wbr>grâce aux templates <a href='https://lit.dev/docs/v1/lit-html/template-reference/'>lit-html</a>. <wbr>Pas de build step. <wbr>Pas de concepts étranges et non-standard. <wbr>Pas de confusion, de frustration et de diversion… <wbr>Maintenant vous pouvez rester dans le flow, <wbr>et <strong>focaliser sur ce qui compte – <em>votre</em> appli !</strong>
				</p>
			</div>
		</main>
	`

	motivation = () => html`
		<main id='motivation' flow='col top grow' class='text-justify'>
			<h2>Motivation</h2>
			<div lang='en'>
				<p>
					This is what happens when someone builds a framework, looking only for elegance and simplicity; you create a superb developer experience. Yes, you won't have some goodies that modern tooling can provide, but on the plus side, you don't have any tooling to deal with… Nor do you have to deal with an overly complex framework, with so many barriers and nerdy concepts you *must* learn and use, for your own good my child… God forbid you should shoot yourself in the foot! Not everyone is building a monster app à la Facebook ! Here you have a simple base from which you can do what you want, without any artificial limits.
				</p>
				<p>
					Spare yourself a sea of endless confusion and frustrations, keep it simple, <strong>focused</strong>, and see how far you can go when you care more about freedom and lightness than about conformity and tightness.
				</p>
				<p>
					We may say that Vision Stage is for quickly and easily prototyping a Web app, but you'll wonder why on earth you should then redo your app in way more time, and way less fun - for minimal gains, and probably for reassuring fearful, worrying minds that demand conformity. 🤷 The truth is that Vision Stage is built on such simple, "vanilla" concepts, that you can easily add to it or modify it without having to study all the intricacies of a complicated library/framework… I'd call that <em>truly</em> agile and future-proof development…
				</p>
				<p>
					So in the end, the result is that you have an app that's lightweight and fast, and though it's not the lightest or fastest possible, I'd argue that it's quite enough, as this is already better than the vast majority of apps / Websites out there, made with way overkill frameworks for their requirements… Maybe there's more optimization to be done here, but the main goal until now was to build the most intuitive workflow / API possible. Not every use case has been taken into account, but I've made quite a lot of educational apps using it, which allowed me to test Vision Stage with quite a wide variety of requirements and catch and fix many issues. So it's a pretty well rounded "framework" for relatively simple small / medium apps, and the fact that it frees you from distractions unrelated to <strong>your</strong> work,
					it also makes an ideal environment for learning Web development with the absolute minimal frictions possible !
				</p>

				<p>
					Vision Stage is a work of art; this is the word of an artist, the fruit of years of decisions and redoing, always looking ahead for the clearest path. I hope you find the same joy using it as the joy I had and still have developing it.
				</p>

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