
export default class ErrorMessenger {
    static queue = [];
    static hasCurrent = false;

    static displayError(msg) {
        if (ErrorMessenger.hasCurrent) {
            ErrorMessenger.queue.push(msg);
        } else {
            ErrorMessenger._displayError(msg);
        }
    }

    static _displayError(msg) {
        ErrorMessenger.hasCurrent = true;
        let container = ErrorMessenger.createContainer();
        let span = ErrorMessenger.createSpan(msg);
        container.appendChild(span);
        document.body.insertBefore(container, document.body.firstElementChild);
        setTimeout(ErrorMessenger.clearCurrentError, 3000);
    }

    static clearCurrentError() {
        let container = ErrorMessenger.getContainer();
        container.parentNode.removeChild(container);
        if (ErrorMessenger.queue.length > 0) {
            let nextMsg = ErrorMessenger.queue.shift();
            ErrorMessenger._displayError(nextMsg);
        } else {
            ErrorMessenger.hasCurrent = false;
        }
    }

    static getContainer() {
        let container = document.getElementById('error-message-container');
        if (!container) {
            return ErrorMessenger.createContainer();
        }
        return container;
    }

    static createContainer() {
        let div = document.createElement('div');
        div.setAttribute('id', 'error-message-container');
        return div;
    }

    static createSpan(message) {
        let span = document.createElement('span');
        span.setAttribute('class', 'error-message');
        let inner = document.createTextNode(message);
        span.appendChild(inner);
        return span;
    }
}
