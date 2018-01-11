export class Colors {
    constructor(
        public red: string = 'rgba(255, 105, 105, 1)',
        public orange: string = 'rgba(255,75,0, 0.5)',
        public yellow: string = 'rgba(255,203,0, 0.5)',
        public green: string = 'rgba(0,255,203, 0.5)',
        public blue: string = 'rgba(0, 180, 255, 0.5)',
        public indigo: string = 'indigo',
        public violet: string = 'rgba(203,0,255,0.5)',
        public black: string  = '#000',
        public white: string = '#fff',
        public grey: string = 'rgba(0,0,0,0.5)'
    ) {

    }
}
export default class Style {
    static colors: Colors = new Colors();
}
