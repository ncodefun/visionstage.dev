# Vision Stage – More…

## SVG Icons


## Array properties


## &lt;vs-selector>
One super component which encapsulate all types of selectors:
- checkbox | switch | colored/uncolored button
- options list, multi? choice or not, foldable? or not (tabs, state stepper(s) button)

Check the demo [here](/test-vs-selector) and play with the night modes and dark theme to see all the possibilities…

### To document:

- beforeRender  => doRender? true: false (abort)
- beforeFirstRender

- App.sounds + setupSounds, playSound(name), stopSound()<br>
	<small>Basic sound playback (individual sounds volume is set on the global channel upon playback, so overlapping sounds of different volume will change volume suddenly…)</small>
- props → getter() => for props representing a - computed / composed value
- this.init_watcher==='onRendered' | 'deferred'
- this.setState
- this.uses
- this.block_watcher
- this.bypass_transformer
- document latest version of &lt;vs-selector>
- service worker