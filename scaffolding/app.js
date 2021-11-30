import { VisionStage, html, define, log, q, tempClass, useSVG as ICON, ctor } from './vision-stage.min.js'

class App extends VisionStage {

	routes = ctor( this).routes

	onConnected(){
		this.render()
	}

	template(){
		return html`
			<main></main>
		`
	}

}
App.aspects = {
	'x-tall': 0.5,
}
App.routes = [
	{ path:'A', title:{fr:"Page A fr",en:"Page A en"} },
]
App.properties = {

}
App.sounds = []
App.strings = {}

define( 'vision-stage', App, [])