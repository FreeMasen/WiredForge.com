import Text from '/js/services/text.js';
export default class Color {

    constructor(
        red,
        green,
        blue,
        alpha,
    ) {
        this.red = red || 0
        this.green = green || 0
        this.blue = blue || 0
        this.alpha = alpha
    }

    static fromHex(hex) {
        if (hex[0] === '#') {
            hex = hex.substr(1);
        }
        if (hex.length < 6) {
            if (hex == '000') {
                return new Color()
            }
            if (hex == 'fff') {
                return new Color(255, 255, 255);
            }
            return console.error('Unable to parse hex string less than 6 chars');
        }
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);
        return new Color(r, g, b);
    }

    static random() {
        let r = Math.floor(Math.random() * 256)
        let g = Math.floor(Math.random() * 256)
        let b = Math.floor(Math.random() * 256)
        let a = Math.random();
        return new Color(r, g, b, a);
    }

    toHex() {
        let r = Text.twoDigit(this.red.toString(16));
        let g = Text.twoDigit(this.green.toString(16));
        let b = Text.twoDigit(this.blue.toString(16));
        return `#${r}${g}${b}`;
    }

    toRgb() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    toRgbA() {
        let a = this.alpha || 1;
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${a})`
    }
}
