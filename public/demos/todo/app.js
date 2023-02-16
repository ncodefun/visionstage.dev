import { VisionStage as VS, html, define, log, icon, maybe, clearStores }
	from '/vision-stage/vision-stage.min.js'

import { strIf, nextFrame, q }
	from '/vision-stage/utils.js'

import { appHeader, appContent, appFooter }
	 from '/vision-stage/templates.js'

class App extends VS {

	onConnected = () => {
		// clearStores()
		this.render()
	}

	async testModal(){
		const answer = await this.modal.setup(["Hello","What's your name?"], null, true)
		log('info', 'answer:', answer)
	}

	template = () => html`
		${ appHeader.call(this) }
		${ appContent.call(this) }
		${ appFooter.call(this, 'nav') }
	`

	home = () => html`
		<main id='home' flow='col top grow' class='scroll shadow'>
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
				<vs-text-input id='todo-input' placeholder='new todo'></vs-text-input>
				<button class='primary small'>${ icon('plus', 'small') }</button>
			</form>

			<ul class='scroll'>${ this.todos
				.sort( (a,b) =>
					a.done&&!b.done ? 1 : b.done&&!a.done ? -1 : // put done todos last
					a.created - b.created // then, sort by creation time
				)
				.map( (todo,i) => html`
				<li
					flow='row space-between'
					class=${ strIf('selected', todo===this.todo) }
					>
					<button
						class='checkbox bare icon'
						@click=${ e => { todo.done = !todo.done ; this.render() } }
						>
						${ icon(`checkbox-${ strIf( 'un', !todo.done) }checked`) }
					</button>

					<button
						class='todo-item bare ${ strIf( 'done', todo.done) }'
						@click=${ e => this.prop('todo').toggleSelect( todo) }
						>
						${ todo.title }
					</button>

					<button
						class='remove small round bare'
						@click=${ e => { this.prop('todos').remove(i) ; this.todo = null }}
						>
						✖
					</button>
				</li>`)
			}</ul>

			<section class=${ strIf('hide', !this.todo) }>
				<div
					flow='row gaps'
					?='Reorder todo by shifting .created time above or below prev or next.'
					?='Uses *valMod()* for a one liner; gets a next or prev todo and if exists, mod it.'
					>
					<button id='shift-up'
						?disabled=${ maybe(this.todo).done }
						class='small'
						@click=${ e => this.todo.created =
							this.validateAndCompute(
								this.todos[ this.todos.indexOf( this.todo) - 1],
								prev => !!prev, // validator
								prev => prev.created - 1 // new value
							)
							|| this.todo.created }
						>
						${ this.$move_up }
					</button>

					<button id='shift-down'
						?disabled=${ maybe(this.todo).done }
						class='small'
						@click=${ e => this.todo.created =
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
						.value=${ maybe( this.todo).title }
						@input=${ e => this.prop('todo.title', e.target.value) }>
					</input>

					<label>${ this.$details }</label>
					<textarea
						id='todo-details'
						cols='30' rows='5'
						placeholder=${ this.$more_infos }
						spellcheck='false'
						.value=${ maybe( this.todo).details }
						@input=${ e => this.prop('todo.details', e.target.value) }>
					</textarea>
				</div>

				<!-- show pattern where data is mutated elsewhere... -->
			</section>

			<button self='bottom'
				@pointerdown=${ this.testModal }>Toggle modal</button>

			<!-- <button id='test-update-btn'>Test update SW</button> -->
		</main>
	`

	two = () => html`<main><h1>Page two</h1></main>`

	onPageChanged(){

	}

	async onCacheUpdated(){
		log('ok', 'update ready!')
		const answer = await this.modal?.setup(['An update is ready.','Refresh?'], ['Later', 'Yes'])
		if( answer===1)
			location.reload()
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
	update_check_min: 1,
}

VS.aspects = {
	portrait:.6,
	portrait_max:1,
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
	todo: 				["To do", "Tâches"]
}

VS.properties = {
	todos: {
		value: [],
		storable: true
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
	show_veil: {
		value: false,
		//getter: () => this.show_menu || this.show_settings
	},

}

define('vision-stage', App, ['vs-selector', 'vs-modal', 'vs-text-input'])

// {
// 	update_check_min: 30,
// 	font_size_decimals: 0,
// 	night_modes: [0,1],
// }