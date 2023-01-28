export const is_mac = navigator.platform === 'MacIntel'
export const is_iOS = /iPad|iPhone|iPod/.test( navigator.platform) ||
							 (is_mac && navigator.maxTouchPoints > 1)
export const is_safari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent)
export const isScrollbarVisible = (element) => element.scrollHeight > element.clientHeight

/** optional chaining util since iOS 12 doesn't support it natively and old iPads are stuck at this version */
export const chain = (obj, ...keys) => { /// chain( this, 'prop', 'sub-prop')
	for( let k of keys) obj = obj && obj[ k] || undefined
	return obj
}
// Helper to return the class or empty string if condition is false
export const strIf = (str, condition) => condition ? str : ''
export const q = sel => document.querySelector( sel)
export const qAll = sel => document.querySelectorAll( sel)
export const clone = obj => JSON.parse( JSON.stringify( obj))
export const ctor = target => Object.getPrototypeOf( target).constructor
export const pathSegments = str => trimPath( str).split('/');
export const trimPath = str => /^\/?(.+?)\/?$/.exec( str)[1];
/** like toFixed but no rounding for the last digit, and works with string input. return a string from a number truncated to x decimal places */
export function cleanNum( num, places=3){
	if( typeof num === 'string')
		num = parseFloat( num)
	return num.toFixed( places+1).slice(0,-1) /// remove last which is rounded
}
export const isObject = o => !!o && typeof o === 'object' && ! Array.isArray( o)
/**
 * parse a flat object-like string, without surrounding braces
 * matches only last comma after a colon so we can use comma in value
*/
export function objectFromString( string, remove_key_prefix=''){
	if( remove_key_prefix){
		const re = new RegExp( remove_key_prefix, 'g')
		string = string.replace(re,'')
	}
	let arr = string.trim()
		.match(/[^:,\s]+\:[^:]+((?=\s*,\s*)|$)/g)
		.map( part => part.split(/\s*:\s*/) )

		// -> all not [:, ] then ":" then all not [:] ending with comma or end

	return Object.fromEntries( arr)
}

const containsHTMLEntities = str => /&[\d\w]+;/.test( str)
// based on standard syntax: no space after '<' nor before '>' : <xxx> <xxx xxx="">
const containsHTMLElements = str => /\<\S.*?\S\>/.test( str)
export const containsHTML = str => {
	// log('check', 'check if contains HTML:', str, '->', containsHTMLElements( str) || containsHTMLEnties( str))
	return containsHTMLElements( str) || containsHTMLEntities( str)
}

export const loadScriptAsync = src => new Promise( (resolve, reject) => {
	let s = document.createElement('script')
	s.onload = () => resolve( src)
	s.onerror = err => reject( err)
	s.async = true
	document.head.appendChild( s)
	s.src = src
})
export const loadScriptsAsync = (scripts, path='') =>
	Promise.all( scripts.map( name => loadScriptAsync( path + name)))

