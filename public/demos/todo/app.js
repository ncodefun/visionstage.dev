import { VisionStage as VS, html, define, log, icon }
	from '/vision-stage/vision-stage.min.js'

import { strIf, nextFrame, sleep, q }
	from '/vision-stage/utils.js'

import { appHeader, appContent, appFooter }
	 from '/vision-stage/templates.js'


class App extends VS {

	onConnected = () => {
		// clearStores() // import from vs
		this.render()
	}

	async testModal(){
		const answer = await this.modal.setup(
			["Hello","What's your name?"], [['OK','primary']], true)
		log('info', 'answer:', answer)
	}

	extra_settings = () => html`
		<button is='vs-button' id='dark-controls-toggle'
			class='square bare'
			@pointerdown=${ e => this.dark_components = !this.dark_components }
			>
			<span class='icon sun ${ this.dark_components ? 'dark':'' }'>☀️</span>
		</button>
	`

	template = () => html`
		${ appHeader.call(this, {extra_settings:this.extra_settings}) }
		${ appContent.call(this) }
		${ appFooter.call(this, 'nav') }
	`

	home = () => html`
		<main id='home' flow='col top grow'>
			<p>${this.params?.map(p=>html`<div>Param: ${p[0]}</div>`)}</p>
			<h1>${ this.$todo }</h1>
			<form
				flow='row stretch'
				@submit=${ e => {
					e.preventDefault()
					let val = q('#todo-input').value
					if( val){
						// set todo as the new one we've pushed in todos
						this.prop('todo', this.prop('todos').push( newTodo( val)))
						q('#todo-input').value = ''
					}
				}}
				>
				<input is='vs-input' type='text' id='todo-input' placeholder=${this.$new_todo}>
				<button class='primary small'>${ icon('plus', 'small') }</button>
			</form>

			<ul class='scroll'
				@keyup=${ async e => {
					// if we toggle .done with space or enter,
					// items will be reordered,
					// but lit-html reuse elements and only update
					// the content instead of removing / inserting;
					// so the focus will remain on the element
					// which doesn't match the item anymore…
					// Solution: capture the activeElement's item
					// and reassign focus to element matching item
					if (/Space|Enter/.test(e.code)){
						this.focused_item = e.target.parentElement.item
						await sleep(0)// nextFrame is not enough, this needs two!…
						this.qAll('#home li')
							.find( el => el.item === this.focused_item)
							.querySelector('button:first-of-type')
							.focus()
					}
				}}>
				${
				this.todos
				.sort( (a,b) =>
					// put done todos last
					a.done&&!b.done ? 1 : b.done&&!a.done ? -1 :
					// then, sort by creation time
					// (possibly altered for manual reordering)
					a.created - b.created
				)
				.map( (todo,i) => html`
				<li
					flow='row space-between'
					class=${ strIf('selected primary', todo===this.todo) }
					.item=${ todo }
					>
					<button
						class='checkbox bare-part icon'
						@click=${ e => { todo.done = !todo.done ; this.render() } }
						>
						${ icon(`checkbox-${ strIf('un', !todo.done) }checked`) }
					</button>

					<button
						class='todo-item bare-part ${ strIf( 'done', todo.done) }'
						@click=${ e => this.prop('todo').toggleSelect(todo) }
						>
						${ todo.title }
					</button>

