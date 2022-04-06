
const targets = Array.from(document.querySelectorAll(".color-targe")) as SVGPathElement[];
const input  = document.getElementById("color-selection") as HTMLInputElement;

input.addEventListener("change", event => {
    if (input.value && input.value.length > 0) {
        let matches = /^#?([a-zA-Z0-9]{3}|[a-zA-Z0-9]{6})$/.exec(input.value)
        let color;
        if (matches) {
            color = `#${matches[1]}`;
        } else {
            color = input.value;
        }
        for (let target of targets) {
            (target as any).fill = color;
        }
    }
});

