import { Logger } from '../services';
/**
 * A central location for dealing with HTML and custom events
 */
export class EventHandler {
    private static elementEvents = {};
    private static nonHTMLEvent = {};

    registerHTMLEvent(selector: string, eventName: string, listener: Function, context: any): void {
        Logger.log('EventHandler', 'registerHTMLEvent', selector, eventName);
        var elements = document.querySelectorAll(selector);
        if (elements === undefined || elements.length < 1) return Logger.error('EventHandler','no elements', new Error(`document.querySelectorAll(${selector}) found nothing`));
        this.registerNodeEvent(elements, selector, eventName, listener, context);
    }

    registerNodeEvent(nodes: HTMLElement | HTMLElement[] | NodeListOf<Element>, selector: string, 
                        eventName: string, listener: Function, context: any): void {
        if (EventHandler.elementEvents[selector] === undefined) {
            EventHandler.elementEvents[selector] = {};
        }
        var eventTarget = EventHandler.elementEvents[selector];
        if (!eventTarget[eventName]) {
            eventTarget[eventName] = [];
        }
        var bound = listener.bind(context);
        eventTarget[eventName].push(bound);
        if (nodes instanceof HTMLElement) nodes = [nodes];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.addEventListener(eventName, this, false);
        }
    }

    registerEvent(eventName: string, listener: Function, context: any): void {
        Logger.log('EventHandler','registerEvent', eventName);
        if (!EventHandler.nonHTMLEvent[eventName])
            EventHandler.nonHTMLEvent[eventName] = [];
        EventHandler.nonHTMLEvent[eventName].push(listener.bind(context));
    }

    fire(eventName: string, ...args: any[]) {
        Logger.log('EventHandler', 'fire', eventName, args);
        var listeners = EventHandler.nonHTMLEvent[eventName]
        if (!listeners) return;
        Logger.log('EventHandler', 'fire', listeners);
        for (var i = 0; i < listeners.length; i++) {
            listeners[i](...args);
        }
    }

    handleEvent(event): void {
        Logger.log('EventHandler', 'handleEvent', event);
        var target = <HTMLElement>event.target;
        var eventTarget = this.findTarget(target);
        if (eventTarget === undefined) return;
        var listeners = eventTarget[event.type];
        if (!listeners) return;
        Logger.log('EventHandler', 'hadleEvent', listeners);
        for (var i = 0; i < listeners.length; i++) {
            var fn = listeners[i];
            fn(event);
        }
    }

    reRegister(node: HTMLElement): void {
        var idElement = EventHandler.elementEvents['#' + node.id]
        if (idElement !== undefined) {
            for (var k in idElement) {
                node.addEventListener(k, this, false);
            }
        }
        var classes = node.className.split(' ');
        for (var i = 0; i < classes.length; i++) {
            var classEvent = EventHandler.elementEvents['.' + classes[i]]
            if (classEvent != undefined) {
                for (var k in classEvent) {
                    node.addEventListener(k, this, false);
                }
            }
        }
    }

    removeListener(eventName: string, selector: string = null, listener: Function){
        if (selector !== null) return this.removeHTMLEvent(eventName, selector, listener);
        var listeners: Array<Function> = EventHandler.nonHTMLEvent[eventName];
        if (!listeners) return;
        var listeners = listeners.filter(element => {
            return listener !== element;
        });
    };

    private removeHTMLEvent(eventName: string, selector: string, listener: Function) {
        var element = EventHandler[selector];
        if (!element) return;
        var listeners: Array<Function> = element[eventName];
        if (!listeners) return;
        listeners = listeners.filter(element => {
            return listener !== element;
        });
    }

    clearEvent(eventName: string, selector: string = null) {
        if (selector !== null) {
            return this.clearHTMLEvent(eventName, selector);
        }
        EventHandler.nonHTMLEvent[eventName] = [];
    }

    private clearHTMLEvent(eventName: string, selector: string) {
        var element = EventHandler.elementEvents[selector];
        if (!element) return;
        element[eventName] = [];
    }

    private findTarget(target: HTMLElement): any {
        //first try the id attribute
        var selector = '#'  + target.id;
        var element = EventHandler.elementEvents[selector];
        //if that fails
        if (element === undefined) {
            //try each of the classes
            var classList = target.className.split(' ');
            for (var i = 0; i < classList.length; i ++) {
                var c  = classList[i];
                selector = '.' + c;
                var element = EventHandler.elementEvents[selector];
                //if a class was registered, return here
                if (selector) return element;
            }
            //if no class was found try the tagName
            element = EventHandler.elementEvents[target.tagName];
        }
        //if we found the
        return element;
    }
}