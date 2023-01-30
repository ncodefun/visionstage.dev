lit-html is using a very  simple and intuitive syntax for bindings:
- Text:
	```jsx
	<div>hello ${ name }</div>
	```
- Attribute values:
	```jsx
	<div data-theme=${ this.theme }>hello ${ name }</div>
	```
- Props:
	```jsx
	<my-comp .active=${ this.use_my_comp }>
	```
- Events: <br>
	```jsx
	<button @click=${ e => console.log('clicked') }>
	```
	or
	```jsx
	<button @click=${ this.onClickHandler }>
	```
	In any case, the `this` inside the callback is bound / refers to the component.

	Tip: when we add event listeners to the body or document, we can just refer to a bound copy of the handler like so:
	```js
	document.addEventListener('mousemove', this.onMouseMove.bind(this))
	```

- Conditional attributes:
	```jsx
	<input ?checked=${ this.is_dark }>
	```

Find the official docs on lit-html [here ](https://lit.dev/docs/v1/lit-html/template-reference/).