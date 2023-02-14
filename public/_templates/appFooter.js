import { html, icon } from '/vision-stage/vision-stage.min.js'
import { q, sleep } from '/vision-stage/utils.js'

export function appFooter(type='nav'){ // type === string | HTMLTemplateResult
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