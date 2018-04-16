const js = import('./wasm.js');

js.then(getWasmResults);

window.addEventListener('DOMContentLoaded', () => {
    getNativeResults();
});

/**
 * Execute the tests using the downloaded wasm module
 * @param {WebAssembly.Module} mod - Run the WASM tet and update the dom
 */
function getWasmResults(mod) {
    let results = mod.run_test();
    updateResults('wasm', TestResult.fromJson(JSON.parse(results)));
}
/**
 * Request the natively compiled results and update the dom
 */
function getNativeResults() {
    fetch('sertest/native')
        .then(res => {
            res.json().then(res => {
                console.log('res.json', res);
                updateResults('native', TestResult.fromJson(res));
            });
        })
}
/**
 * Update the dom with a set of test results
 * @param {string} id - native or wasm
 * @param {TestResult} result - The test result object
 */
function updateResults(id, result) {
    let container = ensureListState(id);
    let title = document.createElement('h1');
    title.setAttribute('class', 'test-title');
    if (id == 'native') {
        title.appendChild(document.createTextNode(id.replace('n', 'N')));
    } else if (id == 'wasm') {
        title.appendChild(document.createTextNode(id.toUpperCase()));
    }
    container.appendChild(title);
    container.appendChild(generateList('Bincode', result.bin));
    container.appendChild(generateList('RMP', result.rmp));
}
/**
 * Generate a <ul> from a list of test results
 * @param {string} name - bin or rmp
 * @param {Test} test - The test to be inserted
 * @returns {HTMLUListElement}
 */
function generateList(name, test) {
    let list = document.createElement('ul');
    list.setAttribute('id', name.toLowerCase());
    list.appendChild(generateItem(name));
    list.appendChild(generateItem(`Largest serialized: ${test.largest}`));
    list.appendChild(generateItem(`Total serialized: ${test.total}`));
    list.appendChild(generateItem(`Duration: ${(test.end - test.start).toFixed(4)}${test.unit}`));
    return list;
}
/**
 * Generate a <li> with a specific text inside
 * @param {string} text - Inner text for the <li>
 * @returns {HTMLLIElement}
 */
function generateItem(text) {
    let item = document.createElement('li');
    item.setAttribute('class', 'test-entry');
    let inner = document.createTextNode(text);
    item.appendChild(inner);
    return item;
}
/**
 * Ensure the container exsists and that it is free of any children
 * @param {string} id - The id attribute of the div container for the lists
 */
function ensureListState(id) {
    let list = document.getElementById(id);
    if (!list) {
        list = document.createElement('div');
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
/**
 * @constructor
 * An object representing the complete test results
 * @param {Test} rmp - The rmp_serde results
 * @param {Test} bin - The bincode results
 */
function TestResult(rmp, bin) {
    this.rmp = rmp;
    this.bin = bin
}
/**
 * Convert a raw object into a TestResult
 * @param {any} json - the raw object
 * @returns {TestResult}
 */
TestResult.fromJson = function(json) {
    return new TestResult(
        Test.fromJson(json.rmp),
        Test.fromJson(json.bin),
    )
}

/**
 * @constructor
 * A single serialization test
 * @param {number} start - The start timestamp
 * @param {number} end - The end timestamp
 * @param {string} unit - The unit of time in the timestamp
 * @param {number} largest - The number of bytes of the largest serialized item
 * @param {number} total - The total number of bytes serialized
 */
function Test(start, end, unit, largest, total) {
    this.start = start;
    this.end = end;
    this.unit = unit;
    this.largest = largest;
    this.total = total;
}
/**
 * Create a new Test from a raw object
 * @param {any} json - The raw object to be converted
 * @returns {Test}
 */
Test.fromJson = function(json) {
    return new Test(
        json.start_timestamp,
        json.end_timestamp,
        json.time_unit,
        json.largest,
        json.total_size
    )
}