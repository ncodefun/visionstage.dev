# Vision Stage – More…

## SVG Icons


## Array properties


## &lt;vs-selector>
One super component which encapsulate all types of selectors:
- checkbox | switch | colored/uncolored button
- options list, multi? choice or not, foldable? or not (tabs, state stepper(s) button)

Check the demo [here](/demos/vs-selector) and play with the night modes and dark theme to see all the possibilities…

### To document:
- storable string value for shared properties
	- For vision-stage props* (common to all apps) simple use storable:'/'
	- *maybe extract props as separate config file and load?
	- otherwise, use a common value between different apps to share between: storable:'user-email'



- App.sounds + setupSounds, playSound(name), stopSound()<br>
	<small>Basic sound playback (individual sounds volume is set on the global channel upon playback, so overlapping sounds of different volume will change volume suddenly…)</small>
- props → getter() => for props representing a - computed / composed value
- this.init_watcher==='onRendered' | 'deferred'
- this.setState for directly setting state without reactivity or rendering
- this.uses to declare usage of another component's property and render when it changes
- this.block_watcher might be useful for complex logic flow
- this.bypass_transformer might be useful for complex logic flow
- document latest version of &lt;vs-selector> &lt;vs-modal>
- service worker - serve from cache, update cache from network, notify if new sw.js  (clients will have the latest app version after a refresh anyway - but if never refreshes, there's 30 min check, then will need two refreshes)
- pages can also serve as localized links to real pages
- params can be used to persist values through page refresh but no more

- beforeRender  => doRender? true: false (abort)
- beforeFirstRender