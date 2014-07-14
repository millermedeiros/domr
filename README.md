# domr

Update DOM element content/attributes asynchronously.

Heavily inspired by [Ampersand.js DOM
bindings](http://ampersandjs.com/docs#ampersand-dom-bindings) but without
needing inheritance and wrapping your data into `Models/State` objects.

 > "inheritance is the root of all evil" - Albert Einstein :P

**Important:** I will only test on modern browsers, use at your own risk.


## Why?

Couldn't find anything that was *fast* on a slow mobile device and worked the
way I wanted, so let's reinvent the wheel. See [this twitter thread for more
details](https://twitter.com/millermedeiros/status/487358358069194753).

I know there are hundreds of JS frameworks out there and that data binding is
*the coolest thing since sliced bread*, but this will probably work better for
my use case (low memory, slow cpu, few updates and usually async - usually in
batches).

This approach allows you to write the markup and build the DOM any way you want
(eg. web components, any template language or just plain HTML).


## Example

given this HTML fragment:

```html
<section id="foo">
  <h1></h1>
  <img />
  <p role="caption"></p>
</section>
```

You can update it with:

```js
var domr = require('domr');
var el = document.getElementById('#foo');

// this will create a mapping between properties and elements/actions
var foo = domr.create(el, {
  'doge.title': 'h1',
  'doge.image': {
    selector: 'img',
    type: 'attr',
    name: 'src'
  },
  'doge.description': {
    role: 'caption'
  },
  isWarning: {
    // "@" matches the root element itself
    selector: '@',
    type: 'toggleClass',
    name: 'is-warning'
  }
});

// this will update the DOM asynchronously
foo.render({
  isWarning: true,
  doge: {
    title: 'Wow, Such Awesome',
    image: 'doge.jpg',
    description: 'wow. much javascript. such ipsum',
  }
}, onRenderComplete);


// called after data is updated (on next animation frame)
function onRenderComplete(element) {
  console.log('rendered the element #'+ element.id);
}
```

The document will be updated on the next `requestAnimationFrame`, becoming:

```html
<section id="foo" class="is-warning">
  <h1>Wow, Such Awesome</h1>
  <img src="doge.jpg" />
  <p role="caption">wow. much javascript. such ipsum</p>
</section>
```

If you call `render` multiple times in a row with different data, it should
only update the DOM once. DOM manipulation is batched and throttled, and always
happens on a `requestAnimationFrame`.

Subsequent calls to `render` should be *faster* since we cache references to
all the needed elements on the first call. We also check which data changed
since last *render* and only update the affected elements/attributes.

When you don't need the binding anymore you can call `destroy` to remove any
references to elements and cached data (not needed on most cases tho).

```js
// remove internal cache and references to elements
foo.destroy();
```


## Tips

This lib is not only about *raw* performance, a great benefit is that you can
keep calling `render` even if the data did not change and it is smart enough to
only update the affected elements. This simplifies the development process and
reduces the amount of conditionals in the codebase.

It's similar to the way [React](http://facebook.github.io/react/) works, in the
sense that we always *render* but only it's smart enough to only update the DOM
when needed. The main difference is that we don't have a virtual DOM and we
also don't handle how the *state/data* is passed into the *views* (meaning that
we save thousands of lines of code on the library side but you *might* need to
implement more logic yourself).


## Binding types

Bindings treats `undefined`, `null`, and `NaN` as `''` (empty string).


### text

Sets `textContent` of selected element.

```js
'model.key': {
    type: 'text',
    selector: '.someSelector' // or role
}
```

### class

Sets class as string that matches value of property. It can handle multiple
classes (single string separated by spaces) and will also remove previous class
if value is updated.

```js
'model.key': {
    type: 'class',
    selector: '.someSelector' // or role
}
```

### attribute / attr

Sets the whole attribute to match value of property.

```js
'model.key': {
    type: 'attribute', // or "attr"
    selector: '#something', // or role
    name: 'width'
}
```

### toggleClass

Add/removes class based on boolean interpretation of property name.

```js
'model.active': {
    type: 'toggleClass',
    selector: '#something', // or role
    // to specify name of class to toggle (if different than key name)
    // you could either specify a name
    name: 'active'
    // or a yes/no case
    yes: 'active',
    no: 'not-active'
}
```

### toggleAttribute / toggleAttr

Toggles whole attribute on the element (think `checked`) based on boolean interpretation of property name.

```js
'model.isAwesome': {
    type: 'toggleAttribute', // or "toggleAttr"
    selector: '#something', // or role
    name: 'checked'
}
```

### html

Renders `innerHTML` based on property value.

PS: this won't escape any HTML entities and can be used as an attack vector
([XSS](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29)), favor
the `text` type as much as possible.

```js
'model.key': {
    type: 'html',
    selector: '#something' // or role
}
```

## Handling multiple bindings for a given key

If given an array, then treat each contained item as separate binding

```js
'key': [
    {
        type: 'toggleClass',
        selector: '#something', // or role
        name: 'active' // (optional) name of class to toggle if different than key name
    },
    {
        type: 'attr',
        selector: '#something', // or role
        name: 'width'
    }
]
```

## Install

Modules are [converted to node.js
format](http://github.com/millermedeiros/nodefy) during npm publish in case you
want to use it with browserify.

```
npm install domr
```

or you can use the something like [volo](http://volojs.org/) to download the
AMD source files. (or just use the files inside `src`)

```
volo add millermedeiros/domr#src domr
```


## License

Released under the MIT license.

