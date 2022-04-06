
// const targets = Array.from(document.querySelectorAll(".color-targe")) as SVGPathElement[];
const input  = document.getElementById("color-selection") as HTMLInputElement;
const colors = {
    "red": true,

}

let lwl;
let targets;
let to = null;
input.addEventListener("change", event => {
    if (to) {
        clearTimeout(to);
        to = null
    }
    updateColor();
});

input.addEventListener("input", event => {
    if (to) {
        clearTimeout(to);
        to = null
    }
    to = setTimeout(() => {
        updateColor()
    }, 1000);
});

function updateColor() {
    if (!lwl) {
        lwl = (document.getElementById("ladies-who-lift") as HTMLObjectElement).contentDocument;
        if (!lwl) return;
    }
    if (!targets || targets.length == 0) {
        targets = Array.from(lwl.querySelectorAll(".color-target"));
        if (!targets) return
    }
    console.log("targets", targets);
    if (input.value && input.value.length > 0) {
        console.log("setting color to", input.value);
        for (let target of targets) {
            (target as SVGPathElement).setAttribute("fill", input.value);
        }
    }
}

updateColor();

