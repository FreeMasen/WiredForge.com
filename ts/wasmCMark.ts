let wasm;
import('wasm_cmark_parse').then(w => {
    wasm = w;
    ready();
}).catch(console.error);

function parseMD(md) {
    return wasm.parse_markdown(md);
}

let debounce;
function ready() {
    renderMD();
    let input = getInput();
    if (!input) throw new Error('Unable to find MD input');
    input.addEventListener('keyup', () => {
        if (!debounce) {
            debounce = setTimeout(renderMD, 2000);
        } else {
            clearTimeout(debounce);
            debounce = setTimeout(renderMD, 2000);
        }
    });
}
function renderMD() {
    debounce = null;
    let input = getInput();
    if (!input) throw new Error('Unable to find MD input');
    let md = input.value;
    let html = parseMD(md);
    let target = getHTML();
    if (!target) throw new Error('Unable to find div to render HTML');
    target.innerHTML = html;
}

function getInput(): HTMLInputElement {
    return document.getElementById('md-input-box') as HTMLInputElement;
}

function getHTML() {
    return document.getElementById('rendered');
}