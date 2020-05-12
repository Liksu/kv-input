import './kv-input.js';

const kvInput = document.querySelector('kv-input');
window.kvInput = kvInput;

const mirror = document.getElementById('mirror');
kvInput.onchange = updateDump;

function updateDump(newData) {
    mirror.innerHTML = JSON.stringify(newData, null, 4);
    console.log('data changed to', newData);
}

updateDump(kvInput.kv);

window.toggleTypes = function() {
    kvInput.setAttribute('use-types', String(!kvInput._useTypes))
};