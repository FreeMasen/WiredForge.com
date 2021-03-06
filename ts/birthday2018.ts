import Http from './http';
import HTMLHelper from './HtmlHelper';
import Mustard from './models/mustard';

let component;

window.addEventListener('DOMContentLoaded', () => {
    component = new Birthday2018();
});

class Birthday2018 {
    private mustard: Mustard = new Mustard();

    constructor() {
        let response = localStorage.getItem('bday2018');
        if (response) {
            try {
                this.mustard = JSON.parse(response);
            } catch (e) {
                console.error('Clearing local stroage, parsing failed');
                localStorage.removeItem('bday2018');
            }
        }
        this.getRsvpList();
        if (location.search.indexOf('9fxpv110h0mBbhAVWz8zJw%3d%3d') < 0) {
            this.removeForm();
        } else {
            this.registerEvents();
            this.checkLocalStorage()
        }
    }

    registerEvents() {
        let form = this.getForm();
        let nameInput = form.querySelector('#name');
        nameInput.addEventListener('change', ev => this.updateSelf());
        let mustardInput = form.querySelector('#mustard');
        mustardInput.addEventListener('change', ev => this.updateSelf());
        let submit = form.querySelector('#submit-rsvp');
        submit.addEventListener('click', () => this.save());
        let cancel = form.querySelector('#cancel');
        cancel.addEventListener('click', () => this.clearForm());
    }

    updateSelf() {
        let form = this.getForm();
        let nameInput = form.querySelector('#name') as HTMLInputElement;
        this.mustard.name = nameInput.value;
        let mustardInput = form.querySelector('#mustard') as HTMLInputElement;
        this.mustard.mustard = mustardInput.value;
    }

    clearForm() {
        this.mustard.name = '';
        this.mustard.mustard = '';
        this.fillForm();
    }

    fillForm() {
        let form = this.getForm();
        let nameInput = form.querySelector('#name') as HTMLInputElement;
        nameInput.value = this.mustard.name;
        let mustardInput = form.querySelector('#mustard') as HTMLInputElement;
        mustardInput.value = this.mustard.mustard;
    }

    getForm(): HTMLFormElement {
        return document.querySelector('.rsvp-form');
    }

    renderRsvpList(mustards: Array<Mustard>) {
        let list = document.getElementById('rsvp-list');
        HTMLHelper.clearChildren(list);
        for (let mustard of mustards) {
            list.appendChild(this.renderMusterd(mustard));
        }
    }

    renderMusterd(mustard: Mustard): HTMLDivElement {
        let container = HTMLHelper.div('mustard-list-entry');
        let nameSpan = HTMLHelper.span(mustard.name);
        container.appendChild(nameSpan);
        let brand = HTMLHelper.span(mustard.mustard);
        container.appendChild(brand);
        return container;
    }

    removeForm() {
        let form = this.getForm();
        form.parentElement.removeChild(form);
    }

    checkLocalStorage() {
        let currentSubmission = localStorage.getItem('bday2018')
        if (!currentSubmission) return;
        try {
            let mustard = JSON.parse(currentSubmission) as Mustard;
            this.mustard.name = mustard.name;
            this.mustard.mustard = mustard.mustard;
        } catch (e) {

        }
    }
    
    async getRsvpList() {
        let rsvpList = await Http.get<Array<Mustard>>('/rsvp');
        this.displayList(rsvpList);
    }

    displayList(rsvpList: Array<Mustard>) {
        if (!rsvpList) return console.error('displayList: No mustards provided');
        let htmlList = this.getList();
        HTMLHelper.clearChildren(htmlList);
        for (var i = 0; i < rsvpList.length; i++) {
            let rsvp = rsvpList[i];
            let rsvpElement = new RSVPListItem(rsvp.name, rsvp.mustard);
            htmlList.appendChild(rsvpElement.html());
        }
    }

    getList() {
        return document.getElementById('rsvp-list');
    }

    async save() {
        let m = {} as any;
        m.name = this.mustard.name;
        m.mustard = this.mustard.mustard;
        if (this.mustard.id != null && this.mustard.id != 0) {
            m.id = this.mustard.id;
        }
        let values = JSON.stringify(m);
        localStorage.setItem('bday2018', values);
        let rsvp = await Http.post('/rsvp', values, 'application/json');
        this.mustard = rsvp;
        this.getRsvpList();
    }
}

class RSVPListItem {
    constructor(
        public name: string = '',
        public mustard: string = '',
    ) {

    }

    html(): HTMLDivElement {
        let ret = HTMLHelper.div('list-entry');
        let nameSpan = HTMLHelper.span(this.name, 'list-entry-element');
        ret.appendChild(nameSpan);
        let mustardSpan = HTMLHelper.span(this.mustard, 'list-entry-element');
        ret.appendChild(mustardSpan);
        return ret;
    }
}