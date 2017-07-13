import { Logger } from '../services';
/**
 * A central location for dealing with HTML and custom events
 */
export class EventHandler {
    private static elementEvents = {};
    private static nonHTMLEvent = {};

    registerSelectorEvent(selector: string, eventName: string, listener: Function, context: any): void {
        Logger.log('EventHandler', 'registerSelectorEvent', selector, eventName);
        var elements = document.querySelectorAll(selector);
        if (elements === undefined || elements.length < 1) return Logger.error('EventHandler','no elements', new Error(`document.querySelectorAll(${selector}) found nothing`));
        this.registerNodeEvent(elements, selector, eventName, listener, context);
    }

    registerNodeEvent(nodes: HTMLElement | HTMLElement[] | NodeListOf<Element> | Window, selector: string, 
                        eventName: string, listener: Function, context: any): void {
        Logger.log('EventHandler', 'registerNodeEvent', nodes, selector, eventName);
        if (EventHandler.elementEvents[selector] === undefined) {
            Logger.log('EventHandler', 'registerNodeEvent', 'selector not found adding to map');
            EventHandler.elementEvents[selector] = {};
        }
        var eventTarget = EventHandler.elementEvents[selector];
        if (!eventTarget[eventName]) {
            Logger.log('EventHandler', 'registerNodeEvent', 'event not found adding to map');
            eventTarget[eventName] = [];
        }
        var listenerText = listener.toString();
        var bound = listener.bind(context);
        if (this.checkForExisting(selector, eventName, listener.toString()))
            return;
        eventTarget[eventName].push(
            {
                func: bound,
                text: listener.toString()
            }
        );
        if (nodes instanceof HTMLElement) nodes = [nodes];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.addEventListener(eventName, this, false);
        }
    }

    checkForExisting(selector: string, eventName: string, listenerText: string): boolean {
        var grandParent = EventHandler.elementEvents[selector];
        if (!grandParent) return false;
        var parent = grandParent[eventName];
        if (!parent) return false;
        for (var i = 0; i < parent.length; i++) {
            var listener = parent[i];
            if (listener.text === listenerText) {
                return true;
            }
        }
        return false;
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
        var target = <HTMLElement>event.currentTarget;
        var eventTarget = this.findTarget(target);
        if (eventTarget === undefined) {
            return Logger.log('EventHandler', 'handleEvent', 'Unable to find event target');
        }
        var listeners = eventTarget[event.type];
        if (!listeners) {
            return Logger.log('EventHandler', 'handleEvent', 'Unable to find listeners');
        }
        for (var i = 0; i < listeners.length; i++) {
            var fn = listeners[i].func;
            fn(event);
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
        Logger.log('EventHandler', 'findTarget', target, EventHandler.elementEvents, EventHandler.nonHTMLEvent);
        //first try the id attribute
        var selector = '#'  + target.id;
        var element = EventHandler.elementEvents[selector];
        //if that fails
        if (element === undefined) {
            Logger.log('EventHandler', 'findTarget', 'target not found via id selector');
            //try each of the classes
            var classList = target.className.split(' ');
            for (var i = 0; i < classList.length; i ++) {
                var c  = classList[i];
                selector = '.' + c;
                var element = EventHandler.elementEvents[selector];
                //if a class was registered, return here
                if (element !== undefined) return element;
            }
            Logger.log('EventHandler', 'findTarget', 'target not found via class list');
            //if no class was found try the tagName
            element = EventHandler.elementEvents[target.tagName];
        }
        //if we found the
        return element;
    }
}