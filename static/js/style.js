export class Colors {
    constructor(
        red = 'rgba(255, 105, 105, 1)',
        orange = 'rgba(255,75,0, 0.5)',
        yellow = 'rgba(255,203,0, 0.5)',
        green = 'rgba(0,255,203, 0.5)',
        blue = 'rgba(0, 180, 255, 0.5)',
        indigo = 'indigo',
        violet = 'rgba(203,0,255,0.5)',
        black  = '#000',
        white = '#fff',
        grey = 'rgba(0,0,0,0.5)'
    ) {
        this.red = red
        this.orange = orange
        this.yellow = yellow
        this.green = green
        this.blue = blue
        this.indigo = indigo
        this.violet = violet
        this.black = black
        this.white = white
        this.grey = grey
    }
}
export class Style {
    static colors = new Colors();
}
