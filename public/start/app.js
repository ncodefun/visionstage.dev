import { VisionStage as VS, html, define, log, cache, icon }
	from '/vision-stage/vision-stage.min.js'

import { sleep, strIf, cycleValueWithin }
	from '/vision-stage/utils.js'

const fs = window.screenfull // embeded / global
let id = 0

class App extends VS {

	onConnected = () => this.render()
	onRendered = () => log('info', 'rendered')
	onPageChanged(){
		//await sleep()
		const el = this.q('#home')
		if (!this.code_highlighted){
			window.Prism.highlightAllUnder(el)
			this.code_highlighted = true
		}
	}

	currentPageTempl = () => (this.page||'home') + this.lang.toUpperCase()

	template = () => html`

		<button id='nav-menu-toggle'
			class='abs top left bare large'
			@click=${ e => this.show_nav = !this.show_nav }
			>
			${ icon('navicon-round') }
		</button>

		<header id='app-header-simple' flow='inline row gaps' class='abs top right'>
			<button is='vs-button' id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
				@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, VS.config.night_modes) }
				>
				${ icon('moon', `flip-x ${ strIf('night',this.night_mode===0) }`) }
			</button>

			<button is='vs-button' id='fullscreen-toggle'
				class='square bare'
				aria-label=${ this.$fullscreen }
				@pointerdown=${ async e => { fs.isEnabled && fs.toggle() ; await sleep(100) ; this.render() } }
				>
				${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'x-large') }
			</button>
		</header>


		<section id='app-content' flow='row top' class='typo-gridd scroll'>

			<aside id='nav-bar' class='sticky top left'>
				<nav>
					<ul class='no-bullets'>
						<li><a href='#/#pages'>Virtual Pages</a></li>
						<li><a href='#/#strings'>Locale strings</a></li>
						<li><a href='#/#props'>Reactive props</a></li>
						<li><a href='#/#icons'>SVG Icons</a></li>
						<li><a href='#/#sounds'>Sounds</a></li>
						<li><a href='#/#aspects'>Aspects</a></li>
						<li><a href='#/#config'>Config</a></li>
						<hr>
						<li><a href='#/#nested-props'>Reactivity with nested props</a></li>
						<li><a href='#/#uses'>Reactivity accross components</a></li>
						<li><a href='#/#utils'>Utils functions</a></li>

					</ul>
				</nav>
			</aside>

			${ this.page!==null && cache(this[ this.currentPageTempl() ]()) }

			<aside id='infos-bar'>

			</aside>

		</section>

	`

