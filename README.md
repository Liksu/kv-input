# kv-input
Simple key-value editor web-component.

[Demo page](https://liksu.github.io/kv-input/)

## Quick start

### Install

```shell script
npm install --save kv-input
```

### Add HTML and JavaScript

Use component tag:

```html
<kv-input></kv-input>
```

Include component library into your project:

```js
import '/node_modules/kv-input/kv-input.js';
```

And subscribe to changes:

```js
kvInput = document.querySelector('kv-input');
kvInput.onchange = (resultObject) => {
    console.log(resultObject);
} 
```

That's it :)

## Tag attributes

* **title** - allows to set title for whole component, empty by default
* **key-title** - title for key-column, empty by default
* **value-title** - title for value-column, empty by default
* **debounce** - time in milliseconds before the component will handle a change, 300ms by default
* **use-types** - use checkboxes instead of boolean values and restore types into returned object (otherwise values will be returned as strings), true by default.

Also, it is possible to pass initial data inside of component tag:

```html
<kv-input>{"Put here": "JSON", "It will be parsed": "via JSON.parse"}</kv-input>
```

## Interaction

The `kv` property allows to set data into component, or to read modified object.

```js
// set data
kvInput.kv = plainObject;

// read data
plainObject = kvInput.kv;
```

## Browsers compatibility

Not right now, sorry.

Tested in latest Chrome. 
