export default class Text {
    public static twoDigit(n: number | string): string {
        return `0${n}`.substr(-2);
    }
    public static camelToKabob(s: string): string {
        return Array.from(s).map(c => {
            if (c === c.toUpperCase()) {
                return `$-${c.toLowerCase()}`
            }
            return c;
        }).join('')
    }

    public static kabobToCamel(s: string): string {
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
            return c;
        }).join('')
    }
}