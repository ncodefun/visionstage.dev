# Vision Stage
## Minimalist, intuitive Web components, zero friction.

Vision stage is what happens when you make a Web <q>*framework*</q> placing developer experience *above everything else*…

You end up with a minimalist, ultra intuitive workflow that eliminates all the friction and frustration from Web development **(No. Build. Step. | No weird concepts | Natural Code Flow)**. You won't bang your head on the wall because you can't figure out how to make simple things; everything is pure JS+HTML, and lifecycle events are easy to follow (onConnected, onRendered, onFirstRendered, onResize, etc.). ***IT JUST WORKS!***

Surprisingly enough, the price to pay is not that much given that we have a framework that's lightweight, fast, and has the core features for modern Web development.

The one goodie that's missing here is hot module reload, but the benefits here I beleive, totally outweight this small loss…

The one thing it has over every other framework, though, is that it's totally vanilla, thus easily extendable, and future-proof!

## How is it made?

Components are extended custom elements using lit-html for dynamic templates rendering. [more on lit-html] They can have reactive properties that will trigger rendering and which may be watched, transformed (for validation), and have an associated CSS class or HTML attribute. These can also be stored locally and automatically recalled on load.

Components also can have localized strings easily accessed by using the $ prefix : this.$title, shorthand for this.string('title'). For longer texts, you can use elements with the lang attribute, and they will automatically be shown or hidden according to the current language.

There's zero system around components; there's no binding, and no limitation either. They're just elements, and if a component needs to pass data in another way than props, you just grab (query) the target element to read or set a value on it; reactive properties are setup as setters directly on the component/element, so you just write: this.x = 0 or elem.y = 0. The rendering engine takes care of what needs to be updated, but sometimes we want a component A to render based on a property on a component B; in that case we can use a utility method of components:
```js
this.uses([ [compElem|selector,propA,propB…] ])
```

There's a stage component which serves as the app container visually and logically for managing app specific / global properties and methods. The very unique particularity of this stage component is that it frames / constrain content inside user-specified aspect ratios, and virtually scales content by scaling the rem value (HTML font-size) so it continually fit the stage. This not only is superb for full-page apps, but also has the advantage of naturally adapt to small screens without or with minimal adjustments.

## Virtual pages (SPA)
You can define virtual pages to simply render a different cached template with a smooth fade in transition. These use the link anchors (#). These virtual pages have localized titles, and are linked to as follows:
```js
app.pageLink( pageName)
```
This uses <code>app.getPage( pageName)</code> to get the page object and then return a link :
```html
<a class='selected (if current)' href='${ page.path }'>${ page.title }</a>
```
Here <code>app</code> is the <code>&lt;vision-stage></code> app element; you normally will use virtual page links in the app component itself, so you will use <code>this.pageLink()</code>. Otherwize the app component/element will have to be queried.


## Server SPA behavior

Since we use client-side hash navigation (#) to navigate in our app, we don't need special server config for rewriting all paths to a single page, and that means we can use multiple different apps or real pages normally.

In addition, here, because we use Firebase hosting, we make use of its particular way to rewrite – it doesn't rewrite if the path exists – so we use rewrite like a SPA, to redirect all nonexistent paths to a single page: <code>redirect.html</code>
This file contains a script with a map of paths + regexp to catch possible misspellings or variations and redirect either to a matching path or to 404.html. Note that because of this setup, redirects with the config file won't work, we have to do all redirects within the redirect.html code.


## Let's do this!

Let's explore the making of a Todo app.




---

Todo:
- check for the virtual keyboard vs stage resizing and text inputs...