import { Statement } from "./models";

export type EventHandler = (ev: Event) => void;
export type SpeakerEvent = 'ready' | 'voiceschanged' | 'speaking' | 'stoppedSpeaking' | 'paused' | 'resumed' | 'cancelled';

export default class Speaker {
    private _speaker: SpeechSynthesis = window.speechSynthesis;
    private handlers = new Map<string, Array<EventHandler>>();
    public statement: Statement;
    constructor() {
        this._speaker.addEventListener('voiceschanged', ev => this.dispatchEvent(ev));
        this.addEventListener('stoppedSpeaking', ev => this.statement = null);
        this.watchVoices();
    }

    private watchVoices() {
        if (this.ready) return this.dispatchEvent(new Event('ready'));
        setTimeout(() => this.watchVoices(), 0);
    }

    private get ready(): boolean {
        let voices = this._speaker.getVoices();
        return voices.length > 0;
    }

    public addEventListener(event: string, handler: EventHandler) {
        let existingList = this.handlers.get(event);
        if (!existingList) {
            existingList = [];
        }
        existingList.push(handler);
        this.handlers.set(event, existingList);
        if (event == 'ready' && this.ready) this.dispatchEvent(this.getEvent('ready'));
    }

    public removeEventListener(event: SpeakerEvent, handler: EventHandler) {
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

    public speak(statement: Statement) {
        this.statement = statement;
        let ev = this.getEvent('speaking');
        this.dispatchEvent(ev);
        this._speaker.speak(statement.toUtterance());
        this.watchSpeaker();
    }

    private watchSpeaker() {
        if (this._speaker.speaking || this._speaker.pending)
            return setTimeout(() => this.watchSpeaker(), 0);
        this.dispatchEvent(this.getEvent('stoppedSpeaking'));
    }

    public pause() {
        this.dispatchEvent(this.getEvent('paused'));
        this._speaker.pause();
    }

    public resume() {
        this.dispatchEvent(this.getEvent('resumed'));
        this._speaker.resume();
    }
    public cancel() {
        this.dispatchEvent(this.getEvent('cancelled'));
        this.statement = null;
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

    private getEvent(eventType: string): Event {
        return new CustomEvent(eventType, {detail: this.statement});
    }

}