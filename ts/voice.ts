import {Statement} from './voice/models';
import Html from './voice/html';
import Speaker from './voice/speaker';
import ErrorMessenger from './services/errorMessenger';
let voice: Voice;

window.addEventListener('DOMContentLoaded', () => {
    ErrorMessenger.displayError('Test error message');
    voice = new Voice();
});

class Voice {
    private speaker: Speaker = new Speaker();

    constructor() {
        this.registerEvents();
    }

    /**Setup the select list options */
    setVoiceOptions(iter?: number) {
        let select = this.getSelect();
        //clear out any existing options
        ErrorMessenger.displayError(`Clearing any existing voices`);
        while (select.options.length > 0) {
            select.options.remove(0);
        }
        ErrorMessenger.displayError('Getting voices');
        let voices = this.speaker.getVoices();
        if (voices.length < 1) {
            ErrorMessenger.displayError('No voices, trying again');
            if (!iter) {
                iter = 500;
            }
            if (iter > 3000) {
                ErrorMessenger.displayError('This browser does not support SpeechSynthesis')
            }
            return setTimeout(() => this.setVoiceOptions(iter * 1.5), iter);
        }
        ErrorMessenger.displayError(`voice count: ${voices.length}`);
        for (let i = 0; i < voices.length; i++) {
            let opt = document.createElement('option') as HTMLOptionElement;
            opt.value = i.toString();
            let voice = voices[i];
            opt.text = `${voice.name} (${voice.lang})`;
            if (voice.default) {
                select.value = i.toString();
            }
            select.options.add(opt);
        }
    }

    registerEvents() {
        this.speaker.addEventListener('ready', () => this.setVoiceOptions());
        let clear = document.getElementById('clear') as HTMLButtonElement;
        clear.addEventListener('click', ev => this.clearBox(ev));
        let submit = document.getElementById('submit') as HTMLButtonElement;
        submit.addEventListener('click', ev => this.sayUtterance(ev))
    }

    /**Add a new statement to the queue */
    sayUtterance(ev: MouseEvent) {
        ev.preventDefault();
        let textArea = this.getBox();
        let text = textArea.value;
        let statement = new Statement(
            -1,
            text,
            this.selectedVoice.name,
            this.selectedVoice.lang,
        );
        this.speaker.speak(statement);
    }

    /**Get the voice based on the user's selection */
    get selectedVoice(): SpeechSynthesisVoice {
        let select = this.getSelect();
        let voices = this.speaker.getVoices();
        if (select.value != '') {
            let selection = parseInt(select.value);
            return voices[selection];
        }
        return voices[0];
    }

    stop() {
        this.speaker.cancel();
        Html.addClass('#stop', 'pressed');
        Html.removeClass('#play', 'pressed');
    }

    clearBox(ev: Event) {
        ev.preventDefault();
        let box = this.getBox();
        box.value = '';
    }

    getBox(): HTMLTextAreaElement {
        return document.getElementById('next-utter') as HTMLTextAreaElement;
    }

    getSelect(): HTMLSelectElement {
        return document.getElementById('voice-selection') as HTMLSelectElement;
    }
}