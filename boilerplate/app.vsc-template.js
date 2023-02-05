;(function Template() {
	const toTitleCase = str =>
		str.replace(/\W+(.)/g, (m, chr) => chr.toUpperCase())
			 .replace(/^(.)/, (m, chr) => chr.toUpperCase())
	const title = str => str.replace(/\-/g,' ').replace(/^(.)/, (m, chr) => chr.toUpperCase())
	return {
		userInputs: [
			{
				title: 'App name (no space):',
				argumentName: 'app_name',
				defaultValue: 'my-app'
			},
			{
				title: 'Website name (no space):',
				argumentName: 'website_name',
				defaultValue: 'my-website'
			},
			{
				title: 'Use options ?',
				argumentName: 'use_options',
				defaultValue: 'yes'
			},
			{
				title: 'Use title banner ?',
				argumentName: 'use_banner',
				defaultValue: 'yes'
			},
			{
				title: 'Use scenes ?',
				argumentName: 'use_scenes',
				defaultValue: 'yes'
			},
			{
				title: 'Use auth ?',
				argumentName: 'use_auth',
				defaultValue: 'yes'
			}
		],
		template: [
 		{
			type: 'folder',
			name: inputs => `${inputs.app_name}`,
			children: [
				{
					type: 'file',
					name: inputs => `app.css`,
					content: inputs => ``
				},
				{
					type: 'file',
					name: inputs => `app.js`,
					content: inputs => {
						const use_app_header =
							inputs.use_options==='yes' || inputs.use_banner==='yes' ||
							inputs.use_scenes==='yes' || inputs.use_auth==='yes'
						return `import { Component, VisionStage, q, html, define, log, useSVG,range }
	from '../vision-stage/vision-stage.min.js'

// import { debounce } from
// 	'../vision-stage/web_modules/utils-core.js'
${ inputs.use_scenes==='yes' ? `const scenes = {
	fr: { A: "Jeu A", B: "Jeu B", 'éditeur': "Éditeur" },
	en: { A: "Game A", B: "Game B", 'éditeur': "Editor" }
}` : '' }

class App extends VisionStage {

	onConnected(){
		this.allow_students = true // show student signin tab in auth menu
		this.render()
	}

	onAuthentified( role, data){
		log('info', 'user role is:', role)
	}

	onFirstRendered(){
		// load non-crucial components here
		// Component.load('inputs/button-waiting')
		// Component.load('inputs/simple-selector')
		this.faded = false
	}

	template(){
		return html\`
		<popup-full></popup-full>
		${ use_app_header ? `
		<app-header ${inputs.use_scenes==='yes'?'.scenes=${ scenes } ':''}use='${inputs.use_options==='yes' ? 'options':''}${inputs.use_auth==='yes' ? ' auth':''}${ inputs.use_banner ? ' banner':'' }' string:title='fr: ${inputs.app_name.toUpperCase().replace(/\-/g,' ')}, en: ${inputs.app_name.toUpperCase().replace(/\-/g,' ')}'></app-header>
` : '' }
		<main class='scroll' flow='col top'>

		</main>\`
	}

	templateForRole( role){
		switch( role){
			case 'none':
				return html\`\`

			case 'basic':
				return html\`\`

			case 'premium':
				return html\`\`

			default: return role
		}
	}
${ inputs.use_options==='yes' ? `
	menuOptionsTemplate(){
		return html\`
		<section></section>
		\`
	}` : '' }
}

// if undefined, will use the default config set in menu_auth
// App.firebase_config = {

// }

App.aspect_ratios = {
	portrait: {
		min_ar: .5,									// max relative height for <vision-stage>	-> below: dead space on top & bottom
		main_min_ar: .6,						// max relative height for <main> -> below: <main> stick at stage's bottom by default
		base_ar: .75, 							// min relative width for <main>  -> below: width remains the same, height grows
		max_ar: .85									// max relative width for <main> & <vision-stage>
	},
	threshold: 1.1,								// switch between portrait and landscape
	landscape: {
		min_ar: 1.333,							// min relative width for <main> & <vision-stage>
		main_max_ar: 1.777,					// max relative width for <main> -> above: <main> stays centered by default
		max_ar: 2										// max relative width for <vision-stage>
	},
	cross_margin: '1.2%',					// if dead space on one axis, add margins on the other
}

App.properties = {
	//
}

App.strings = {
	fr: {

	},
	en: {

	}
}

App.sounds = [
	// ['good', '/vision-stage-resources/sounds/good.mp3'],
	// ['wrong', '/vision-stage-resources/sounds/wrong.mp3', { volume:.6 }],
]

define( 'vision-stage', App, ['app-header'${ inputs.use_options==='yes' ? ", 'menu-options'" : '' }${ inputs.use_scenes==='yes' ? ", 'menu-scenes'" : '' }${ inputs.use_auth==='yes' ? ", 'menu-auth.min'" : '' }])
`}
					},
					{
						type: 'file',
						name: 'index.html',
						content: inputs => {
							const use_app_header =
								inputs.use_options==='yes' || inputs.use_banner==='yes' ||
								inputs.use_scenes==='yes' || inputs.use_auth==='yes'
							return `<!DOCTYPE html>
<html lang='fr'>
<head>
	<title>${title(inputs.app_name)} – ${title(inputs.website_name)}</title>
	<meta 	charset=		'UTF-8'>
	<meta 	name=				'theme-color'
					content=			'hsl(217, 100%, 52%)'>
	<meta 	name=				'description'
					content=			''>
	<meta 	name=				'keywords'
					content=			'web app'>
	<meta 	name=				'web-author'
					content=			'José Roux (joserouxx@gmail.com)'>
	<meta 	name=				'author'
					content=			''>

	<meta 	name=				'viewport'
					content=			'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no'>
	<meta 	name=				'mobile-web-app-capable'
					content=			'yes'>
	<meta 	name=				'apple-mobile-web-app-capable'
					content=			'yes'>
	<meta 	name=				'apple-mobile-web-app-status-bar-style'
					content=			'black-translucent'>

	<link 	rel='author' href='/humans.txt'>


	<!--*  PRELOAD FONTS  *-->
	<link rel='preload' as='font' crossorigin
		href='/vision-stage-resources/fonts/GROBOLDX.woff'> <!-- #loading h1 -->

	<!--*  PRELOAD CSS  *-->
	<link rel='preload' as='style' href='/vision-stage/vision-stage.css'>
${ use_app_header ?
`	<link rel='preload' as='style' href='/vision-stage/components/app-header.css'>` : '' }
${ inputs.use_options==='yes' ?
`	<link rel='preload' as='style' href='/vision-stage/components/menu-options.css'>
	<link rel='preload' as='style' href='/vision-stage/components/inputs/range-slider.css'>` : '' }
${ inputs.use_scenes==='yes' ?
`	<link rel='preload' as='style' href='/vision-stage/components/menu-scenes.css'>` : '' }
${ inputs.use_auth==='yes' ?
`	<link rel='preload' as='style' href='/vision-stage/components/menu-auth.css'>` : '' }

	<!--*  PRELOAD JS  *-->
	<link rel='modulepreload' href='/vision-stage/vision-stage.min.js'>
	<link rel='modulepreload' href='/vision-stage/z-console.js'>
${ use_app_header ?
`	<link rel='modulepreload' href='/vision-stage/components/app-header.js'>` : '' }
${ inputs.use_options==='yes' ?
`	<link rel='modulepreload' href='/vision-stage/components/menu-options.js'>
	<link rel='modulepreload' href='/vision-stage/components/inputs/range-slider.js'>` : '' }
${ inputs.use_scenes==='yes' ?
`	<link rel='modulepreload' href='/vision-stage/components/menu-scenes.js'>` : '' }
${ inputs.use_auth==='yes' ?
`	<link rel='modulepreload' href='/vision-stage/components/menu-auth.js'>
	<link rel="preconnect" href="https://www.gstatic.com"> <!--* auth - firebase *-->` : '' }

	<!--*  ICONS  *-->
	<link rel='icon' type='image/png' sizes='192x192' href='/vision-stage-resources/images/app-icons/android-chrome-192x192.png'>
	<link rel='icon' type='image/png' sizes='32x32'		href='/vision-stage-resources/images/app-icons/favicon-32x32.png'>
	<link rel='icon' type='image/png' sizes='16x16'		href='/vision-stage-resources/images/app-icons/favicon-16x16.png'>
	<link rel='apple-touch-icon' 			sizes='60x60' 	href='/vision-stage-resources/images/app-icons/apple-touch-icon.png'>
	<link rel='manifest' 	 href='./manifest.json'>

	<!--*  CSS  *-->
	<link rel='stylesheet' href='/vision-stage/vision-stage.css'>
	<link rel='stylesheet' href='./app.css'>

	<!--*  JS  *-->
	<script type='module'  src='./app.js'></script>
</head>

<body flow>
	<vision-stage
		store='${inputs.website_name}_${inputs.app_name}'
		langs='fr, en'
		strings:fr='doc-title: ${title(inputs.app_name)} – ${title(inputs.website_name)}'
		strings:en='doc-title: ${title(inputs.app_name)} – ${title(inputs.website_name)}'>
	</vision-stage>

	<div id='loading' class='layer' flow='col'>
		<h1>${title(inputs.app_name)}</h1>
		<div class='loader'><div></div><div></div><div></div><div></div></div>
	</div>
</body>
</html>
`}
					},
					{
						type: 'file',
						name: 'manifest.json',
						content: inputs => `
{
  "short_name": "${inputs.app_name.replace(/\-/g,' ').replace(/^(.)/, (m, chr) => chr.toUpperCase())}",
  "name": "${inputs.app_name.replace(/\-/g,' ').replace(/^(.)/, (m, chr) => chr.toUpperCase())}",
  "icons": [
    {
      "src": "/vision-stage-resources/images/app-icons/android-chrome-192x192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/vision-stage-resources/images/app-icons/android-chrome-512x512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/${inputs.app_name}/",
  "scope": "/${inputs.app_name}/",
  "theme_color": "hsl(217, 100%, 52%)",
  "background_color": "#cccccc",
  "display": "fullscreen",
  "orientation": "landscape"
}
`
					}
				]
			}
		]
	}
})