import './kv-input.js';

const simpleData = {"NotEmpty":"some text","Null":null,"Array":["foo","bar",true,42],"BoolTrue":true,"BoolFalse":false,"Number":42};
const keysData = {Array: 'foo', NotEmpty: 'some text'};

// get KVInput instance
const kvInput = document.querySelector('kv-input');
window.kvInput = kvInput; // for debug and investigate

// collect elements from page

const elements = window.elements = {};
document.querySelectorAll('[id]').forEach(element => {
    elements[element.id] = element;
});

const debounceSpan = elements.debounce.nextElementSibling;

// some callbacks for demo page

window.updateDebounce = function(input) {
    debounceSpan.innerHTML = input.value;
    elements.debounceValue.innerText = input.value;
    kvInput.setAttribute('debounce', input.value);
};
window.updateDebounce(elements.debounce);

window.toggleTypes = function() {
    kvInput.setAttribute('use-types', String(!kvInput._useTypes));
    elements.useTypesValue.innerText = String(kvInput._useTypes);
};

window.clearKV = function() {
    kvInput.kv = null;
};

window.toggleKeys = function () {
    if (kvInput.keys) {
        kvInput.keys = null;
        kvInput.kv = simpleData;
    } else {
        kvInput.kv = keysData;
        kvInput.keys = ['test', 'Array', 'NotEmpty'];
    }
};

// add listeners for titles change and init them

[elements.titleInput, elements.keyTitleInput, elements.valueTitleInput].forEach(input => {
    input.addEventListener('change', () => {
        kvInput.setAttribute(input.alt, input.value);
        elements[input.placeholder].innerText = input.value;
    });

    kvInput.setAttribute(input.alt, input.value);
    elements[input.placeholder].innerText = input.value;
});

// set meta

kvInput.meta = {
    test: 'a b c d'.split(' ')
};

// subscribe to changes from kv-input

function updateDump(newData) {
    console.log('data changed to', newData);
    elements.mirror.innerHTML = stringify(newData, null, 4);

    const meta = kvInput.meta;
    if (Object.keys(meta).length) {
        const metaString = stringify(meta, null, 0);
        elements.metaValue.innerHTML = metaString.replace(/^.*?{\n?/, '').replace(/\n?}.*?$/sm, '');
        elements.metaValue.style.display = 'inline-block';
        elements.metaBlock.style.display = 'inline';
    } else {
        elements.metaBlock.style.display = 'none';
    }
}
kvInput.onchange = updateDump;
updateDump(kvInput.kv);

// my own stringify to make example more compact
function stringify(obj, replacer = null, space = 4) {
    const defaultReplacer = (k, v) => JSON.stringify(v);

    if (!replacer || !(typeof replacer == 'function')) replacer = defaultReplacer;
    if (typeof space == 'number') space = ' '.repeat(space);

    const pairs = Object.entries(obj).map(([k, v]) => {
        return `${space}"${k}": ` + replacer(k, v);
    });

    return `{\n${pairs.join(',\n')}\n}`;
}