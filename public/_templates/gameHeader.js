import { VisionStage as VS, html, useSVG, icon } from '/vision-stage/vision-stage.min.js'
import { q, sleep, strIf, cycleValueWithin }
	from '/vision-stage/utils.js'

const fs = window.screenfull // embeded / global
const config = VS.config

export function gameHeader(){ return html`
<header id='app-header' flow='row space-between' class='alt-scaling text-center'>

	<span
		id='lang-bar'
		flow='row left gaps'
		class='fadable ${ strIf('faded', !this.show_settings) }'
		>
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

	<span id='title' flow='col top'>

		<h1>${ this.$title }</h1>

		<button
			id='page-btn'
			class='abs bare fadable ${ this.show_menu||this.show_settings ? 'faded':'delayed-fade-in' }'
			title=${ this.$menu }
			@pointerdown=${ () => {
				//if (!this.show_settings)
					this.show_menu = !this.show_menu
			}}
			>
			<div>${ this.pages && this.getPage( this.page).title || '--'}</div>
			${ useSVG('fanion','fanion layer', 'none') }
		</button>

		<nav
			flow='col'
			class='abs ${ strIf('show', this.show_menu) }'
			@click=${ e => {
				//log('ok', 'e.target', e.target)
				// will have page defined if button
				// otherwise: we clicked nav bg -> only close if !!page
				if (e.target.classList.contains('button') || this.page){
					this.show_menu = false
				}
			}}
			>
			${ this.pages && this.pages.map( ([page_name],i) => {
				const pre =
					!page_name ? '':
					page_name.startsWith('/') ? '/' : // abs path
					page_name.startsWith('./') ? '' : // rel path
					'#' // bare path -> virtual page

				const p = this.getPage(page_name)
				let path = p.path
				if( pre === '/')
					path = page_name.slice(1) // pre has it
				// log('red', 'path:', path)

				return html`
					<a href='${ pre }${ page_name ? path : '' }'
						class='button ${ strIf('selected', page_name === this.page) }'
						>
						<span>${ p.title }</span>
						${ useSVG('fanion','fanion layer', 'none') }
					</a>
				`
			})}
		</nav>
	</span>

	<span flow='row right gaps'>

		<button
			id='night-mode-toggle'
			class='square bare fadable ${ strIf('faded', !this.show_settings) }'
			title=${ this.$night_mode }
			@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }
			>
			<span class='shift-icon icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
		</button>

		<button
			id='fullscreen-toggle'
			class='square bare fadable ${ strIf('faded', !this.show_settings) }'
			title=${ this.$fullscreen }
			@pointerdown=${ async e => {
				fs.isEnabled && fs.toggle();
				await sleep(100);
				this.render()
			}}
			>
			${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'x-large') }
		</button>

		<button
			id='settings-btn'
			class='square bare'
			title=${ this.$settings }
			@pointerdown=${ () => {
				if (!this.show_menu)
					this.show_settings = !this.show_settings
			}}
			>
			${ this.show_settings ?
				html`<span class='vs-icon x-large rel shift-down-2 fade-in'>✖</span>` :
				icon('navicon-round', 'xx-large fade-in')
			}
		</button>

	</span>

</header>
`}