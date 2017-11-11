import { Option , Attribute } from '../models';

/**
 * A convenient way to create HTML Elements
 */
export class HTML {
    /**
     * Create and <a> element
     * @param {string} href - The address that this element is linked to
     * @param {string} link - The content that will be the clickable link
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    a(link: string | HTMLElement, href?: string,  ...attributeList: Attribute[]): HTMLAnchorElement {
        var element = <HTMLAnchorElement>(this.createElement('a', ...attributeList));
        
        if (href !== null) element.setAttribute('href', href);
        if (typeof link === 'string')
            element.appendChild(document.createTextNode(link));
        else
            element.appendChild(link);
        return element;
    }

    /**
     * Create a <button> element
     * @param {string} text - The text to appear on the button
     * @param {Array<Attribute>} attributeList - The list of attributes
     */
    button(text: string | HTMLElement, ...attributeList: Attribute[]): HTMLButtonElement {
        var element = this.createElement('button', ...attributeList);
        if (typeof text == 'string') {
            element.innerText = text;
        } else {
            element.appendChild(text);
        }
        return <HTMLButtonElement>element;
    }

    /**
     * Create a <code> element
     * @param {string} text - The text to appear in the code block
     * @param {Array<Attribute>} attributeList - The list of attributes
     */
    code(text: string, ...attributeList: Attribute[]): HTMLElement {
        var element = this.createElement('code', ...attributeList);
        element.appendChild(document.createTextNode(text));
        return element;
    }

    /**
     * Create a <div> element
     * @param {HTMLElement} innerContent - Inner content
     * @param {Array<Attribute>} attributeList - List of HTML attributes
     */
    div(innerContent: HTMLElement | HTMLElement[], ...attributeList: Attribute[]): HTMLDivElement {
        var element = <HTMLDivElement>(this.createElement('div', ...attributeList));
        if (!innerContent) return element;
        if (Array.isArray(innerContent)) {
            return <HTMLDivElement>(this.addContent(element, <HTMLElement[]>innerContent));
        }
        element.appendChild(innerContent);
        return element;
    }

    /**
     * Create a <form> element
     * @param {Array<HTMLElement>} inputElements - The collection of HTML Controls
     * @param {<button>} submitButton - The submit button
     * @param {Array<Attribute>} attributeList - The list of HTML attributes
     */
    form(inputElements: HTMLElement[], submitButton: HTMLButtonElement, ...attributeList: Attribute[]): HTMLFormElement {
        var form = <HTMLFormElement>(this.createElement('form', ...attributeList));
        for (var i = 0; i < inputElements.length; i++) {
            form.appendChild(inputElements[i]);
        }
        form.appendChild(submitButton);
        return form;
    }

    /**
     * Create a header element
     * @param {number} level - Rhe level of header between 1 and 6
     * @param {string} text - The content to be displayed
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    h(level: number, text: string, ...attributeList: Attribute[]): HTMLHeadingElement {
        var element = <HTMLHeadingElement>this.createElement('h' + level.toString(), ...attributeList);
        element.appendChild(document.createTextNode(text));
        return element;
    }

    /**
     * Create an i element (typically used as an icon element)
     * @param {string} text - Icon name for the font assigned
     * @param {string} font - The name of the icon font
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes 
     */
    i(text: string, font: string = null, ...attributeList: Attribute[]): HTMLElement {
        var element = this.createElement('i', ...attributeList);
        element.appendChild(document.createTextNode(text));
        if (font !== null) {
            element.style.fontFamily = font;
        }
        return element;
    }

    /**
     * Create an <input> element
     * @param {string} type - The type of the <input>
     * @param {Array<<option>>} placeholder - (optional) The placeholder text that will appear in a text input
     * @param {Array<Attribute>} attributeList - The list of HTML attributes
     */
    input(type: string, placeholder?: string, ...attributeList: Attribute[]): HTMLInputElement {
        var input = this.create<HTMLInputElement>('input', ...attributeList);
        input.setAttribute('type', type);
        if (placeholder)
            input.setAttribute('placeholder', placeholder);
        return input;
    }

