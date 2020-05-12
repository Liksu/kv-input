import './kv-input.js';

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
window.toggleTypes();

// add listeners for titles change and init them

[elements.titleInput, elements.keyTitleInput, elements.valueTitleInput].forEach(input => {
    input.addEventListener('change', () => {
        kvInput.setAttribute(input.alt, input.value);
        elements[input.placeholder].innerText = input.value;
    });

    kvInput.setAttribute(input.alt, input.value);
    elements[input.placeholder].innerText = input.value;
});


// subscribe to changes from kv-input

function updateDump(newData) {
    elements.mirror.innerHTML = JSON.stringify(newData, null, 4);
    console.log('data changed to', newData);
}
kvInput.onchange = updateDump;
updateDump(kvInput.kv);