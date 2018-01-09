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
}