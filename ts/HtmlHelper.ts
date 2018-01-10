export default class HTMLHelper {
    static ensureClass(element: HTMLElement, value: string) {
        let classList = element.getAttribute('class').split(' ');
        if (classList.indexOf(value) > -1) return;
        classList.push(value);
        element.setAttribute('class', classList.join(' '));
    }

    static removeClass(element: HTMLElement, value: string) {
        let classList = element.getAttribute('class').split(' ');
        let classIndex = classList.indexOf(value);
        if (classIndex < 0) return;
        classList.splice(classIndex, 1);
        element.setAttribute('class', classList.join(' '));
    }

    static clearChildren(element: HTMLElement) {
        while (element.hasChildNodes()) {
            if (!element.lastChild) break;
            element.removeChild(element.lastChild);
        }
    }

    static swapNode(replacement: HTMLElement, selector: string) {
        let domElement = document.querySelector(selector);
        domElement.insertAdjacentElement('beforebegin', replacement);
        domElement.parentElement.removeChild(domElement);
    }

    static div(className: string = null, id: string = null): HTMLDivElement {
        let ret = document.createElement('div') as HTMLDivElement;
        if (id)
            ret.setAttribute('id', id);
        if (className)
            ret.setAttribute('class', className);
        return ret;
    }

    static label(text: string, inputId: string = null, className: string = null, id: string = null): HTMLLabelElement {
        let ret = document.createElement('label') as HTMLLabelElement;
        if (inputId)
            ret.setAttribute('for', inputId);
        if (className)
            ret.setAttribute('class', className);
        if (id)
            ret.setAttribute('id', id);
        let content = document.createTextNode(text);
        ret.appendChild(content);
        return ret;
    }

    static textBox(className: string = null, id: string = null): HTMLInputElement {
        let input = document.createElement('input') as HTMLInputElement;
        if (className)
            input.setAttribute('class', className);
        if (id)
            input.setAttribute('id', id);
        return input;
    }

    static span(content: string, className: string = null, id: string = null): HTMLSpanElement {
        let span = document.createElement('span') as HTMLSpanElement;
        let text = document.createTextNode(content);
        span.appendChild(text);
        if (className)
            span.setAttribute('class', className);
        if (id)
            span.setAttribute('id', id);
        return span;
    }
}