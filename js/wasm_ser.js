const js = import('./wasm.js');

js.then(getWasmResults);

window.addEventListener('DOMContentLoaded', () => {
    getNativeResults();
});

function getWasmResults(mod) {
    updateWasm('Module downloaded, waiting for computation');
    let results = js.run_test();
    updateResults('wasm', ...results.split('\n,'));
}

function getNativeResults() {
    fetch('sertest/native')
        .then(res => {
            res.json().then(arr => {
                updateResults('native', ...arr);
            });
        })
}

function updateResults(id, ...entries) {
    let list = ensureListState(id);
    for (let entry of entries) {
        let li = document.createElement('li');
        let text = document.createTextNode(entry);
        li.appendChild(text);
        list.appendChild(li);
    }

}

function ensureListState(id) {
    let list = document.getElementById(id);
    if (!list) {
        list = document.createElement('ul');
        list.setAttribute('id', id);
        document.body.appendChild(list);
    }
    while (list.hasChildNodes()) {
        let child = list.lastChild;
        if (!child) break;
        list.removeChild(child);
    }
    return list;
}