					<button
						class='remove small round bare-part'
						@click=${ e => { this.prop('todos').remove(i) ; this.todo = null }}
						>
						✖
					</button>
				</li>`)
			}</ul>

			<section class=${ strIf('hide', !this.todo) }>
				<div
					flow='row gaps'
					>
					<!--/// Reorder todo by shifting .created time above or below prev or next. -->
					<!--/// Uses *validateAndCompute()* for a one liner; gets a next or prev todo and if exists, mod it. -->

					<button id='shift-up'
						?disabled=${ this.todo?.done }
						class='small'
						@click=${ e => this.todo.created =
							// if possible, set it to prev.created - 1
							this.validateAndCompute(
								this.todos[ this.todos.indexOf(this.todo) - 1 ],
								prev => !!prev, // validator
								prev => prev.created - 1 // compute return value
							)
							|| this.todo.created }
						>
						${ this.$move_up }
					</button>

					<button id='shift-down'
						?disabled=${ this.todo?.done }
						class='small'
						@click=${ e => this.todo.created =
							// if possible, set it to next.created + 1
							this.validateAndCompute(
								this.todos[ this.todos.indexOf( this.todo) + 1], // get a possible next
								next => !!next && !next.done, // validate: if next exist and not .done (are kept below)
								next => next.created + 1 // compute: increment next.created for the return
							)
							|| this.todo.created // keep the same
						}
						>
						${ this.$move_down }
					</button>
				</div>

				<hr>

				<div flow='col stretch'>

					<label>${ this.$title }</label>
					<input type='text'
						id='todo-title'
						.value=${ this.todo?.title }
						@input=${ e => this.prop('todo.title', e.target.value) }>
					</input>

					<label>${ this.$details }</label>
					<textarea
						id='todo-details'
						cols='30' rows='5'
						placeholder=${ this.$more_infos }
						spellcheck='false'
						.value=${ this.todo?.details }
						@input=${ e => this.prop('todo.details', e.target.value) }>
					</textarea>
				</div>

				<!-- show pattern where data is mutated elsewhere... -->
			</section>

			<footer class='m-t-auto'>
				<button style='margin: 2rem 0 0'
					@click=${ this.testModal }>
					Test modal
				</button>
			</footer>

			<!-- <button id='test-update-btn'>Test update SW</button> -->
		</main>
	`

	two = () => html`
		<main id='two' flow='col top grow'>
			<h1>Page two</h1>
			<p>
				Here's a <a href='#'>link home</a>
			</p>
		</main>
	`

	async onCacheUpdated(){
		// log('ok', 'update ready!')
		const answer = await this.modal?.setup(['An update is ready.','Refresh?'], ['Later', 'Yes'])
		if( answer===1) location.reload()
	}
}

const newTodo = title => ({
	title,
	done: false,
	details: '',
	created: Date.now()
})

VS.config = {
	sw: '/demos/todo/sw.js',
	update_check_min: 30,
}

VS.aspects = {
	portrait:.6,
	portrait_max:.75,
	landscape:1,
	landscape_max:16/9,
	cross_margin: '1.23%'
}

VS.sounds = {
	// good: 'good.wav',
	// wrong: ['wrong.wav', { volume: 0.6 }],
	// win:	'win.mp3',
}

VS.languages = ['en', 'fr']

VS.pages = {

	// empty name => document.title = app.$title only (no • page)
	'': 							["Home", "Accueil"],
	'two':						["Two","Deux"],
	'/demos/vs-selector': 	['vs-selector'],
	'/demos/guitar-vision':	['Guitar Vision'],
	'https://github.com/ncodefun/visionstage.dev': ["Github"]
}

VS.strings = {
	title: 				["Todo", "Tâches"],
	details: 			["Details", "Détails"],
	more_infos: 		["More informations", "Plus d'informations"],
	move_up: 			["Move up", "Déplacer<br>vers le haut"],
	move_down: 			["Move down", "Déplacer<br>vers le bas"],
	todo: 				["To do", "Tâches"],
	new_todo: 			["New todo", "Nouvelle tâches"],

}

VS.properties = {
	todos: {
		value: [],
		storable: true,
		force_render: true,
		/// Force render → we use prop() methods for deep mods that
		/// gonna re-assing array to itself to trigger watcher, render etc.
		/// but normally we prevent those if val is identical…
	},
	todo: {
		value: null,
		async watcher(val){
			// scroll to bottom if a todo is selected
			if( val){
				await nextFrame()
				let main = this.q('main')
				main.scrollTop = main.clientHeight
			}
		}
	},
	dark_components: {
		value: false,
		class: 'dark-components',
		storable: true
	},
}

define('vision-stage', App, ['vs-selector', 'vs-modal'])