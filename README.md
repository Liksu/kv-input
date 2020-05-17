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

The second way is to use names slots:

```html
<kv-input>
    <style>.title {color: navy}</style>
    <p slot="json">{"init":"value"}</p>
    <p slot="meta">{"init":["key","value"]}</p>
</kv-input>
```

There are four possible slots right now:
* **json** - json to set key-values
* **meta** - json to set meta-data
* **style** or tag `<style>` -  allows you to pass custom styles into the component, see [Styling](#styling) section.

Note, that all `<style>` tags from inside of the component will be removed.

Note, that it is possible to process only one value per slot name, so you are not able to set several styles, or several meta-data. 

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

or as named slot:

```html
<kv-input>
    <p slot="meta">{"JSON":["will","be","parsed"]}</p>
</kv-input>
```

There is one allowed behaviour: for pair where value drawn as dropdown, user are able to change the key name,
and the dropdown will be saved to keep ability to change the value.
But when re-render will be triggered (for example on `use-types` change, setting new `meta` or new `kv`) -
the dropdown will be rendered as plain input, because there are no according meta for new key name. 

### HotKeys

`Ctrl+Y` deletes the pair.

`Ctrl+Click` on checkbox or dropdown transform them into text-input.

`Ctrl+Alt+D` duplicates the pair.

## Styling

You can pass styles inside to the component.
Here is the sample structure of component:

```
+-------------------------------------------------------------------------+
| h3.title.main-title                                                     |
+-----------------------------------+-------------------------------------+
| span.title.column-title.key-title | span.title.column-title.value-title |
+-----------------------------------+-------------------------------------+
| input.key.input                   | input.value.input                   |
+-----------------------------------+-------------------------------------+
| input.key.input.invalid           | input[type=checkbox].value.input    |
+-----------------------------------+-------------------------------------+
| input.key.input                   | select.value.input                  |
+-----------------------------------+-------------------------------------+
```

And you can use this classes to customize the view:

| Selector | Description |
| --- | --- |
| `.title` | All three titles |
| `.main-title` or `h3` | Main title, passed by `title` attribute |
| `.column-title` or `span` | Two column header titles |
| `.key-title` | Title for key-column, passed by `key-title` attribute |
| `.value-title` | Title for value-column, passed by `value-title` attribute |
| `.input` | All inputs |
| `.key` | Inputs in key-column |
| `.value` | Inputs in value-column |
| `.invalid` | Duplicated keys |


## Browsers compatibility

Not right now, sorry.

Tested in latest Chrome. 
