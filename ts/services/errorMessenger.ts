
export default class ErrorMessenger {
    private static queue: Array<string> = [];
    private static hasCurrent: boolean = false;

    static displayError(msg: string) {
        if (ErrorMessenger.hasCurrent) {
            ErrorMessenger.queue.push(msg);
        } else {
            ErrorMessenger._displayError(msg);
        }
    }

    private static _displayError(msg: string) {
        ErrorMessenger.hasCurrent = true;
        let container = ErrorMessenger.getContainer();
        let span = ErrorMessenger.createSpan(msg);
        container.appendChild(span);
        setTimeout(ErrorMessenger.clearCurrentError, 3000);
    }

    private static clearCurrentError() {
        this.hasCurrent = false;
        let container = ErrorMessenger.getContainer();
        while (container.hasChildNodes()) {
            container.removeChild(container.firstChild);
        }
        if (ErrorMessenger.queue.length > 0) {
            let nextMsg = ErrorMessenger.queue.shift();
            ErrorMessenger._displayError(nextMsg);
        }
    }

    private static getContainer(): HTMLDivElement {
        let container = document.getElementById('') as HTMLDivElement;
        if (!container) {
            container = ErrorMessenger.createContainer();
        }
        if (!container) {
            throw new Error('Unable to find or create an error message container');
        }
        return container;
    }

    private static createContainer(): HTMLDivElement {
        let div = document.createElement('div');
        div.setAttribute('id', 'error-message-container');
        document.body.appendChild(div);
        return div;
    }

    private static createSpan(message: string): HTMLSpanElement {
        let span = document.createElement('span') as HTMLSpanElement;
        span.setAttribute('class', 'error-message');
        let inner = document.createTextNode(message);
        span.appendChild(inner);
        return span;
    }
}