import log from './z-console.js'
export { log }
export const strIf = (str, condition) => condition ? str : ''
export const q = sel => document.querySelector( sel)
export const qAll = sel => document.querySelectorAll( sel)
export const clone = obj => JSON.parse( JSON.stringify( obj))
export const ctor = target => Object.getPrototypeOf( target).constructor
/** like toFixed but no rounding for the last digit, and works with string input. return a string from a number truncated to x decimal places */
export function cleanNum( num, places=3){
	if( typeof num === 'string')
		num = parseFloat( num)
	return num.toFixed( places+1).slice(0,-1) /// remove last which is rounded
}
export const isObject = o => !!o && typeof o === 'object' && !Array.isArray( o)

export function maybe( thing){
	return thing || {}
}

/**
 * Utility to gather CSS classes accepting falsy values, filter those out and join them with a space.
 */
export const classes = (...classes) => classes.filter( c => c).join(' ')

/**
 * Adds a 'class' prop to each items equaling the (implicit or explicit) label's value.
 *
 * For each item:
 * - If it's an object, add `class` prop equaling the `label`'s value,
 * - If it's a string, create an object
 *   with `label` and `class` props equaling the string value.
 */
export const labelAsClassMapper = o =>
	typeof o === 'string' ? {label:o, class:o} : {...o, class:o.label}

/** [ option (label || [label,value]) ] */
/**
 * create an options object for vs-selector
 * from an array of ["label( | details)?" | [locale labels], value?, classes?]
 */
export function options(opts){
	const details = []
	const labels = opts.map( o => Array.isArray(o) ? o[0] : o)
		// labels might have details ( "label | more details..." )
		.map( (label,i) => typeof label === 'string' ?
			parseLabel( label, details, i) :
			parseLabels( label, details, i))
	// Copy label for value:
	// option not array / is string -> take it for value
	// option is array : // [[label_en, label_fr], v?]
	// if value ([1]), take it
	// else, [0] is labels, take first label [0], default lang
	// (if no val and single label, option would not be an array...)
	/// if we copy label b/c no value, use the parsed one from above...
	const values = opts.map( (o,i) => Array.isArray(o) ? o[1]!==undefined ? o[1] :
		parseLabel(o[0][0]) : labels[i])
	//log('info', 'labels, values',labels, values)
	return { labels, values, details, classes: opts.map( o => o[2]) }
}
function parseLabel( label, details_arr, details_index){
	let [l,d] = label.split(' | ')
	if (details_arr) details_arr[details_index] = d
	return l
}
function parseLabels( labels, details, index){
	let [l,d] = explodeArray( labels.map( str => str.split(' | ')))
	details[ index] = d
	return l // arrays of only locale labels
}
const explodeArray = (arr) => arr.reduce( (cumul,val) =>
	cumul.forEach((a,i) => a.push( val[ i])) || cumul
, Array.from( Array(arr[0].length), () => []) )

export const createOptions = opts => ({
	labels: 	opts.map( o =>
		typeof o === 'string' ? o :
		o.label !== undefined ? o.label :
		opts[0].label), // default to first option's label (required)
	details: opts.map( o => o.detail),
	values: 	opts.map( o =>
		o.value !== undefined ? o.value :
		Array.isArray(o.label) ? o.label[0] : o.label||o
	),
	classes: opts.map( o => o.class !== undefined ? o.class :
		!o.label ? opts[0].class : undefined),
	selected_class: opts.map( o =>
		o.selected_class !== undefined ? o.selected_class :
		o.label === undefined ? opts[0].selected_class : undefined
	),
})
/**
 * Get a value in an array from a starting value, plus/minus step
 * @param vals Array of values to cycle
 * @param from_val value to start from
 * @param step (default 1) How many step to move (positive or negative)
 * @param wrap If this wraps pass end from last to first, and inversely; if false, value will stick at first or at last value if we try to go beyond.
 * @return The value at (+/-) steps from val position
 */
export function cycleWithin( values, from_val, step=1, wrap=true){
	let next = values.indexOf( from_val) + step,
		 len = values.length
		//  log('pink', 'next, len:', next, len, (len + next) % len)
	return values[ wrap ? (len + next) % len : clamp( next, 0, len-1) ]
}
/**
  * Auto data-state value cycling instead of class/no-class toggling
  * Ex: data-state='off' data-states='on,off' : on click => cycleDataStates( e.target)
  * @return new data-state value
  */
export function cycleDataStates( target, wrap=true){
	if( !target.dataset.states && !target.states){
		console.error('NO DATA-STATES ON TARGET:', target)
		return
	}
	// space or comma separated values
	const states = target.states || target.dataset.states.split( /\s*,?\s*/)
	const actual_state = target.dataset.state
	target.dataset.state = states[ nextIndexOf( actual_state, states, wrap)]
	return target.dataset.state
}
/// log,, , , , , , , containsHTML

