import Http from './http';
import HTMLHelper from './HtmlHelper';

let component;

window.addEventListener('DOMContentLoaded', () => {
    component = new Birthday2018();
});

class Birthday2018 {
    private name: string;
    private mustard: string;
    constructor() {
        let response = localStorage.getItem('bday2018');
        if (response) {
            let initalValues = JSON.parse(response);
            this.name = initalValues.name;
            this.mustard = initalValues.mustard;
        }
        this.registerEvents();
    }

    registerEvents() {
        let form = this.getForm();
        let nameInput = form.querySelector('#name');
        nameInput.addEventListener('change', ev =>
                this.name = (ev.currentTarget as HTMLInputElement).value);
        let mustardInput = form.querySelector('#mustard');
        mustardInput.addEventListener('change', ev =>
                this.mustard = (ev.currentTarget as HTMLInputElement).value);

    }

    fillForm() {
        let form = this.getForm();
        let nameInput = form.querySelector('#name') as HTMLInputElement;
        nameInput.value = this.name;
        let mustardInput = form.querySelector('#mustard') as HTMLInputElement;
        mustardInput.value = this.mustard;
    }

    getForm(): HTMLFormElement {
        return document.querySelector('.rsvp-form');
    }

    asJson() {
        return {
            name: this.name,
            mustard: this.mustard
        };
    }

    async getRsvpList() {
        let rsvpList = await Http.get<any[]>('/bday');
        let htmlList = this.getList();
        HTMLHelper.clearChildren(htmlList);
        for (var i = 0; i < rsvpList.length; i++) {
            let rsvp = rsvpList[i];
            let rsvpElement = new RSVPListItem(rsvp.name, rsvp.mustard);
            htmlList.appendChild(rsvpElement.html());
        }
    }

    getList() {
        return document.getElementById('response-list');
    }

    async save() {
        let values = JSON.stringify(this.asJson());
        localStorage.setItem('bday2018', values);
        await Http.post('/bday', values);
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
        let nameSpan = HTMLHelper.span(this.name);
        ret.appendChild(nameSpan);
        let mustardSpan = HTMLHelper.span(this.mustard);
        ret.appendChild(mustardSpan);
        return ret;
    }
}