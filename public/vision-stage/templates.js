import { VisionStage as VS, html, cache, icon, useSVG, log } from '/vision-stage/vision-stage.min.js'
import { q, sleep, strIf, cycleValueWithin } from '/vision-stage/utils.js'

const fs = window.screenfull // embeded / global
const config = VS.config

export function appHeader(type='lang-left', left_part){
	return type==='lang-center' ? html`
	<header id='app-header' class='alt-scaling lang-center'>

		<span>${ left_part || '' }</span>

		<span flow='row gaps' id='lang-bar'>
			<span class='equal-deco'> = </span>
			${ this.languages.map( (lang,i) => html`
				<button is='vs-button'
					@pointerdown=${ e => this.lang = lang }
					class='bare uppercase underline josefin-400 ${ strIf('selected', this.lang === lang) }'
					>
					${ lang.toUpperCase() }
				</button>
				<span class='equal-deco'> = </span>
			`)}
		</span>

		${ rightSettings.call(this) }

	</header>`
	:
	html`
	<header id='app-header' flow='row space-between' class='alt-scaling lang-left'>
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

		${ rightSettings.call(this) }
	</header>`
}

function rightSettings(){ return html`
	<span flow='row right gaps'>
		<button is='vs-button' id='night-mode-toggle' class='square bare' aria-label=${ this.$night_mode }
			@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }>
			<span class='icon moon ${strIf('night',this.night_mode)}' shift='-1'>🌙</span>
		</button>

		<button is='vs-button' id='fullscreen-toggle'
			class='square bare'
			aria-label=${ this.$fullscreen }
			@pointerdown=${ async e => { fs.isEnabled && fs.toggle() ; await sleep(100) ; this.render() } }
			>
			${ icon(`fullscreen-${ fs.isFullscreen ? 'exit':'enter' }`, 'large') }
		</button>
	</span>`
}
export function appContent(options){ return html`
	<section id='app-content' class=${options?.class||'scroll shadow'} flow='col top stretch grow'>

		<!-- For when showing menu (footer nav or game) or settings (settingsTemplate()) -->
		<div id='veil'
			class='layer ${ strIf('show', this.show_menu || this.show_settings) }'
			@pointerdown=${ () => { if (this.page && this.show_menu) this.show_menu = false }}>
		</div>

		<!-- load vs-modal to activate -->
		<vs-modal type='full'></vs-modal>

		<!-- optional settings template -->
		${ this.settingsTemplate?.() }

		<!-- cached pages templates – calls methods named after their page name -->
		${ this.page !== null && cache( this[ this.page||'home' ]() ) }
	</section>
`}

export function appFooter(type='nav'){
	// type === string | HTMLTemplateResult
	return type==='nav' ? html`
	<footer id='app-footer' flow='row' class='alt-scaling rel'>

		<button is='vs-button' id='nav-toggle' class='square bare'
			@pointerdown=${ e => this.show_menu = !this.show_menu }
			>
			${ icon('navicon-round', 'x-large') }
		</button>

		<nav flow='row gaps-large' class='v-menu nowrap'
			@pointerup=${ e => this.show_menu = false }>
			${ this.pages && this.pages.map( ([page],i) =>
				this.getPageLink(page, i < this.pages.length-1 ? '✦' : '')
			)}
		</nav>

	</footer>`

	: html`
	<footer id='app-footer' flow='row' class='alt-scaling rel'>
		<!-- slotted content ? -->
		${ type }
	</footer>`
}

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

			<button is='vs-button'
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
				@pointerdown=${ e => {
					//log('ok', 'e.target', e.target)
					// will have page defined if clicked button
					// otherwise: we clicked nav bg -> only close if page
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

			<button is='vs-button'
				id='night-mode-toggle'
				class='square bare fadable ${ strIf('faded', !this.show_settings) }'
				title=${ this.$night_mode }
				@pointerdown=${ e => this.night_mode = cycleValueWithin(this.night_mode, config.night_modes) }
				>
				<span class='shift-icon icon moon ${this.night_mode===0?'':'night'}' shift='-1'>🌙</span>
			</button>

			<button is='vs-button'
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

			<button is='vs-button'
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