export const clamp = (num,min,max) => Math.max( Math.min( num, max), min)
/**
 * throttle: callback is called at a max speed during events
 * debounce: callback is only called after events have stopped
 * creates a debouced version of a function; Use for debouncing or throttling a rapid event callback
 * @param {function} callback The function to call back debouced / throttled
 * @param {number} [debounce_dly=1000] ms - callback is debounced (skipped) as long as events are fired within this delay.
 * @param {number} [throttle_dly=0] ms - if>0, callback will be triggered at this interval even if events are fired faster.
 * @param {bool} [initial_call=false] fire the callback once at start
 * @param {number} [precision=100] ms - period for checking elapsed time, no need to check as often as events...
 */
export function debounce( callback, debounce_dly=1000, throttle_dly=0, initial_call=false, precision=100){

	let last_call = 0, onInterval_running = false, _params, initially_called = false, elapsed, t3, last_callback, now
	//console.log('debounce:', debounce_dly)
	return function onCall( ...params){
		_params = params
		now = Date.now()
		last_call = now

		if( !onInterval_running){
			onInterval_running = true
			last_callback = now /// first time just use start time
			t3 = setInterval( onInterval, precision)
		}
	}
	/** periodically watch if elapsed time since last callback is > dly */
	function onInterval(){
		now = Date.now()
		elapsed = now - last_call

		if( initial_call && !initially_called){
			initially_called = true
			last_callback = now
			callback( ..._params)
		}
		else if( elapsed > debounce_dly){ /// last callback was enough time ago
			onInterval_running = false
			initially_called = false
			last_callback = now
			clearInterval( t3)
			//console.log('check', 'callback for debounce_dly')
			callback( ..._params)
		}
		else if( throttle_dly){
			if( now - last_callback > throttle_dly){
				last_callback = now
				//console.log('check', 'callback for throttle_dly')
				callback( ..._params)
			}
		}
	}
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/** -> await nextFrame() */
export function nextFrame(){
  return new Promise( resolve => requestAnimationFrame( resolve))
}
/** end inclusive. If using a single param (end) => from 1 to end
 * if we allow zero, it means range(0,0) will return [0];
 * for use when we
*/
export const range = (start, end, allow_reverse=true) => {
	// some apps use: range( 1, arr.length)
	// and expect empty range if arr length is 0
	if( !allow_reverse && end < start)
		return []

	if( end === undefined){ // single param = from 1 to N: range(3) -> 1-3 => [1,2,3]
		end = start
		start = 1
	}
	else if( end === start)
		return [start] // range(1,1) => [1], range(0,0) => [0]

	const reverse = end < start
	if( reverse)
		[start,end] = [end,start]

	const arr = Array.from({ length: (end - start + 1) }, (v, k) => k + start)
	return reverse ? arr.reverse() : arr
}

/**
 * Applies a temporary class; e.g. call attention to a button
 * classList can be string, space sep strings, or an array
 * @param duration sec time before removing class(es)
*/
export function tempClass( el, clss=[], durations=1){
	if( typeof clss === 'string')
		clss = clss.split(' ')
	el.classList.add( ...clss)
	if( !Array.isArray( durations))
		durations = [durations]

	if( durations && durations.length>1){
		//durations.sort( (a,b) => a-b)
		durations.reduce( (prev,current) => {
			if( prev > current) throw 'tempClass durations must be in increasing order'
		})
		//console.log('classes:', clss, durations)
		let i = 0
		for( let dur of durations)
			setTimeout( () => {
				//console.log('remove class:', clss[i], 'dur:', dur)
				el.classList.remove( clss[i++])
			}, dur*1000)
	}
	else
		setTimeout( () => { el.classList.remove( ...clss) }, durations ? durations[0]*1000 : 0)
}
export function el( tag, content, attribs={}){
	let elem = document.createElement(tag)
	for( let k in attribs)
		elem.setAttribute( k, attribs[ k])
	if( content){
		if( typeof content === 'string')
			elem.innerHTML = content
		else if( content instanceof HTMLElement)
			elem.appendChild( content)
		else throw Error('el(,content,) => Unknown content type')
	}
	return elem
}
/**
 * @usage const sorter = fieldSorter(['name','qty']); <br>const sorted = arr.sort( sorter)
 */
export const fieldSorter = fields =>
	(a, b) => fields.map( o => {
		let dir = 1
		if( o[0] === '-'){ dir = -1; o = o.substring(1) }
		return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0
	})
	.reduce( (p,n) => p ? p : n, 0)

const containsHTMLEntities = str => /&[\d\w]+;/.test( str)
// based on standard syntax: no space after '<' nor before '>' : <xxx> <xxx xxx="">
const containsHTMLElements = str => /\<\S.*?\S\>/.test( str)
export const containsHTML = str => {
	// log('check', 'check if contains HTML:', str, '->', containsHTMLElements( str) || containsHTMLEnties( str))
	return containsHTMLElements( str) || containsHTMLEntities( str)
}
