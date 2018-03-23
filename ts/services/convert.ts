export default class Converter {

    static to_bits(value: number): Array<number> {
        let ret = [];
        let bit = 1;
        for (var i = 0; i < 8; i++) {
            if ((value & bit) > 0) {
                ret.unshift(1);
            } else {
                ret.unshift(0);
            }
            bit *= 2;
        }
        return ret;
    }

    static to_string(bits: Array<number>) {
        let ret = '';
        for (var i = 0; i < bits.length; i++) {
            let bit = bits[i];
            ret += `${bit}`;
            if (ret.length == 4) ret += ' ';
        }
        return ret;
    }

    static bit_string(value: number): string {
        let ret = '';
        let bits = [0,0,0,0,0,0,0,0]
        let bit = 1;
        for (var i = 0; i < 8; i++) {
            if ((value & bit) > 0) {
                bits[7 - i] = 1;
            } 
            bit *= 2;
        }
        return bits.map((n, i) => {
            if (i == 4) {
                return ' ' + n.toString();
            }
            return n.toString();
        }).join('');
    }
}