	homeEN = () => html`
		<main id='home' class='lang-js'>
			<!-- <code class="lang-js block">html&#96;&lt;main>Hello \$\{ this.$world \}&lt;/main>&#96;</code> -->
			<h1>Vision <small>✦</small> Stage</h1>

			<h2 id='/#pages'>Virtual pages</h2>
			<p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ex, mollitia in ut ea placeat quo architecto ad quos earum quasi dolorum provident ratione ipsam temporibus rem. Placeat nam officia sit?</p>

			<h2 id='/#strings'>Locale strings</h2>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ut praesentium ratione adipisci blanditiis facere, sit excepturi a, nostrum odit itaque dolores doloribus neque placeat architecto tenetur. Sequi velit minima debitis.</p>

			<h2 id='/#props'>Reactive properties</h2>
			<p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Suscipit omnis facere corrupti deserunt officiis laudantium pariatur ipsum voluptatem magnam molestiae, earum voluptas eos reiciendis accusamus optio perspiciatis laboriosam! Ex, culpa.</p>

			<h2 id='/#icons'>Use Icons (svg symbols)</h2>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium laboriosam fugit sed est consectetur doloremque laborum magni neque asperiores cum, voluptatem, excepturi, numquam assumenda autem nulla eaque itaque? Adipisci, corrupti.</p>

			<h2 id='/#sounds'>Sounds</h2>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium laboriosam fugit sed est consectetur doloremque laborum magni neque asperiores cum, voluptatem, excepturi, numquam assumenda autem nulla eaque itaque? Adipisci, corrupti.</p>

			<h2 id='/#aspects'>Aspects</h2>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium laboriosam fugit sed est consectetur doloremque laborum magni neque asperiores cum, voluptatem, excepturi, numquam assumenda autem nulla eaque itaque? Adipisci, corrupti.</p>

			<h2 id='/#config'>Config</h2>
			<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium laboriosam fugit sed est consectetur doloremque laborum magni neque asperiores cum, voluptatem, excepturi, numquam assumenda autem nulla eaque itaque? Adipisci, corrupti.</p>



			<hr>

			<h2 id='/#nested-props'>Reactivity with nested properties</h2>
			<div>
				<p>
					We use <code>this.prop(path, value?)</code> when we want to modify a nested property and trigger <code>render()</code>, <code>watcher()</code>, etc.
				</p>

				<h3>Directly set a value</h3>
				<code class='block'>this.prop('myobj.propA[1].id', new_value)</code>

				<p>Or let go of the square brackets…</p>
				<code class='block'>this.prop('myobj.propA.1.id', new_value)</code>

				<p>
					We can also pass a callback function as the second argument to receive the current value and return a new one.
				</p>
				<code class='block'>this.prop('myobj.propA[1].id', val => ++val)</code>

				<p>
					This is useful when we want to derive a new value from the current one, like increment or decrement, as we don't need to write again the whole path of the property: <code>++this.myobj.propA[1].id</code>. → Less code, less error-prone.
				</p>


				<h3>Modify an array property</h3>

				<p>
					When we ommit the second argument, we get a special object with methods we can use, and like before, the top-level property gets re-set to itself in order to trigger render and watcher. Many of the methods are similar to array methods:
				</p>

				<code class='block'>this.prop('myobj.propA').push(new_item)</code>

				<p>
					Other prop methods for arrays are: <code>push, pushStart, pop, popStart, remove, splice, insert, last, and nLast</code>.
				</p>


				<h3>Other convenience methods</h3>

				<h4>flip()</h4>

				<p>We can use <code>flip()</code> to flip a boolean property value:</p>
				<code class='block'>this.prop('myobj.test').flip()</code>

				<h4>toggleSelect(value)</h4>
				<p>
					We also have <code>toggleSelect()</code> to select/unselect; i.e. set a value if it's null, or null if it's set:
				</p>
				<code class='block'>this.prop('todo').toggleSelect(todo)</code>

				<p>Here, since it's not a nested property, this is equivalent to:</p>
				<code class='block'>this.todo = this.todo ? null : todo</code>


				<h4>cycleValueWithin(values[], step=1, wrap=true)</h4>

				<p>Mirroring the utility function that we can import from utils.js, but here it works with a nested property, and since we already have the current value, we don't need to pass it in the first argument, so the signature is different:</p>

				<code class='block'>this.prop('todo.color').cycleValueWithin(COLORS) </code>

				<p>Here's how you would use the utility function for a non-nested prop:</p>
				<code class='block'>this.color = cycleValueWithin(this.color, COLORS)</code>

				<p>But nothing prevents us to use the prop object even for top-level props:</p>
				<code class='block'>this.prop('color').cycleValueWithin(COLORS) </code>
			</div>

			<h2>vs-selector and options mappers</h2>


			<!-- <p>
				<button
					@click=${ e => this.prop('myobj.propA[1].id', val => ++val) }>
					Increment <code>this.myobj.propA[1].id</code>
				</button>
			</p>
			<p>
				Result (this.myobj.propA[1].id): ${ this.myobj.propA[1].id }
			</p>

			<p>
				<button
					@click=${ e => this.prop('myobj.propA').push({id:'x' + id++}) }>
					Push new obj to <code>this.myobj.propA</code>
				</button>
			</p>
			<p>
				Last item id: ${ this.prop('myobj.propA').last().id }
			</p> -->
		</main>
	`

	homeFR = () => html`
		français…
	`

}

VS.aspects = {
	// portrait_alt: .5,
	portrait: 		1,
	// portrait_max:	1,
	landscape: 		1,
	landscape_max: 3/2,
	threshold: 		1.2,
	cross_margin: '1.23%',
}

VS.properties = {
	show_nav: {
		value: false,
		class: 'show-nav',
	},
	myobj: {
		value: { propA: [ { id:1 }, { id:2 } ] },
		force_render: true,
		watcher( val){
			log('check', 'myobj:', val.propA[1].id )
		}
	}
}
define('vision-stage', App)