    /**
     * The <img> element
     * @param {string} src The source url for the <img>
     * @param {string} altText The text that will appear on hover
     * @param {Array<Attribute>} attributeList The list of other HTML attributes
     */
    img(src: string, altText: string, ...attributeList: Attribute[]): HTMLImageElement {
        var imgSrc = new Attribute('src', src);
        var alt = new Attribute('alt', altText);
        return <HTMLImageElement>(this.createElement('img', imgSrc, alt, ...attributeList));
    }

    /**
     * Create a <label> element
     * @param {string} text - The text that the label will display
     * @param {Array<Attribute>}attributeList The list of HTML attributes 
     */
    label(text: string, ...attributeList: Attribute[]): HTMLLabelElement {
        var label = this.create<HTMLLabelElement>('label', ...attributeList);
        label.appendChild(document.createTextNode(text));
        return label;
    }

    /**
     * Create a link element
     * @param {string} href - Address of the linked resource
     * @param {string} type - Type of linked resource (defaults to 'text/css')
     * @param {string} rel  - Relationship to the document (defaults to 'stylesheet')
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    link(href: string, type: string = 'text/css', rel: string = 'stylesheet', ...attributeList: Attribute[]): HTMLLinkElement {
        var element = this.createElement('link', ...attributeList);
        element.setAttribute('type', type);
        element.setAttribute('rel', rel);
        return <HTMLLinkElement>element;
    }

    /**
     * Create a <li> item element
     * @param {string HTMLElement} content - The content to be included in the list
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    li(content: string | HTMLElement, ...attributeList: Attribute[]): HTMLLIElement {
        var element = this.createElement('li', ...attributeList);
        if (typeof content === 'string')
            element.appendChild(document.createTextNode(content));
        else
            element.appendChild(<HTMLElement>content);
        return <HTMLLIElement>element;
    }

    nav(content: HTMLUListElement, ...attributeList: Attribute[]): HTMLElement {
        var nav = this.create<HTMLElement>('nav', ...attributeList);
        nav.appendChild(content);
        return nav;
    }

    /**
     * Create a <option> item element
     * @param {string} text The displayed value in the <option>
     * @param {string | number} value The value of the <option>
     * @param {Array<Attribute>} attributeList the list of HTML attribures
     */
    option(text: string, value: string | number, ...attributeList: Attribute[]): HTMLOptionElement {
        var opt = this.create<HTMLOptionElement>('option', ...attributeList);
        opt.setAttribute('value', value.toString());
        opt.appendChild(document.createTextNode(text));
        return opt;
    }

    /**
     * Create a <select> element
     * @param {Array<<option>>} options - List of <option> elements
     * @param {Array<Attribute>} attributeList - list of HTML Attributes
     */
    select(options: Option[], ...attributeList: Attribute[]): HTMLSelectElement {
        var select = this.create<HTMLSelectElement>('select', ...attributeList);
        for (var i = 0; i < options.length; i++) {
            select.appendChild(this.option(options[i].text, options[i].value));
        }
        return select;
    }

