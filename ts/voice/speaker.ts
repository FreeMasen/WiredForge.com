export type EventHandler = (ev: Event) => void;
export type SpeakerEvent = 'ready' | 'voiceschanged' | 'speaking' | 'stoppedSpeaking' | 'paused' | 'resumed' | 'cancelled';

export default class Speaker {
    private _speaker: SpeechSynthesis = window.speechSynthesis;
    private handlers = new Map<string, Array<EventHandler>>();
    constructor() {
        this._speaker.addEventListener('voiceschanged', ev => this.dispatchEvent(ev))
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
        if (event == 'ready' && this.ready) this.dispatchEvent(new Event('ready'));
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