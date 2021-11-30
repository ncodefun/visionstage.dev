// parse strings describing data structure like this one:
const str = "value:array::{ title:string, dark:boolean, o:{ num:number, tot:number }}, stored:boolean, watcher:text::function"
// and return this object:
function parseTopList( str){ // resolve the top layer only, iterate for nested items
	const chars = str.split('')
	const segments = [] // top level segments
	let i=0, open=0, segment=[] // current segment
	for( let c of chars){
		if( c==='{') ++open
		else if( c==='}') --open
		// at top leel comma (,) or at string end :
		// dump segment into segs
		if( i++===chars.length-1){
			segment.push( c)
			segments.push( segment.join('').trim())
			segment.length = 0
		}
		else if( c===',' && open===0){
			// no need to push comma
			segments.push( segment.join('').trim())
			segment.length = 0
		}
		else
			segment.push( c)
	}
	return segments
}

function parseValue( str=''){ // val || name:type::(subtype||list)
	return str.includes(':') ? str.split(/:+/g) : str
	let val = str.split(':')
}

function parseVals(){
	let segs = parseTopList( str)
	for( let s of segs){
		let val = parseValue( s)
		console.log( val)
		return val.includes(':') ? val.split(/:+/g) : val
	}
}
console.log('parseVals:', parseVals())
