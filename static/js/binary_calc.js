window.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
});
let bigUints = [];
function addEventListeners() {
    captureBigUints()
    let numbers = document.querySelectorAll('.bit-value');
    let switches = document.querySelectorAll('.bit-switch');
    for (let num of numbers) {
        num.addEventListener('click', event => {
            flipBit(event);
            let newValue = count();
            updateTotal(newValue);
        });
    }

}

function flipBit(event) {
    let span = event.currentTarget;
    let input = event.currentTarget.parentNode.querySelector('.bit-switch');
    console.log('flipBit', span, input);
    let value = parseInt(span.innerHTML);
    if (value == 1) {
        span.previousElementSibling.checked = false;
        span.innerHTML = '0';
    } else {
        span.previousElementSibling = true;
        span.innerHTML = '1';
    }
    console.log('flipedBit', span, span.previousElementSibling);
}

function captureBigUints() {
    let switches = document.querySelectorAll('.bit-value');
    for (var i = 0; i < switches.length; i++) {
        switches[switches.length - (i + 1)].setAttribute('uint-index', i);
        let bigUint = new BigUInt(Math.pow(2, i));
        bigUints.push(bigUint);
    }
}

function count() {
    let values = []
    let switches = document.querySelectorAll('.bit-value');
    for (var i = 0; i < switches.length; i++) {
        let bit = switches[switches.length - (i + 1)];
        if (bit.innerHTML == "1") {
            let index = bit.getAttribute('uint-index');
            values.push(bigUints[index]);
        }
    }
    let newNum = values.reduce((acc, curr) => {
        acc.add(curr);
        return acc;
    }, new BigUInt(0));
    return newNum.toString();
}

function updateTotal(newValue) {
    let total = document.getElementById('current-total');
    total.innerHTML = newValue;
}
function BigUInt(num) {
    this.data = [];
    //            17014118346046924168183820328401633280
    let divisor = 100000000000000000000000000000;
    let i = this.data.length;
    while (num > 10) {
        let position = Math.floor(num / divisor);
        if (position === 0 && this.data.length < 1) {
            divisor /= 10;
            continue;
        }
        this.data.push(position);
        num -= (position * divisor);
        divisor /= 10;
        i--
    }
    this.data.push(num);
    this.realign();
}

BigUInt.prototype.add = function(other) {
    let revOther = other.data.slice(0).reverse();
    let revSelf = this.data.slice(0).reverse();
    for (var i = 0; i < other.data.length; i++) {
        let curOther = revOther[i];
        let curSelf = revSelf[i];
        if (curSelf === undefined) {
            revSelf.push(curOther);
        } else {
            let newVal = (curOther || 0) + curSelf;
            revSelf[i] = newVal;
        }
    }
    this.data = revSelf.slice(0).reverse();
    this.realign();
}


BigUInt.prototype.toString = function() {
    return this.data.join('');
}
BigUInt.prototype.realign = function() {
    let carryOver = 0;
    let tooBig;
    console.log(this.data);
    while ((tooBig = this.data.filter(v => v > 9)).length > 0) {
        for (let i = this.data.length - 1;i >= 0;i--) {
            let current = this.data[i];
            let update = 0;
            if (carryOver > 0) {
                update += carryOver;
                carryOver = 0;
            }
            update += current;
            while (update > 9) {
                update -= 10;
                carryOver++
            }
            this.data[i] = update;
        }
        if (carryOver > 0) {
            this.data.unshift(carryOver);
        }
    }
}

function experiment(num) {
    this.data = new Uint8Array(38);

    //            17014118346046924168183820328401633280
    let divisor = 100000000000000000000000000000;
    while (num > 10) {
        let position = Math.floor(num / divisor);
        if (position === 0 && this.data.length < 1) {
            divisor /= 10;
            continue;
        }
        this.data.push(position);
        num -= (position * divisor);
        divisor /= 10;
    }
    this.data.push(num);
    this.realign();

}