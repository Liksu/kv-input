# kv-input
The simple key-value editor web-component.

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
const kvInput = document.querySelector('kv-input');
kvInput.onchange = (resultObject) => {
    console.log(resultObject);
} 
```

That's it :)

## Tag attributes

* **title** - allows to set a title for whole component, empty by default
* **key-title** - a title for key-column, empty by default
* **value-title** - a title for value-column, empty by default
* **debounce** - time in milliseconds before the component will handle a change, 300ms by default
* **use-types** - use checkboxes instead of the boolean values and restore types into returned object (otherwise values will be returned as strings), true by default.
* **meta** - json to define a dropdown content

Also, it is possible to pass initial data inside of the component tag:

```html
<kv-input>{"Put here": "JSON", "It will be parsed": "via JSON.parse"}</kv-input>
```

## Interaction

The `kv` property allows to set the data into component, or to read the modified object.

```js
// set data
kvInput.kv = plainObject;

// read data
plainObject = kvInput.kv;
```

Also, it is possible to set some meta-information to make dropdown for defined keys like this:

```js
kvInput.meta = {test: ['some', 'selectable', 'values']};
```

or like this:

```html
<kv-input meta='{"JSON":["will","be","parsed"]}'></kv-input>
```

There is one allowed behaviour: for pair where value drawn as dropdown, user are able to change the key name,
and the dropdown will be saved to keep ability to change the value.
But when re-render will be triggered (for example on `use-types` change, setting new `meta` or new `kv`) -
the dropdown will be rendered as plain input, because there are no according meta for new key name. 

### HotKeys

`Ctrl+Y` deletes the pair.

`Ctrl+Click` on checkbox or dropdown transform them into text-input.

## Browsers compatibility

Not right now, sorry.

Tested in latest Chrome. 
