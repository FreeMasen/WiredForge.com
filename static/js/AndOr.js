import HTMLHelper from '/js/HtmlHelper.js';
import Converter from '/js/services/convert.js';
let andOr;
window.addEventListener('DOMContentLoaded', () => {
    andOr = new AndOr();
});

class AndOr {
    leftBits = [0,0,0,0,0,0,0,0];
    rightBits = [0,0,0,0,0,0,0,0];
    operation = BinaryOperation.And;
    constructor(
        lhs = 0,
        rhs = 0
    ) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.registerEvents();
        this.updateBits();
        this.updateButtons();
        this.updateTotal();
    }

    registerEvents() {
        let inputs = document.querySelectorAll('#andor-wrapper > .values > .inputs > .input-group > .user-input');
        for (var i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            input.addEventListener('change', ev => this.inputChanged())
        }
        let buttons = document.querySelectorAll('#andor-wrapper > .adjustments > .buttons > .button')
        for (var i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            button.addEventListener('click', ev => this.buttonClicked(ev))
        }
    }

    inputChanged() {
        let lhs = document.querySelector('#andor-wrapper > .values > .inputs > .input-group > #left-bits');
        let leftValue = parseInt(lhs.value);
        let rhs = document.querySelector('#andor-wrapper > .values > .inputs > .input-group > #right-bits');
        let rightValue = parseInt(rhs.value);
        this.lhs = leftValue;
        this.leftBits = this.getBits(leftValue);
        this.rhs = rightValue;
        this.rightBits = this.getBits(rightValue);
        this.updateBits();
        this.updateTotal();
    }

    getBits(value) {
        return Converter.to_bits(value);
    }

    updateBits() {
        let bytes = document.querySelector('#andor-wrapper > .values > .representation');
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

    byteString(bits) {
        return Converter.to_string(bits);
    }

    buttonClicked(ev) {
        let button = ev.currentTarget;
        this.operation = button.getAttribute('operation');
        this.updateTotal();
        this.updateButtons();
    }

    updateButtons() {
        let buttons = document.querySelectorAll('#andor-wrapper > .adjustments > .buttons > .button');
        for (var i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            let buttonOperation = button.getAttribute('operation');
            if (buttonOperation == this.operation) {
                HTMLHelper.ensureClass(button, 'selected')
            } else {
                HTMLHelper.removeClass(button, 'selected');
            }
        }
    }

    updateTotal() {
        let value = 0;
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

        let span = document.createElement('span');
        span.setAttribute('class', 'total-value');
        let totalText = document.createTextNode(`${operation}`);
        span.appendChild(totalText);

        let binarySpan = document.createElement('span');
        binarySpan.setAttribute('class', 'binary-total');
        let binary = this.getBits(value);
        let binaryText = document.createTextNode(this.byteString(binary));
        binarySpan.appendChild(binaryText);
        let total = document.querySelector('#andor-wrapper > .adjustments > .total');
        HTMLHelper.clearChildren(total);
        total.appendChild(span);
        total.appendChild(binarySpan);

    }
}

const BinaryOperation = Object.freeze({
    None: 'none',
    And: 'and',
    Or: 'or'
})
