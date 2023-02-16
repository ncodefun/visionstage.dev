import { VisionStage as VS, Component, html, define, log, unsafeHTML }
	from '/vision-stage/vision-stage.min.js'

class App extends VS {

	onConnected = () => this.render()

	template = () => html`
		<main id='home' class='text-center scroll' flow='col top grow'>
			<h1>Vision <small>✦</small> Stage</h1>

			<h2>Component with slotted content</h2>

			<slotted-content flow='col top stretch'
				.slot1=${ _this => html`
					<!-- Arrow function to keep access to app 'this'. -->
					<p>Arrow function prop :</p>
					<p>this.night_mode : ${this.night_mode}</p>
					<button
						class='dark'
						@click=${ (e) => ++_this.count }>
						Increment component count : ${ _this.count }
					</button>
				`}
				.slot2=${ function(){ return html`
					<!-- Normal function so 'this' is component's -->
					<p>Normal function prop :</p>
					<button
						class='dark'
						@click=${ (e) => ++this.count }>
						Increment component count : ${ this.count }
					</button>
				`}}
				>
				<b>Hello World!</b>
			</slotted-content>

			<p>See code for difference between using arrow and normal functions for slot props.</p>
		</main>
	`
}

VS.aspects = {
	portrait_alt: .5,
	portrait: 		.6,
	portrait_max:	.75,
	landscape: 		4/3,
	landscape_max: 1.5,
	threshold: 		1.2,
	cross_margin: '1.23%',
}

class SlottedContent extends Component {

	onConnected = () => {
		// store HTML content before render erase it
		this.initial_content = this.innerHTML
		this.render()
	}

	template = () => html`
		<p class='frame'><b>Persistant content</b></p>

		<p class='info'>
			Simple content<br>
			<small>(unsafeHTML - don't put user input there)</small>
		</p>

		<p class='frame'>${ unsafeHTML(this.initial_content) }</p>

		<p class='info'>Slotted templates as props</p>

		<p class='frame'>${ this.slot1(this) }</p>

		<p class='frame'>${ this.slot2() }</p>
	`
	onRendered(){
		log('info', 'on rendered')
	}
}

SlottedContent.properties = {
	count: 0,
}

define('slotted-content', SlottedContent)
define('vision-stage', App, [/* './slotted-content' */])