let signedCounter;

window.addEventListener('DOMContentLoaded', () => {
    signedCounter = new SignedCounter();
});

export default class SignedCounter {
    private unsigned = 0;
    private signed = 0;
    private countingTimeout = null;
    private counterProgress = 0;
    private static ID_PREFIX = 'twos-comp-';
    constructor() {
        this.registerEvents();
    }

    registerEvents() {
        let i = 1;
        while (i < 129) {
            let cell = document.getElementById(`${SignedCounter.ID_PREFIX}${i}`) as HTMLTableDataCellElement;
            if (!cell) {
                return console.error('Unable to get cell for ', i);
            }
            let cellId = i;
            cell.addEventListener('click', (ev) => this.updateValueWith(cellId, (ev.currentTarget as HTMLTableDataCellElement).innerHTML !== '1'))
            i <<= 1;
        }
        let unButton = document.getElementById('twos-comp-start-unsigned') as HTMLButtonElement;
        if (!unButton) {
            return console.error('unable to find start counting unsigned button');
        }
        unButton.addEventListener('click', () => this.startCounting(false));
        let button = document.getElementById('twos-comp-start-signed') as HTMLButtonElement;
        if (!button) {
            return console.error('unable to find start counting signed button');
        }
        button.addEventListener('click', () => this.startCounting(true));
    }

    updateCells() {
        let i = 1;
        while (i < 129) {
            let value = 0;
            if ((this.unsigned & i) > 0) {
                value = 1;
            }
            let cell = document.getElementById(`${SignedCounter.ID_PREFIX}${i}`) as HTMLTableDataCellElement;
            if (!cell) {
                return console.error('Unable to get cell for ', i);
            }
            cell.innerHTML = value.toFixed(0);
            i <<= 1;
        }
        let u8Total = document.getElementById('u8-total');
        if (!u8Total) {
            return console.error('Failed to find u8 Total');
        }
        u8Total.innerHTML = this.unsigned.toFixed(0);
        let i8Total = document.getElementById('i8-total');
        if (!i8Total) {
            return console.error('Failed to find i8 Total');
        }
        i8Total.innerHTML = this.signed.toFixed(0);
    }

    updateValueWith(segment: number, one: boolean) {
        if (this.countingTimeout !== null) {
            clearTimeout(this.countingTimeout);
        }
        if (one) {
            this.unsigned |= segment;
        } else {
            this.unsigned ^= segment;
        }
        this.calculateFromUnsigned();
        this.updateCells();
    }

    startCounting(signed = false) {
        if (this.countingTimeout !== null) {
            clearTimeout(this.countingTimeout);
        }
        if (signed) {
            this.signed = -128;
            this.calculateFromSigned();
        } else {
            this.unsigned = 0;
            this.calculateFromUnsigned();
        }
        this.counterProgress = 1;
        this.updateCells();
        this.countingTimeout = setTimeout(() => this.count(signed), 500);

    }

    count(signed = false) {
        this.counterProgress += 1;
        if (signed) {
            this.signed += 1;
            this.calculateFromSigned();
        } else {
            this.unsigned += 1;
            this.calculateFromUnsigned();
        }
        this.updateCells();
        if (this.counterProgress < 255) {
            this.countingTimeout = setTimeout(() =>
                                this.count(signed),
                                 (1 - (this.counterProgress / 255)) * 400);
        } else {
            this.countingTimeout = null;
        }
    }

    calculateFromUnsigned() {
        let max = 2**8;
        if (this.unsigned >= max / 2) {
            this.signed = -(max - this.unsigned);
        } else {
            this.signed = this.unsigned;
        }
    }

    calculateFromSigned() {
        let max = 2**8;
        if (this.signed > 0) {
            this.unsigned = this.signed;
        } else {
            this.unsigned = this.signed + max;
        }
    }

}