import Text from '../services/text';
export default class Color {

    constructor(
        public red: number = 0,
        public green: number = 0,
        public blue: number = 0,
        public alpha?: number,
    ) {}

    static fromHex(hex: string) {
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

    toHex(): string {
        let r = Text.twoDigit(this.red.toString(16));
        let g = Text.twoDigit(this.green.toString(16));
        let b = Text.twoDigit(this.blue.toString(16));
        return `#${r}${g}${b}`;
    }

    toRgb(): string {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    toRgbA(): string {
        let a = this.alpha || 1;
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${a})`
    }
}

