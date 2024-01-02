import { Statement } from "/js/voice/models.js";

export default class Speaker {
    _speaker = window.speechSynthesis;
    handlers = new Map();
    statement;
    constructor() {
        if (this._speaker.onvoiceschanged) {
            this._speaker.addEventListener('voiceschanged', ev => this.dispatchEvent(ev));
        } else {

        }
        this.addEventListener('stoppedSpeaking', ev => this.statement = null);
        this.watchVoices();
    }

    manualGetVoices(ct = 0) {
        let voices = this.getVoices();
        if (ct > 5) {
            return this.dispatchEvent(this.getEvent('error'));
        }
        if (voices.length < 1) {
            let newCt = ct + 1;
            setTimeout(() => this.manualGetVoices(newCt), 1000 * newCt);
        } else {
            this.dispatchEvent(this.getEvent('ready'));
        }
    }

    watchVoices() {
        if (this.ready) return this.dispatchEvent(new Event('ready'));
        setTimeout(() => this.watchVoices(), 0);
    }

    get ready() {
        let voices = this._speaker.getVoices();
        return voices.length > 0;
    }

    addEventListener(event, handler) {
        let existingList = this.handlers.get(event);
        if (!existingList) {
            existingList = [];
        }
        existingList.push(handler);
        this.handlers.set(event, existingList);
        if (event == 'ready' && this.ready) this.dispatchEvent(this.getEvent('ready'));
    }

    removeEventListener(event, handler) {
        let existingList = this.handlers.get(event);
        if (!existingList) return;
        let index = existingList.findIndex(f => f == handler);
        if (index < 0) return;
        existingList.splice(index, 1);
        this.handlers.set(event, existingList);
    }

    dispatchEvent(ev) {
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

    speak(statement) {
        this.statement = statement;
        let ev = this.getEvent('speaking');
        this.dispatchEvent(ev);
        this._speaker.speak(statement.toUtterance());
        this.watchSpeaker();
    }

    watchSpeaker() {
        if (this._speaker.speaking || this._speaker.pending)
            return setTimeout(() => this.watchSpeaker(), 0);
        this.dispatchEvent(this.getEvent('stoppedSpeaking'));
    }

    pause() {
        this.dispatchEvent(this.getEvent('paused'));
        this._speaker.pause();
    }

    resume() {
        this.dispatchEvent(this.getEvent('resumed'));
        this._speaker.resume();
    }
    cancel() {
        this.dispatchEvent(this.getEvent('cancelled'));
        this.statement = null;
        this._speaker.cancel();
    }

    getVoices() {
        return this._speaker.getVoices();
    }

    get paused() {
        return this._speaker.paused;
    }

    get speaking() {
        return this._speaker.speaking;
    }

    get pending() {
        return this._speaker.pending;
    }

    get free() {
        return !this._speaker.pending &&
                !this._speaker.paused &&
                !this._speaker.speaking;
    }

    getEvent(eventType) {
        return new CustomEvent(eventType, {detail: this.statement});
    }

}
