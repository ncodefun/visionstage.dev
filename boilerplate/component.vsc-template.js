;(function Template() {
	const toTitleCase = str =>
		str.replace(/\W+(.)/g, (m, chr) => chr.toUpperCase())
			 .replace(/^(.)/, (m, chr) => chr.toUpperCase())
	return {
		userInputs: [
				{
					title: 'Component Name : ',
					argumentName: 'name', // will become input in template
					defaultValue: 'test-comp'
				}
		],
		template: [
			{
				type: 'file',
				name: inputs => `${inputs.name}.js`,
				content: inputs => `
import { Component, html, define, log, q } from '/vision-stage/vision-stage.min.js'
// import { tempClass } from '/vision-stage/utils-core.js'

class ${toTitleCase(inputs.name)} extends Component {

	onConnected(){
		this.render()
	}

	template(){
		return html\`
			hello
		\`
	}

	// onFirstRendered(){}
	// onRendered(){}
}

${toTitleCase(inputs.name)}.properties = {
	ex: {
		value: 'test',
		stored: true,
		class: 'clss',
		attribute: 'name',
		watcher( val, prev){

		},
		transformer( val, prev){
			return val
		}
	}
}

${toTitleCase(inputs.name)}.strings = {
	fr: {

	},
	en: {

	}
}

define( '${inputs.name}', ${toTitleCase(inputs.name)}, [])
`
			},
			{
				type: 'file',
				name: inputs => `${inputs.name}.css`,
				content: inputs => ``
			}
		]
	}
})