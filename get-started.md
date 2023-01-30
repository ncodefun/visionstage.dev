# Get started with Vision Stage

## Overview of the project files

This cannot be more straightforward:

- <code>public/vision-stage/</code> contains the framework and css files;

- <code>public/root/</code> contains the top-level Web app or Website (if you have configured a rewrite), or just put files directly in the <code>public</code> folder;

- <code>public/another-app</code> Use any other folder for each page you want.

- <code>public/_components/</code> contains components to be shared, otherwise you put them directly in the app folder;

- <code>public/_assets/...</code> contains assets like images and fonts.

- Each app folder contains a standard <code>index.html</code> file along with a <code>app.js</code> and <code>app.css</code> files for our app component.

- Each component has an eponyme stylesheet companion, and both files are loaded automatically as required in the <code>define(tagname,class,[components paths])</code> function. They are referred without extension with either a relative path (./), an absolute path (/) or without prefix at all if they are in the <code>_components</code> folder.
<code></code>
---
## Structure of components and the app component

- imports

- class definition
	- lifecycle hooks
		- <code>onConnected()</code><br>
		Typically you will do setup here (take care that you call it only once, if not already done; this callback may be called more than once), and call <code>this.render()</code>, which is not called automatically to prevent rendering before we had a chance to setup and aquired data if necessary.
		- <code>onRendered()</code>, <code>onFirstRendered()</code>
		- <code>onResized()</code>
		- <code>onPageChanged()</code>

	- template(s)<br>
		template() is called upon render and must return a lit-html template (<code>=> html\`&lt;div>&lt;/div>\`</code>); when we have multiple virtual pages, we can split each template with different methods and cache them in the main template() like so by naming template methods like their corresponding page name (here we set a default 'home' when no page / top level):
		```html
		<header>App header</header>
		${ cache( this[(this.page||'home')]() ) }

		```
	- custom methods

- Class static properties
	- languages <sup>*(app only)*</sup>
	- pages <sup>*(app only)*</sup>
	- aspects <sup>*(app only)*</sup>
	- strings <small><code>{ name:[strA, strB…] , }</code></small>
		<br>→ *follows the <code>languages</code> order*
	- properties <small><code>{ name:{…} , }</code></small>
		- value
		- watcher( val) <small>// watch for prop changes</small>
		- transformer( val) => val <small>// opportunity to validate and maybe return a changed value before it's set.</small>
		- init_watcher :bool <small>// if the watcher should run when the component is initialized. will be called in the order of the property relative to others.</small>
		- class :string <small>// set/unset a class on the element; **to use with a boolean property**</small>
		- attribute :string|Array  ([name,'bool|auto']) <small>// can set an attribute of specified name with the value of a string property, we may set/unset a bool attribute with the format [name,'bool'] or we may use 'auto' to set to string value if exist and remove the attribute if value is falsy.</small>

- Lastly, define / register the component as a custom element:<br>
	<code>define( tagname, class, [components paths]?)</code>

Next: [Utils – insert svg icons, array props methods](utils.md)