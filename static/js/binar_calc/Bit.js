export default class Bit {
    data = [];
    next() {
        let nextBit = new Bit();
        if (this.data.length < 1) {
            nextBit.data = [1];
        } else {
            nextBit.data = this.data.slice(0).map(v => v * 2);
            nextBit.realign();
        }
        return nextBit;
    }

    realign() {
        let carryOver = 0;
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
    
    add(other) {
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

    toString() {
        if (this.data.length == 0) return '0';
        return this.data.join('');
    }

    copy() {
        let ret = new Bit();
        ret.data = this.data.map(b => b);
        return ret;
    }
}
