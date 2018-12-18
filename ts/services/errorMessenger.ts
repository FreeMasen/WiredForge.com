
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
        let container = ErrorMessenger.createContainer();
        let span = ErrorMessenger.createSpan(msg);
        container.appendChild(span);
        document.body.insertBefore(container, document.body.firstElementChild);
        setTimeout(ErrorMessenger.clearCurrentError, 3000);
    }

    private static clearCurrentError() {
        this.hasCurrent = false;
        let container = ErrorMessenger.getContainer();
        container.parentNode.removeChild(container);
        if (ErrorMessenger.queue.length > 0) {
            let nextMsg = ErrorMessenger.queue.shift();
            ErrorMessenger._displayError(nextMsg);
        }
    }

    private static getContainer(): HTMLDivElement {
        let container = document.getElementById('error-message-container') as HTMLDivElement;
        if (container) {
            container.parentElement.removeChild(container);
        }
        return ErrorMessenger.createContainer();
    }

    private static createContainer(): HTMLDivElement {
        let div = document.createElement('div');
        div.setAttribute('id', 'error-message-container');
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