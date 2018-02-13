import Data from './voice/data';
import {Statement} from './voice/models';
import Html from './voice/html';
let voice: Voice;
window.addEventListener('DOMContentLoaded', () => {
    voice = new Voice();
});

class Voice {
    private queue: Array<Statement> = [];
    private discard: Array<Statement> = [];
    private speaker: SpeechSynthesis = window.speechSynthesis;
    private stopped: boolean = false;
    private data: Data;

    constructor() {
        this.setVoiceOptions();
        this.registerEvents();
        this.data = new Data();
    }

    //Setup the select list options
    setVoiceOptions() {
        let select = this.getSelect();
        //clear out any existing options
        while (select.options.length > 0) {
            select.options.remove(0);
        }
        let voices = this.speaker.getVoices();
        for (let i = 0; i < voices.length; i++) {
            let opt = document.createElement('option') as HTMLOptionElement;
            opt.value = i.toString();
            let voice = voices[i];
            opt.text = `${voice.name} (${voice.lang})`;
            if (voice.default) {
                select.value = i.toString();
            }
        }
    }

    registerEvents() {
        let clear = document.getElementById('clear') as HTMLButtonElement;
        clear.addEventListener('click', ev => this.clearBox(ev));
        let submit = document.getElementById('submit') as HTMLButtonElement;
        submit.addEventListener('click', ev => this.addUtterance(ev))
    }

    /**Add a new statement to the queue */
    addUtterance(ev: MouseEvent) {
        ev.preventDefault();
        let textArea = this.getBox();
        let text = textArea.value;
        let statement = new Statement(
            -1,
            text,
            this.selectedVoice.name,
            this.selectedVoice.lang,
        )
        this.data.upsertStatement(statement);
        this.refreshQueues();
        if (!this.stopped) this.clearQueue();
    }

    /**Refresh the data in the queue and discard arrays */
    async refreshQueues() {
        this.queue = await this.data.getUnspoken();
        this.discard = await this.data.getSpoken();
        this.refreshLists();
    }

    /** Refresh the two lists of statements*/
    refreshLists() {
        let discarded = document.getElementById('completed-statements');
        Html.clearElement(discarded);
        for (let statement of this.discard) {
            let el = Html.completedStatement(
                statement,
                s => this.data.deleteStatement(s),
                s => this.requeue(s)
            );
            discarded.appendChild(el);
        }
        let queue = document.getElementById('queued-statements');
        Html.clearElement(queue);
        for (let statement of this.queue) {
            let el = Html.queuedStatement(
                statement,
                s => this.data.deleteStatement(s),
            );
            queue.appendChild(el);
        }
    }

    requeue(s: Statement) {
        s.lastSpoken = undefined;
        this.data.upsertStatement(s);
    }

    get selectedVoice(): SpeechSynthesisVoice {
        let select = this.getSelect();
        let voices = this.speaker.getVoices();
        if (select.value != '') {
            let selection = parseInt(select.value);
            return voices[selection];
        }
        return voices[0];
    }

    clearQueue() {
        if (this.queue.length > 0 && !this.speakerFree) {
            let next = this.queue.shift();
            this.speaker.speak(next.toUtterance());
            next.lastSpoken = new Date();
            this.data.upsertStatement(next);
            this.refreshQueues();
        }
        if (!this.stopped)
            setTimeout(ev => this.clearQueue(), 0); //non-blocking loop
    }

    get speakerFree(): boolean {
        return !this.speaker.speaking && 
                !this.speaker.paused && 
                !this.speaker.pending
    }

    pauseSpeaker() {
        this.speaker.pause();
    }
    
    resumeSpeaker() {
        this.speaker.resume();
    }

    toggleStopped() {
        this.stopped = !this.stopped;
        if (!this.stopped) 
            this.clearQueue();
        else 
            this.speaker.cancel();
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