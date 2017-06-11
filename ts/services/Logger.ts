export class Logger {
    static log(context, fn, ...msg): void {
        var msgString = `${this.timeStamp()} - ${context}.${fn}`
        console.log(msgString, ...msg)
    }

    static error(context, fn, err?,  ...msg): void {
        var msgString = `${this.timeStamp()} - ${context}.${fn}`;
        var errString;
        if (err){
            if (err instanceof Error) {
                errString = `${err.name}: ${err.message}`;
            } else {
                errString = err;
            }
        }
        console.error(msgString, errString ,...msg)
    }

    private static timeStamp(): string {
        var dt = new Date();
        var minutes = ('0' + dt.getMinutes()).substr(-2);
        var seconds = ('0' + dt.getSeconds()).substr(-2);
        return `${dt.getMonth()}/${dt.getDay()}/${dt.getFullYear()} ${dt.getHours()}:${minutes}:${seconds}`
    }
}