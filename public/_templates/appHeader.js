import { VisionStage as VS, html, icon } from '/vision-stage/vision-stage.min.js'
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

	</span>

</header>`
:
html`
<header id='app-header' class='alt-scaling lang-center'>

</header>`
}