    /**
     * Create a span element
     * @param {string} text - The string to be displayed
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    span(text: string, ...attributeList: Attribute[]) {
        var element = this.createElement('span', ...attributeList);
        element.appendChild(document.createTextNode(text));
        return element;
    }

    /**
     * Create a table element
     * @param {HTMLTableRowElement} headers - A table row with a list of th elements
     * @param {HTMLTableRowElement} body - A list of table row eleemnts with td elements
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    table(headers: HTMLTableRowElement, body: HTMLTableRowElement[], ...attributeList: Attribute[]): HTMLTableElement {
        var element = this.createElement('table', ...attributeList);
        element.appendChild(headers);
        for (var i = 0; i < body.length; i++) {
            element.appendChild(body[i]);
        }
        return <HTMLTableElement>element;
    }

    /**
     * Create a table body cell
     * @param {string} content - The text to be displayed in this cell
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    td(content: string, ...attributeList: Attribute[]): HTMLTableDataCellElement {
        var element = this.createElement('td', ...attributeList);
        element.appendChild(document.createTextNode(content));
        return <HTMLTableDataCellElement>element;
    }

    /**
     * Create a table row element
     * @param {HTMLTableHeaderCellElement[] | HTMLTableDataCellElement[]} content 
     *          - The cells in this row
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    tr(content: HTMLTableHeaderCellElement[] | HTMLTableDataCellElement[], ...attributeList: Attribute[]): HTMLTableRowElement {
        var element = this.createElement('tr', ...attributeList);
        for (var i = 0; i < content.length; i++) {
            element.appendChild(content[i]);
        }
        return <HTMLTableRowElement>element;
    }

    /**
     * Create a table header cell
     * @param {string} content - The text that will be displayed in the cell
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    th(content: string, ...attributeList: Attribute[]): HTMLTableHeaderCellElement {
        var element = this.createElement('th', ...attributeList);
        element.appendChild(document.createTextNode(content));
        return <HTMLTableHeaderCellElement>element;
    }

    /**
     * Create an unordered list
     * @param {HTMLLIElement} list - An array of <li> elements to be displayed
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    ul(list: HTMLLIElement[], ...attributeList: Attribute[]): HTMLUListElement {
        var element = this.createElement('ul', ...attributeList);
        for (var i = 0; i < list.length; i++) {
            element.appendChild(list[i]);
        }
        return <HTMLUListElement>element;
    }

    /**
     * Create an HTML element of type T
     * @param {string} tagName - the HTML tag name
     * @param {Array<Attribute>} attributeList - a list of HTML Attributes
     */
    create<T extends HTMLElement>(tagName: string = 'div', ...attributeList: Attribute[]): T {
        var element = <T>(document.createElement(tagName));
        for (var i = 0; i < attributeList.length; i++) {
            element.setAttribute(attributeList[i].name, attributeList[i].value);
        }
        return element;
    }

    /**
     * Create an HTML Element (depricated)
     * @param {string} tagName - The tag name of the element being created
     * @param {Array<ElementAttribute>} attributeList - List of HTML attributes
     */
    createElement(tagName: string = 'div', ...attributeList: Attribute[]): HTMLElement {
        var element = document.createElement(tagName);

        if (attributeList){
            for (var i = 0; i < attributeList.length; i++) {
                element.setAttribute(attributeList[i].name, attributeList[i].value);
            }
        }
        return element;
    }

    /**
     * Insert HTML into container
     * @param {HTMLElement} parent - The container element
     * @param {Array<HTMLElement>} children - The list of children
     */
    addContent(parent: HTMLElement, children: HTMLElement[], toBottom: boolean = true): HTMLElement {
        if (!children) return;
        if (toBottom) {
            for (var i = 0; i < children.length; i++) {
                parent.appendChild(children[i]);
            }
        } else {
            var currentTop = parent.firstChild;
            for (var i = 0; i < children.length; i++) {
                parent.insertBefore(children[i], currentTop);
            }
        }

        return parent;
    }

    /**
     * Swap out an existing HTML node
     * @param {string} selector - The selector that will be passed to document.querySelector
     * @param {HTMLElement} node - The HTML node that will replace the selector
     */
    swapNode(selector: string, node: HTMLElement): void {
        var originalNode  = document.querySelector(selector);
        if (!originalNode) return;
        node.setAttribute('id', originalNode.id);
        node.setAttribute('class', originalNode.className);
        try {
        originalNode.parentElement.insertBefore(node, originalNode);
        originalNode.parentElement.removeChild(originalNode);

        } catch (e) {
            console.error(originalNode);
            console.error(node)
            console.error(originalNode.parentElement)
        }
    }

    /**
     * Safely add a class to an HTML Element
     * @param {HTMLElement} node - The node that will have the class added to it
     * @param {string} name - The class that is to be added
     */
    addClass(node: HTMLElement, name: string): void {
        let classArr = node.className.split(' ');
        if (classArr.indexOf(name) > -1) return;
        classArr.push(name);
        node.setAttribute('class', classArr.join(' '));
    }

    /**
     * Safely remove a class from an HTML Element
     * @param {HTMLElement} node - HTML node to have the class removed from 
     * @param {string} name - The class to remove
     */
    removeClass(node: HTMLElement, name: string): void {
        let classArr = node.className.split(' ');
        let indexOfName = classArr.indexOf(name);
        if (indexOfName < 0) return;
        classArr.splice(indexOfName, 1);
        node.setAttribute('class', classArr.join(' '));
    }

    /**
     * Clear all children from an HTML node
     * @param node the parent to be cleared
     */
    clearChildren(node: HTMLElement): void {
        while(node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
    }
}