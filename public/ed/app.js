import { VisionStage, Component, html, define, log, q, tempClass, useSVG as ICON, ctor } from '../vision-stage.min.js'

class App extends VisionStage {

	routes = ctor( this).routes

	onConnected(){
		this.render()
		Component.load('input-number').then( () => log('ok','LOADED'))
	}

	template(){
		return html`
			<h1>Make-an-app</h1>
			<main>
				<h2>Statics</h2>
				<section>
					(App) Aspects: <br>
					<!-- { tall: .6 , wide:1.777 , x-wide:2 } -->
					<input-number
						name='tall' value='1.777' step='0.1'
						.group=${ this.aspects }></input-number>
					<input-number
						name='x-tall' value='2' step='0.1'
						.group=${ this.aspects }></input-number>

				</section>
				<section>(App) Routes: </section>
				<section>(App) Sounds: </section>

				<section>Properties: </section>
				<section>Strings: </section>
				<hr>
				<section>Template: </section>
				<section>Callbacks: </section>
				<section>Methods: </section>
				<section>Imports: </section>
				<section>Others (top level funcs and vars): </section>
				<!-- <section>DOCS: </section> -->
				<footer>
					<p>Generate file > app.js</p>
					<button @click=${ this.save }>Save</button>
				</footer>
			</main>
		`
	}

	save( e){

	}

	// create an input
}
App.aspects = {
	'x-tall': 0.5,
	'wide': 1.6,
}
App.routes = [
	{ path:'A', title:{fr:"Page A fr",en:"Page A en"} },
]
App.properties = {
	aspects: {
		value: {
			tall: 0.6,
			wide: 1.777,
			'x-wide': 2
		}
	}
}
App.sounds = []
App.strings = {}

define( 'vision-stage', App, [])