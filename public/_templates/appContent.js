import { html, cache } from '/vision-stage/vision-stage.min.js'
import { strIf } from '/vision-stage/utils.js'

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