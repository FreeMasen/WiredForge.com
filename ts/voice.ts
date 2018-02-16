import Data from './voice/data';
import {Statement, IDbMessage, IVoiceMessage, MessageType} from './voice/models';
import Html from './voice/html';
let voice: Voice;
function createVoice() {
    console.log('createVoice');
    speechSynthesis.removeEventListener('voiceschanged', createVoice);
    voice = new Voice();
}
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    speechSynthesis.addEventListener('voiceschanged', createVoice)
    if (speechSynthesis.getVoices().length > 0) {
        createVoice();
    } else {
        speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
});

type EventHandler = (ev: Event) => void;

class Speaker {
    private _speaker: SpeechSynthesis = window.speechSynthesis;
    private handlers = new Map<string, Array<EventHandler>>();
    constructor() {
        this._speaker.addEventListener('voiceschanged', ev => this.dispatchEvent(ev))
        this.watchVoices();
    }

    private watchVoices() {
        let voices = this._speaker.getVoices();
        if (voices.length > 0) return this.dispatchEvent(new Event('ready'));
        setTimeout(() => this.watchVoices());
    }
    public addEventListener(event: string, handler: EventHandler) {
        let existingList = this.handlers.get(event);
        if (!existingList) {
            existingList = [];
        }
        existingList.push(handler);
        this.handlers.set(event, existingList);
    }

    public removeEventListener(event: 'ready' | 'voiceschanged' | 'speaking' | 'stoppedSpeaking' | 'paused' | 'resumed' | 'cancelled', handler: EventHandler) {
        let existingList = this.handlers.get(event);
        if (!existingList) return;
        let index = existingList.findIndex(f => f == handler);
        if (index < 0) return;
        existingList.splice(index, 1);
        this.handlers.set(event, existingList);
    }

    public dispatchEvent(ev: Event): boolean {
        let handlers = this.handlers.get(ev.type);
        if (!handlers || handlers.length < 1) return true;
        for (let h of this.handlers.get(ev.type)) {
            h(ev);
            if (ev.defaultPrevented) {
                return false;
            }
        }
        return true;
    }

    public speak(utterance: SpeechSynthesisUtterance) {
        this.dispatchEvent(new Event('speaking'));
        this._speaker.speak(utterance);
        this.watchSpeaker();
    }

    private watchSpeaker() {
        if (this._speaker.speaking || this._speaker.pending)
            return setTimeout(() => this.watchSpeaker(), 0);
        this.dispatchEvent(new Event('stoppedSpeaking'));
    }

    public pause() {
        this.dispatchEvent(new Event('paused'));
        this._speaker.pause();
    }

    public resume() {
        this.dispatchEvent(new Event('resumed'));
        this._speaker.resume();
    }
    public cancel() {
        this.dispatchEvent(new Event('cancelled'));
        this._speaker.cancel();
    }

    public getVoices(): Array<SpeechSynthesisVoice> {
        return this._speaker.getVoices();
    }

    get paused(): boolean {
        return this._speaker.paused;
    }

    get speaking(): boolean {
        return this._speaker.speaking;
    }

    get pending(): boolean {
        return this._speaker.pending;
    }

    get free(): boolean {
        return !this._speaker.pending &&
                !this._speaker.paused &&
                !this._speaker.speaking;
    }

}

class Voice {
    private queue: Array<Statement> = [];
    private discard: Array<Statement> = [];
    private speaker: Speaker = new Speaker();
    private stopped: boolean = false;
    private worker: Worker = new Worker('/js/voiceWorker.js');

    constructor() {
        this.registerEvents();
    }

    requestUpdate() {
        this.worker.postMessage({
            messageType: MessageType.Request
        });
    }

    //Setup the select list options
    setVoiceOptions() {
        let select = this.getSelect();
        //clear out any existing options
        while (select.options.length > 0) {
            select.options.remove(0);
        }
        let voices = this.speaker.getVoices();
        if (voices.length < 1) setTimeout(() => this.setVoiceOptions(), 0);
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
        this.worker.addEventListener('message', ev => this.refreshQueues(ev.data as IDbMessage));
        let clear = document.getElementById('clear') as HTMLButtonElement;
        clear.addEventListener('click', ev => this.clearBox(ev));
        let submit = document.getElementById('submit') as HTMLButtonElement;
        submit.addEventListener('click', ev => this.addUtterance(ev))
        this.speaker.addEventListener('speaking', ev => console.log('speaking', ev));
        this.speaker.addEventListener('stoppedSpeaking', ev => this.sayNext(ev));
        this.speaker.addEventListener('paused', ev => console.log('paused', ev));
        this.speaker.addEventListener('cancelled', ev => console.log('cancelled', ev));
        this.speaker.addEventListener('resumed', ev => console.log('resumed', ev));
        let pause = document.getElementById('pause');
        pause.addEventListener('click', ev => this.pauseSpeaker());
        let stop = document.getElementById('stop');
        stop.addEventListener('click', ev => this.toggleStopped());
        let play = document.getElementById('play');
        play.addEventListener('click', ev => this.toggleStopped());
    }

    /**Add a new statement to the queue */
    addUtterance(ev: MouseEvent) {
        ev.preventDefault();
        let textArea = this.getBox();
        let text = textArea.value;
        this.clearBox(ev);
        let statement = new Statement(
            -1,
            text,
            this.selectedVoice.name,
            this.selectedVoice.lang,
        )
        this.queue.push(statement);
        if (this.speaker.free)
            this.sayNext();
    }

    /**Refresh the data in the queue and discard arrays */
    refreshQueues(data: IDbMessage) {
        this.discard = data.completed;
        this.queue = data.queued;
        this.refreshLists();
    }

    /** Refresh the two lists of statements*/
    refreshLists() {
        let discarded = document.getElementById('completed-statements');
        Html.clearElement(discarded);
        for (let statement of this.discard) {
            let el = Html.completedStatement(
                statement,
                s => this.removeStatement(s),
                s => this.requeue(s)
            );
            discarded.appendChild(el);
        }
        let queue = document.getElementById('queued-statements');
        Html.clearElement(queue);
        for (let statement of this.queue) {
            let el = Html.queuedStatement(
                statement,
                s => this.removeStatement(s),
            );
            queue.appendChild(el);
        }
    }

    removeStatement(statement: Statement) {
        let s = new Statement(
            statement.id,
            statement.text,
            statement.voiceName,
            statement.voiceLang,
            statement.lastSpoken
        )
        let msg: IVoiceMessage = {
            messageType: MessageType.Remove,
            statements: [s]
        }
        this.worker.postMessage(msg);
    }
    /**Attempt to say the next item in the queue */
    sayNext(ev: Event = null) {
        if (this.queue.length < 1) return;
        let s = this.queue.shift();
        this.speaker.speak(s.toUtterance());
        let msg: IVoiceMessage = {
            messageType: MessageType.Update,
            statements: [new Statement(
                s.id,
                s.text,
                s.voiceName,
                s.voiceLang,
                new Date(),
            )]
        }
        this.worker.postMessage(msg)
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

    requeue(statement: Statement) {
        let s = new Statement(
            statement.id,
            statement.text,
            statement.voiceName,
            statement.voiceLang
        );
        let msg: IVoiceMessage = {
            statements: [s],
            messageType: MessageType.Update
        };
        this.worker.postMessage(msg);
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
            this.sayNext();
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