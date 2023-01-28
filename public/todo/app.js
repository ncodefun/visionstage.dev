import { VisionStage, html, define, log, icon, cache, maybe }
	from '/vision-stage/vision-stage.min.js'

import { cycleWithin, strIf, nextFrame, q }
	from '/vision-stage/utils.js'

const fs = screenfull
var NIGHT_MODES = [0,1,2]

class App extends VisionStage {

	onConnected = () => this.render()

	template = () => html`
		<header id='app-header' flow='row space-between' class='sth-scaling text-center'>

			<span flow='row left gaps' id='lang-bar'>
				<vs-selector id='lang-selector'
					btns-class='gaps'
					btn-class='bare uppercase tiny-bar josefin-400'
					type='underline'
					direction='horizontal'
					.options=${ this.languages }
					.selected=${ this.lang }
					@change=${ e => this.lang = e.target.selected }>
				</vs-selector>
			</span>

			<span flow='row right gaps'>

				<button id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
					@pointerdown=${ e => this.night_mode = cycleWithin(NIGHT_MODES, this.night_mode) }>
					<span class='icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
				</button>
				<button id='fullscreen-toggle'
					class='square bare'
					aria-label=${ this.$fullscreen }
					@click=${ async e => { fs.isEnabled && fs.toggle() ; sleep(100) ; this.render() } }
					>
					${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'large') }
				</button>
			</span>

		</header>

		${ cache( this[ this.page||'home' ]() ) }

		<footer id='app-footer' class='sth-scaling rel' flow='row'>

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
		<main id='home' flow='col top grow' class='scroll shadow'>
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
				<input type='text' id='todo-input' placeholder='new todo'>
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
							this.valueFromObject( this.todos[ this.todos.indexOf( this.todo) - 1],
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
							// valueFromObject:
							// get an object, check conditions,
							// -> return a value from object || null if condition failed

							// So here: validate a possible next todo
							// and if valid, return its created val + 1
							this.valueFromObject( this.todos[ this.todos.indexOf( this.todo) + 1],
								next => !!next && !next.done, // .done are kept below
								next => next.created + 1
							)
							// if valueFromObject is null (condition failed), keep the same
							|| this.todo.created
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
		</main>
	`
}

const newTodo = title => ({
	title,
	done: false,
	details: '',
	created: Date.now()
})

App.aspects = { portrait:.6, portrait_max:1, landscape:1 }

App.languages = ['en', 'fr']

App.strings = {
	title: 				["Title", "Titre"],
	details: 			["Details", "Détails"],
	more_infos: 		["More informations", "Plus d'informations"],
	move_up: 			["Move up", "Déplacer<br>vers le haut"],
	move_down: 			["Move down", "Déplacer<br>vers le bas"],
	todo: 				["To do", "À faire"]
}

App.pages = {
	'': 					["Home", "Accueil"],
	'/vision-stage': 	['Vision Stage', 'Vision Stage'],
	'/todo': 			['Todo', 'Todo'],
	'/test': 			['Components', 'Composantes'],
	'/triads': 			['Guitar', 'Guitare']
}

App.properties = {
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
	}
}

define( 'vision-stage', App, ['vs-selector'])