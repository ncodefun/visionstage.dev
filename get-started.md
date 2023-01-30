# Get started with Vision Stage

## Overview of the project files

This cannot be more straightforward:

- `public/vision-stage/` contains the framework and css files;

- `public/root/` contains the top-level Web app or Website (if you have configured a rewrite), or just put files directly in the `public` folder;

- `public/another-app` Use any other folder for each additional page or app you want.

- `public/_components/` contains components to be shared, otherwise you put them directly in the app folder;

- `public/_assets/...` contains assets like images and fonts.

- Each app folder contains a standard `index.html` file along with a `app.js` and `app.css` files for our app component.

- Each component has an eponyme stylesheet companion, and both files are loaded automatically as required in the `define(tagname,class,[components paths])` function. They are referred without extension with either a relative path (./), an absolute path (/) or without prefix at all if they are in the `_components` folder.
``
---
## Structure of components and the app component

- imports<br>
	For an app:
	```js
	import { VisionStage, html, cache, define, icon }
		from '/vision-stage/vision-stage.min.js'
	```
	For a component:
	```js
	import { Component, html, define, icon }
		from '/vision-stage/vision-stage.min.js'
	```
	With optional utils:
	```js
	import { sleep, strIf, cycleWithin }
		from '/vision-stage/utils.js'
	```

- class definition<br>
	```js
	class App extends VisionStage {
		…
	}
	```
	- lifecycle hooks
		```js
		onConnected(){
			// if (!this.setup_done) …
			this.render()
		}
		```
		Typically you will do setup here (take care that you call it only once, if not already done; this callback may be called more than once), and call `this.render()`, which is not called automatically to prevent rendering before we had a chance to setup, reading props or attributes and fetch data if necessary.

		Other self-explanatory hooks:

		- `onRendered()`
		- `onFirstRendered()`
		- `onResized()`
		- `onPageChanged()`


	- Template(s)<br>
		The `template()` method is called upon render and must return a lit-html *tagged template string literal* (<code>=> html\`&lt;div>…&lt;/div>\`</code>); when we have multiple virtual pages, we can split each page template with different methods and run them (cached for reuse without recreating them every time we switch page) in the main template(). We just have to name each template method like their corresponding page name (here we set a default 'home' when no page / top level):
		```html
		<header>App header</header>
		${ cache( this[(this.page||'home')]() ) }
		```
		[more on lit-html](lit-html.md)
	- Custom methods<br>
		Most app logic which needs to access the app state is set here as methods that can access `this`

- Class static properties
	- languages <sup>*(app only)*</sup>
	- pages <sup>*(app only)*</sup>
	- aspects <sup>*(app only)*</sup>
	- strings <small>`{ name:[strA, strB…] , }`</small>
		<br>→ *follows the `languages` order*
	- properties <small>`{ name:{…} , }`</small>
		- value
		- watcher( val) <small>// watch for prop changes</small>
		- transformer( val) => val <small>// opportunity to validate and maybe return a changed value before it's set.</small>
		- init_watcher :bool <small>// if the watcher should run when the component is initialized. will be called in the order of the property relative to others.</small>
		- class :string <small>// set/unset a class on the element; **to use with a boolean property**</small>
		- attribute :string|Array  ([name,'bool|auto']) <small>// can set an attribute of specified name with the value of a string property, we may set/unset a bool attribute with the format [name,'bool'] or we may use 'auto' to set to string value if exist and remove the attribute if value is falsy.</small>

- Lastly, define / register the component as a custom element:<br>
	`define( tagname, class, [components paths]?)`

Next: [Utils – insert svg icons, array props methods](utils.md)