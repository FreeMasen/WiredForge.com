import HTMLHelper from './HtmlHelper';
import Converter from './services/convert';
let andOr;
window.addEventListener('DOMContentLoaded', () => {
    andOr = new AndOr();
});

class AndOr {
    public leftBits = [0,0,0,0,0,0,0,0];
    public rightBits = [0,0,0,0,0,0,0,0];
    private operation = BinaryOperation.And;
    constructor(
        public lhs: number = 0,
        public rhs: number = 0
    ) {
        this.registerEvents();
        this.updateBits();
        this.updateButtons();
        this.updateTotal();
    }

    registerEvents() {
        let inputs = document.querySelectorAll('#andor-wrapper > .values > .inputs > .input-group > .user-input');
        for (var i = 0; i < inputs.length; i++) {
            let input = inputs[i] as HTMLInputElement;
            input.addEventListener('change', ev => this.inputChanged())
        }
        let buttons = document.querySelectorAll('#andor-wrapper > .adjustments > .buttons > .button')
        for (var i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            button.addEventListener('click', ev => this.buttonClicked(ev))
        }
    }

    inputChanged() {
        let lhs = document.querySelector('#andor-wrapper > .values > .inputs > .input-group > #left-bits') as HTMLInputElement;
        let leftValue = parseInt(lhs.value);
        let rhs = document.querySelector('#andor-wrapper > .values > .inputs > .input-group > #right-bits') as HTMLInputElement;
        let rightValue = parseInt(rhs.value);
        this.lhs = leftValue;
        this.leftBits = this.getBits(leftValue);
        this.rhs = rightValue;
        this.rightBits = this.getBits(rightValue);
        this.updateBits();
        this.updateTotal();
    }

    getBits(value: number) {
        return Converter.to_bits(value);
    }

    updateBits() {
        let bytes = document.querySelector('#andor-wrapper > .values > .representation') as HTMLElement;
        HTMLHelper.clearChildren(bytes);
        let leftSpan = document.createElement('span');
        leftSpan.setAttribute('id', 'big-bits');
        let leftText = document.createTextNode(this.byteString(this.leftBits));
        leftSpan.appendChild(leftText);

        let rightSpan = document.createElement('span');
        rightSpan.setAttribute('id', 'little-bits');
        let rightText = document.createTextNode(this.byteString(this.rightBits));
        rightSpan.appendChild(rightText);

        bytes.appendChild(leftSpan);
        bytes.appendChild(rightSpan);
    }

    byteString(bits: Array<number>): string {
        return Converter.to_string(bits);
    }

    buttonClicked(ev) {
        let button = ev.currentTarget as HTMLButtonElement;
        this.operation = button.getAttribute('operation') as BinaryOperation;
        this.updateTotal();
        this.updateButtons();
    }

    updateButtons() {
        let buttons = document.querySelectorAll('#andor-wrapper > .adjustments > .buttons > .button');
        for (var i = 0; i < buttons.length; i++) {
            let button = buttons[i] as HTMLButtonElement;
            let buttonOperation = button.getAttribute('operation') as BinaryOperation;
            if (buttonOperation == this.operation) {
                HTMLHelper.ensureClass(button, 'selected')
            } else {
                HTMLHelper.removeClass(button, 'selected');
            }
        }
    }

    updateTotal() {
        let value: number = 0;
        let operation = `${this.lhs} `;
        if (this.operation == BinaryOperation.And) {
            value = this.lhs & this.rhs;
            operation += '&';
            operation += ` ${this.rhs} = ${value}`;
        } else if (this.operation == BinaryOperation.Or) {
            value = this.lhs | this.rhs;
            operation += '|';
            operation += ` ${this.rhs} = ${value}`;
        } else {
            operation = '0';
        }

        let span = document.createElement('span') as HTMLSpanElement;
        span.setAttribute('class', 'total-value');
        let totalText = document.createTextNode(`${operation}`);
        span.appendChild(totalText);

        let binarySpan = document.createElement('span') as HTMLSpanElement;
        binarySpan.setAttribute('class', 'binary-total');
        let binary = this.getBits(value);
        let binaryText = document.createTextNode(this.byteString(binary));
        binarySpan.appendChild(binaryText);
        let total = document.querySelector('#andor-wrapper > .adjustments > .total') as HTMLDivElement;
        HTMLHelper.clearChildren(total);
        total.appendChild(span);
        total.appendChild(binarySpan);

    }
}

enum BinaryOperation {
    None = 'none',
    And = 'and',
    Or = 'or'
}