export const loadStyleSheetAsync = href => new Promise( (resolve, reject) => {
	// console.warn('Load script:', src)
	let s = document.createElement('link')
	s.onerror = e => console.error('Error loading stylesheet:', href)
	s.onload = () => resolve( href)
	s.rel = 'stylesheet'
	document.head.appendChild( s)
	s.href = href
})
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
export const range =
	(start, end, allow_reverse=true) => {

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

/** returns an array of number ranging from start to end inclusive, or from 1 to X if passing a single param */
export const numberRange = (start, end) => {
	if( !end){ end = start; start = 1 }
	return Array.from({length: (end - start+1)}, (v, k) => k + start)
}
export const clamp = (num,min,max) => Math.max( Math.min( num, max), min)
export const linearScaling = ( oldMin, oldMax, newMin, newMax, oldValue) =>
	parseFloat((((oldValue - oldMin) * (newMax - newMin)) / (oldMax - oldMin))  + newMin)
/**
 * @param t time position [0-1]
 * @param p power
 * @return transformed (eased) value [0-1]
 */
export const ease = {
	linear: t => t,
	in: (t,p=2) => Math.pow( t, p),
	out: (t,p=2) => 1 - Math.abs( Math.pow( t - 1, p)),
	inOut: (t,p=2) => t < .5 ? ease.in( t * 2, p) / 2 : ease.out( 2 * t - 1, p) / 2 + 0.5,
	outIn: (t,p=2) => t < .5 ? ease.out( t * 2, p) / 2 : ease.in( 2 * (t - 0.5), p) / 2 + 0.5,
	inCirc: t => -1 * (Math.sqrt(1 - t*t) - 1),
	outCirc: t => 1 * Math.sqrt(1 - (t=t-1)*t),
	inOutCirc: 	t => (t*=2) < 1 ?
		-1/2 * (Math.sqrt(1 - t*t) - 1) :
		1/2 * (Math.sqrt(1 - (t-=2)*t) + 1),
	inExpo: t => (t==0) ? 0 : 1 * Math.pow(2, 10 * (t/1 - 1)) ,
	outExpo: t => (t==1) ? 1 : 1 * (-Math.pow(2, -10 * t/1) + 1),
	inOutExpo: t => t==0 ? 0 : t==1 ? 1 :
		(t*=2) < 1 ?
			1/2 * Math.pow(2, 10 * (t - 1)) :
			1/2 * (-Math.pow(2, -10 * --t) + 2),

	/// VERY SIMILAR TO NORMAL EASE IN / OUT
	easeInSine: (t, b=0, c=1, d=1) => -c * Math.cos(t/d * (Math.PI/2)) + c + b,
	easeOutSine: (t, b=0, c=1, d=1) => c * Math.sin(t/d * (Math.PI/2)) + b,
	easeInOutSine: (t, b=0, c=1, d=1) => -c/2 * (Math.cos(Math.PI*t/d) - 1) + b
}
/**
 * Smooth out the curve of an ease for more subtle effect
 * @param ease one of ease methods
 * @param smoothing [0-1] ?
 * ex: const myease = smoothedEase( ease.out, .5); myease(.1, 3)
 */
export const smoothedEase =
	(ease, smoothing) => /// return a new function taking (value, )
		(val, power=2, eased) => /// eased is just a  var declaration, unused param...
			(eased = ease( val, power)) - (eased - val) * smoothing

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

/** multiple props only if use same vals */
export function tempProp( el, props_vals=[], duration=1000){
	for( let [prop, vals] of props_vals){
		//log('check', 'set prop val', prop, vals[0])
		el[ prop] = vals[0]
		setTimeout( () => {
			el[ prop] = vals[1]
			//log('check', 'set prop val', prop, vals[1])
		}, duration)
	}
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
/** Fisher-Yates shuffle
 * @param {Array} array
 * @param {Boolean} in_place if the shuffle should be done on the original array or if a new array should be used
 * @return array or new array if in_place=false
*/
export function shuffle( array, in_place=true) {
	if( !in_place) array = array.concat()
  var current_index = array.length, temporary_value, random_index
  /// While there remain elements to shuffle...
  while( 0 !== current_index){
    /// Pick a remaining element...
    random_index = Math.floor( Math.random() * current_index)
    current_index -= 1
    /// And swap it with the current element.
    temporary_value = array[ current_index]
    array[ current_index] = array[ random_index]
    array[ random_index] = temporary_value
  }
  return array
}

/**
 * randomize while keeping together items with a particular field
 * eg with a 'num' field, values would be: 1 3 1 2 1 1…  =>  1 1 1… 3 3 3… 2 2 2…
 * @param {Array} array
 * @param {string} const_field the field to group items
 */
export function intraShuffle( array, const_field){

	const arrays = new Map()
	for( let item of array){
		let val = item[ const_field]
		if( arrays.has( val))
			arrays.get( val).push( item)
		else
			arrays.set( val, [ item])
	}
	let rtrn = []
	for( let arr of arrays.values()){
		rtrn.push( ...shuffle( arr, true))
	}
	return rtrn
}

/** Get the highest numeric value in an array */
export const highest = arr => {
	return arr.reduce( (last_val, val) => Math.max( last_val, val), 0)
}

/**
 * Get the next or prev value of an array with current value
 * @param {any} from_val	- initial value
 * @param {array} vals		- array
 * @param {string} dir 		- symbolic representation of direction and wrapping //// >> << >>| |<< + - up down 1 -1
 * @return {any}					-	the next or prev value
 * // Usage:  wrap -> cycle( val, vals, '>>') 	no-wrap -> cycle( val, vals, '>>|')
 */
export const cycle = (from_val, vals, dir='>>', wrap=null) => {
	//log('check','cycle:', from_val, vals)
	return /(\>\>|\+|up|1)/.test(dir) ?
	vals[ nextIndexOf( from_val, vals, wrap !== null ? wrap : !dir.endsWith('|')) ] :
	vals[ prevIndexOf( from_val, vals, wrap !== null ? wrap : !dir.startsWith('|')) ];
}
// MULTI-VALUE STATE VALUE CYCLING INSTEAD OF CLASS/NO-CLASS TOGGLING
// ex: data-state='off' data-states='on,off' : on click => cycleDataStates( e.target)
export function cycleDataStates( target, wrap=true){
	if( !target.dataset.states && !target.states){
		console.error('NO DATA-STATES ON TARGET:', target)
		return
	}
	const states = target.states || target.dataset.states.split( /\s*,?\s*/)// at least space sep, maybe comma sep
	const actual_state = target.dataset.state
	target.dataset.state = states[ nextIndexOf( actual_state, states, wrap)]
	return target.dataset.state
}
export const nextIndexOf = (val, vals, wrap=true) =>
	nextIndex( vals.indexOf( val), vals.length, wrap)
export const prevIndexOf = (val, vals, wrap=true) =>
	prevIndex( vals.indexOf( val), vals.length, wrap)


export const nextIndex = (index, len, wrap=true) =>
	!wrap&&index===len-1 ? len-1 : wrapIndex( ++index, len)
export const prevIndex = (index, len, wrap=true) =>
	!wrap&&index===0 ? 0 : wrapIndex( --index, len)
export const wrapIndex = (index, len) => // also wraps negative index!! (e.g. -1,4 => 3)
	((index % len) + len) % len


export function setIntervalImmediately( func, interval) {
  func()
  return setInterval(func, interval)
}
/**
	* // Snaps a value on a virtual grid to the closest side  //
	* +  works with floats and negative values
	* +  e.g. snap(84, 40) => 80
	* @param		{Number}		val				- initial value
	* @param		{Number}		step			- modulo value, defines the grid step size
	* @param		{Number}		offset		- use if the grid is not positioned at a multiple of step (self-synced?)
	* 																	e.g. grid start X = 103, step=20: 103 or 3 as offset
	* @param		{Number}		threshold	- creates a dead spot in the middle of two snap points:
	* 																	if val is too far from snap value (> threshold), return original value
	* 																	// e.g. snap = 30, threshold = 8 => [0-8] snaps to 0, [22-30] snaps to 30, else => no snap
	*																		// use less than a half step. step * .4 means 20% dead spot -> (.4|.4) + .2 + (.4|.4)
	*																		// we can set a percent deadspot by using a string: '30%'
	* @return		{Number}							- the value snapped to the closest point
	*/
export function snap( val, step, offset=0, threshold=null){
	let original = val
	if( typeof threshold === 'string') ////  % deadspot
		threshold = (1 - parseInt( threshold) / 100) / 2 * step

	val = val - offset /// remove offset
	let distL = val - snapFloor( val, step), 	/// distance from val to the left step
		 distR = snapCeil( val, step) - val 		/// distance from val to the right step
	if( Math.abs( distL) < Math.abs( distR)){
		if( threshold && Math.abs( distL) > threshold)
			return original // or null
		return val - distL + offset
	}
	else {
		if( threshold && Math.abs( distR) > threshold)
			return original
		return val + distR + offset
	}
}
/**
	* snap a value on a grid to the higher value
	* @return {Number} value increased to the next grid point
	*/
export function snapCeil( val, mod){
	/// remove remainder and add a grid step, unless negative value:
	return val > 0 ?
		val - val % mod + mod :
		val - val % mod
}
/**
	* snap a value on a grid to the lower value
	* @return  value decreased to the previous grid point
	*/
export function snapFloor( val, mod){
	/// remove remainder and if negative value remove a grid step
	return val > 0 ?
		val - val % mod :
		val - val % mod - mod
}
/** Only get the unique items of an array, object items are checked by equiv(). */
export function unique( arr, compare_objects = false){
	if (!compare_objects)
		return Array.from( new Set( arr))
	else {
		let out = []
		/// b/c won't be compared to a..., so dupes will be added once
		for( let i = 0; i < arr.length; i++){
			let a = arr[ i]
			let is_unique = true
			for( let j = i + 1; j < arr.length; j++){
				let b = arr[j]
				if( equiv(a, b)){
					is_unique = false
					break
				}
			}
			if( is_unique)
				out.push( a)
		}
		return out
	}
}
/**
 * check if two objects are equivalent (if all values of A are found on B)
 * @param {*} objA
 * @param {*} objB
 * @param {boolean} [only_check_common_keys=false] allow undefined keys on any
 * @param {boolean} [shallow=true]
 * @returns
 */
export function equiv( objA, objB, only_check_common_keys=false, shallow=true){
	//console.log('equiv:', objA, objB)
	if( only_check_common_keys){
		for( let k in objA){
			if( shallow && !objA.hasOwnProperty( k)) /// only_check_common_keys
				continue

			const key_exists =
				shallow && objA.hasOwnProperty( k) && objB.hasOwnProperty( k) ||
				!shallow && k in objA && k in objB
			//// if key do not exist on both, ignore
			if( key_exists && objA[ k] !== objB[ k]){
				return false
			}
		}
	}
	else {
		for( let k in objA){
			if( shallow && !objA.hasOwnProperty( k))
				continue
			//// values differ, or k could be undefined in A
			if( objA[ k] !== objB[ k])
				return false
		}
	}
	return true
}
export const tag = elem => elem.tagName.toLowerCase()


const bags = {}

export function createBag2D( name, units, tens){

	if( bags[ name]) throw 'createBag2D :: bag name already taken: ' + name

	bags[ name] = {
		list: [],
		units, 		//// static, stay as defined /// { numbers: [], chances (for those): Number }
		tens, 		//// static, stay as defined /// { numbers: [], chances (for those): Number }
		temp_units: [],
		temp_tens: []
	}
	//log('warn','bag2D created:', name)
}



/**  */
export function pickNumberInBag( bag_name){

	//log('check','pickNumberInBag:', bag_name)
	const bag = bags[ bag_name]

	if( !bag.list.length)
		fillBag( bag)

	let num = pickRandomInArray( bag.list)
	/// split num into units and tens
	let [tens,units] = num.toString().padStart(2,'0').split('')
	/// return [tens, units, num]
	return [parseInt(tens), parseInt(units), num]
}

/** refills a bag with random chances according to bag config */
function fillBag( bag){

	bag.list.length = 0

	//// preprocess, cache?
	let units_chances = 0, 	//// bag.units_chances
			tens_chances = 0		//// bag.tens_chances
	bag.units.forEach( num => { units_chances += num.chances * num.numbers.length })
	bag.tens.forEach( num => { tens_chances += num.chances * num.numbers.length })
	let total_chances = units_chances + tens_chances

	for( let {numbers, chances} of bag.units){
		chances *= numbers.length /// total chances for those numbers
		let relative_chances = Math.round( chances / units_chances * total_chances)
		for( let i=0; i<relative_chances; i++)
			bag.temp_units.push( getRandomInArray( numbers) )
	}
	for( let {numbers, chances} of bag.tens){
		chances *= numbers.length
		let relative_chances = Math.round( chances / tens_chances * total_chances)
		/// Normalize...
		const n = 100
		relative_chances = Math.round( relative_chances / total_chances * n)

		for( let i=0; i<relative_chances; i++)
			bag.temp_tens.push( getRandomInArray( numbers) * 10)
	}
	log('check', 'bag.temp_units.length:', bag.temp_units.length)
	log('check', 'bag.temp_tens.length:', bag.temp_tens.length)
	//// recombine tens and units into .list
	while( bag.temp_units.length){
		let tens = bag.temp_tens.length ? pickRandomInArray( bag.temp_tens) : 0
		bag.list.push( tens + bag.temp_units.pop() )
	}
	bag.temp_units.length = 0
	bag.temp_tens.length = 0

	bag.list.sort()
	bag.list = [...new Set( bag.list)] //// make unique
	//log('bag:', bag.list)
}

/** get one random item from an array */
export const getRandomInArray = arr => arr[ Math.floor( Math.random() * arr.length)]


/** remove one random item from an array and return it */
export const pickRandomInArray = arr => arr.splice( Math.floor( Math.random()*arr.length), 1)[0]

/** end inclusive (1,3) will be 1, 2 or 3 */
export function randomNumberFromRange( start, end, exclude=null, exclude_predicament=null){
	if( exclude!==null && !Array.isArray(exclude))
		exclude = [exclude]
	if( start === end)
		return start
	if( end < start){
		let new_start = end
		end = start
		start = new_start
	}
	let arr = range( start, end)
	if( exclude !== null)
		arr = arr.filter( n => !exclude.includes(n))
	else if( exclude_predicament)
		arr = arr.filter( n => !exclude_predicament( n))

	if( !arr.length){
		log('err', 'conditions leave empty array')
		debugger
	}

	return pickRandomInArray( arr)
}

const randomBags = {}

/** so we can store in app and continue where we left off */
export const initRandomBag = (bag_id, bag) => {
	console.warn('INIT bag_id:', bag_id, bag.length)
	randomBags[ bag_id] = bag
}

/**
 * use or create a bag identified as (optional prefix + start + end)
 * create: bag is filled with a range() of numbers
 * use: picks (remove) a number at random; when empty bag is refilled
 */
export function randomNumberFromRangeBag( start, end, prefix='', initial_random_offset=false, return_bag=false, debug=false ){
	// if( debug) log('randomFromRangeBag:', start, end)
	const bag_id = prefix + '_' + start + '_' + end // p_0_10
	// if( debug) log('check','bag_id:', bag_id)
	let bag = randomBags[ bag_id]
	// bag &&
	if( !bag && initial_random_offset){
		bag = randomBags[ bag_id] = range( start, end, false)
		let remove = randomNumberFromRange( 1, bag.length-1) /// should remain at least one
		for( let i=0; i<remove; i++)
			bag.shift()
		//log('check', 'initial bag, removed:', remove)
	}
	else if( !bag || !bag.length)
		bag = randomBags[ bag_id] = range( start, end, false)

	const index = Math.floor( Math.random() * bag.length)

	// if( debug) log('check','index:', index)
	//log('check', 'bag:', ...bag, 'picked:', bag[ index])
	const val = bag.splice( index, 1)[0]
	return return_bag ? [val,bag] : val
}
/// cols, rows = [...chances for each cols or rows]
export function getNumbersFor2DChances( cols, rows, bias=1, debug = false){
	const grid = []
	const instances = []
	let highest = 0, lowest = 1000

	cols.forEach( (chances,col) => {
		for( let i=0; i<10; i++)
			grid.push( [i*10+col, chances])
	})

	rows.forEach( (chances,row) => {
		for( let i=0; i<10; i++){
			let current = grid.find( num => num[0] === row*10+i)
			let a = current[1],
					b = chances
			let [lo,hi] = a<b ? [a,b] : [b,a]
			current[1] = lo ? lo + ((hi-lo) * bias) : 0
			if( current[1] > highest)
				highest = current[1]
			if( current[1] > 0 && current[1] < lowest)
				lowest = current[1]
		}
	})

	const has_range = lowest !== highest
	const mult = 1//(bias*10)%2 ? 10 : 5 /// nums modified by bias of .2, .4, .6, .8 only need to be mult by 5 to get integer
	for( let cell of grid){
		if( cell[1] > 0 && has_range){
			/// scale down to 1 so we don't end up with too many instances for nothing
			cell[1] = linearScaling( lowest, highest, 1, highest, cell[1])
			/// now we have precise but decimal num of chances; mult and round for imprecision
			/// so we'll have precision and integers, but a larger number of chances->instances
			cell[1] = Math.round( cell[1])
		}
	}
	grid.sort( (a,b) => a[0]-b[0])

	if( debug)
	console.log( grid.map( n => n[0]+' -> '+n[1]).join('\n'))

	for( let [num,chances] of grid)
		for( let i=0; i<chances; i++)
			instances.push( num)

	return instances
}

export function chunksOfLength( arr, n){
	return arr.reduce( (cumul, item, i) => {
		const index = Math.floor( i/n)
		if( !cumul[ index]) cumul[ index] = []
		cumul[ index].push( item)
		return cumul
	}, [])
}


export function chunksForPropValues( arr, prop, values){
	let chunks = []
	for( let item of arr){
		let val_index = values.indexOf( item[ prop])
		if( chunks[ val_index] === undefined)
			chunks[ val_index] = [item]
		else
			chunks[ val_index].push( item)
	}
	return chunks
}

export const fieldSorter = fields =>
	(a, b) => fields.map( o => {
		let dir = 1
		if( o[0] === '-'){ dir = -1; o = o.substring(1) }
		return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0
	})
	.reduce( (p,n) => p ? p : n, 0)




/**
 * find the col & row indices in a 2D Array (grid) by the index (position from top left) and the grid's number of column' (cols)
 * @param {number} index
 * @param {number} cols
 * @return {number[]} array of column and row coordinates
 */
export function getColRowByIndex( index, cols) {
	let col = index % cols
	let row = (index - index % cols) / cols
	return [col, row]
}
/*
export const loadScript = (src, async=false) => new Promise( (resolve, reject) => {
	// console.warn('Load script:', src)
	let s = document.createElement('script')
	s.onload = () => resolve( src)
	s.onerror = err => reject( err)
	s.async = async
	document.head.appendChild( s)
	s.src = src
})
export const loadScripts = urls =>  urls.forEach( url => loadScript( url))
 */