export default class HTMLHelper {
    static ensureClass(element, value) {
        let classList = element.getAttribute('class').split(' ');
        if (classList.indexOf(value) > -1) return;
        classList.push(value);
        element.setAttribute('class', classList.join(' '));
    }

    static removeClass(element, value) {
        let classList = element.getAttribute('class').split(' ');
        let classIndex = classList.indexOf(value);
        if (classIndex < 0) return;
        classList.splice(classIndex, 1);
        element.setAttribute('class', classList.join(' '));
    }

    static clearChildren(element) {
        while (element.hasChildNodes()) {
            if (!element.lastChild) break;
            element.removeChild(element.lastChild);
        }
    }

    static swapNode(replacement, selector) {
        let domElement = document.querySelector(selector);
        domElement.insertAdjacentElement('beforebegin', replacement);
        domElement.parentElement.removeChild(domElement);
    }

    static div(className = null, id = null) {
        let ret = document.createElement('div');
        if (id)
            ret.setAttribute('id', id);
        if (className)
            ret.setAttribute('class', className);
        return ret;
    }

    static label(text, inputId = null, className = null, id = null) {
        let ret = document.createElement('label');
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

    static textBox(className = null, id = null) {
        let input = document.createElement('input');
        if (className)
            input.setAttribute('class', className);
        if (id)
            input.setAttribute('id', id);
        return input;
    }

    static span(content, className = null, id = null) {
        let span = document.createElement('span');
        let text = document.createTextNode(content);
        span.appendChild(text);
        if (className)
            span.setAttribute('class', className);
        if (id)
            span.setAttribute('id', id);
        return span;
    }
}
