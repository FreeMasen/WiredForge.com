import * as wasm from './wasm';
import * as init from './wasm_bg';
init.booted.then(() => {
    getWasmResults();
});

window.addEventListener('DOMContentLoaded', () => {
    getNativeResults();
});

/**
 * Execute the tests using the downloaded wasm module
 * @param {WebAssembly.Module} mod - Run the WASM tet and update the dom
 */
function getWasmResults() {
    //this should be fine becuse it will rerun right after assignment
    if (!wasm) return; 
    let results = wasm.run_test();
    updateResults('wasm', TestResult.fromJson(JSON.parse(results)));
}
/**
 * Request the natively compiled results and update the dom
 */
function getNativeResults() {
    updateResults('native', null);
    
}
/**
 * Update the dom with a set of test results
 * @param {string} id - native or wasm
 * @param {TestResult} result - The test result object
 */
function updateResults(id, result) {
    let container = ensureListState(id);
    let refresh = document.createElement('button');
    refresh.setAttribute('class', 'refresh-button');
    if (!result) {
        refresh.setAttribute("disabled", true)
    }
    refresh.innerHTML = "Refresh";
    let title = document.createElement('h1');
    title.setAttribute('class', 'test-title');
    if (id == 'native') {
        title.appendChild(document.createTextNode(id.replace('n', 'N')));        
    } else if (id == 'wasm') {
        refresh.addEventListener('click', () => getWasmResults());
        title.appendChild(document.createTextNode(id.toUpperCase()));
    }
    container.appendChild(title);
    container.appendChild(refresh);
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
    if (!test) {
        test = {largest: "disabled", total: "disabled", end: onabort, start: 0, unit: "disabled"}
    }
    list.appendChild(generateItem(name, ''));
    list.appendChild(generateItem(`Largest serialized:`, `${test.largest}`));
    list.appendChild(generateItem(`Total serialized:`, `${test.total}`));
    list.appendChild(generateItem(`Duration:`, `${(test.end - test.start)}${test.unit}`));
    return list;
}
/**
 * Generate a <li> with a specific text inside
 * @param {string} name - First span text for the <li>
 * @param {string?} value - Second span text for the <li> (optional)
 * @returns {HTMLLIElement}
 */
function generateItem(name, value) {
    let item = document.createElement('li');
    item.setAttribute('class', 'test-entry');
    let nameSpan = document.createElement('span');
    nameSpan.setAttribute('class', 'entry-name');
    nameSpan.appendChild(document.createTextNode(name));
    item.appendChild(nameSpan);
    if (value) {
        let valueSpan = document.createElement('span');
        valueSpan.setAttribute('class', 'entry-value');
        valueSpan.appendChild(document.createTextNode(value));
        item.appendChild(valueSpan);
    }
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
