export default class Text {
    static twoDigit(n) {
        return `0${n}`.substr(-2);
    }
    static camelToKabob(s) {
        return Array.from(s).map(c => {
            if (c === c.toUpperCase()) {
                return `$-${c.toLowerCase()}`
            }
            return c;
        }).join('')
    }

    static kabobToCamel(s) {
        let capitalize = false;
        return Array.from(s).map(c => {
            if (c == '-') {
                capitalize = true;
                return '';
            }
            if (capitalize) {
                capitalize = false;
                return c.toUpperCase();
            }
            return c.toLowerCase();
        }).join('')
    }
}
