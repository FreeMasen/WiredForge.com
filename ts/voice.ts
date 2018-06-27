import {Statement, IDbMessage, IVoiceMessage, MessageType} from './voice/models';
import Html from './voice/html';
import Speaker from './voice/speaker';
let voice: Voice;

window.addEventListener('DOMContentLoaded', () => {
console.log('', );
    voice = new Voice();
});

class Voice {
    private queue: Array<Statement> = [];
    private discard: Array<Statement> = [];
    private speaker: Speaker = new Speaker();
    private stopped: boolean = false;
    private worker: Worker = new Worker('/js/voiceWorker.js');

    constructor() {
    console.log('constructor', );
        this.registerEvents();
        this.requestUpdate();
    }

    /** Request an update from the WebWorker */
    requestUpdate() {
    console.log('requestUpdate', );
        this.worker.postMessage({
            messageType: MessageType.Request
        });
    }

    /**Setup the select list options */
    setVoiceOptions() {
    console.log('setVoiceOptions', );
        let select = this.getSelect();
        //clear out any existing options
        while (select.options.length > 0) {
            select.options.remove(0);
        }
        let voices = this.speaker.getVoices();
        if (voices.length < 1) setTimeout(() => this.setVoiceOptions(), 0);
        console.log('setTimeout(', );
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
        console.log('registerEvents', );
        this.speaker.addEventListener('ready', () => this.setVoiceOptions());
        this.worker.addEventListener('message', ev => this.workerMessage(ev.data as IDbMessage));
        let clear = document.getElementById('clear') as HTMLButtonElement;
        clear.addEventListener('click', ev => this.clearBox(ev));
        let submit = document.getElementById('submit') as HTMLButtonElement;
        submit.addEventListener('click', ev => this.addUtterance(ev))
        this.speaker.addEventListener('stoppedSpeaking', ev => this.doneSpeaking(ev));
        let pause = document.getElementById('pause');
        pause.addEventListener('click', ev => this.pauseSpeaker());
        let stop = document.getElementById('stop');
        stop.addEventListener('click', ev => this.stop());
        let play = document.getElementById('play');
        play.addEventListener('click', ev => this.play());
    }

    workerMessage(msg: IDbMessage) {
        switch (msg.messageType) {
            case MessageType.Add:
                //if the speaker has no statement currently or the speakers statement isn't
                //in the queued list, refresh queues
                if (!this.speaker.statement || msg.queued.indexOf(this.speaker.statement) < 0) {
                    this.refreshQueues(msg);
                } 
            break;
            default:
                this.refreshQueues(msg);
            break;
        }
    }

    /**Add a new statement to the queue */
    addUtterance(ev: MouseEvent) {
        console.log('addUtterance');
        ev.preventDefault();
        let textArea = this.getBox();
        let text = textArea.value;
        this.clearBox(ev);
        let statement = new Statement(
            -1,
            text,
            this.selectedVoice.name,
            this.selectedVoice.lang,
        );
        this.worker.postMessage({
            messageType: MessageType.Add,
            statements: [statement.toJson()],
        });
        this.queue.push(statement);
        if (this.speaker.free && !this.stopped)
            this.sayNext();
    }

    /**Refresh the data in the queue and discard arrays */
    refreshQueues(data: IDbMessage) {
        this.discard = data.completed.map(s => Statement.fromJson(s));
        this.queue = data.queued.map(s => Statement.fromJson(s));
        this.refreshLists();
    }

    /** Refresh the two lists of statements*/
    refreshLists() {
    console.log('refreshLists', );
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
        console.log('removeStatement', statement);
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
    sayNext() {
        console.log('sayNext', );
        if (this.queue.length < 1 || !this.speaker.free) return;
        let s = this.queue.shift();
        this.speaker.speak(s);
    }

    /** */
    doneSpeaking(ev: Event) {
        console.log('doneSpeaking', ev);
        let s = (ev as CustomEvent).detail as Statement
        if (!s) return;
        s.lastSpoken = new Date();
        let msg: IVoiceMessage = {
            messageType: MessageType.Update,
            statements: [s.toJson()]
        }
        this.discard.push(s);
        this.worker.postMessage(msg);
        if (this.queue.length > 0 && !this.stopped) this.sayNext()
    }

    /**Get the voice based on the user's selection */
    get selectedVoice(): SpeechSynthesisVoice {
        console.log('selectedVoice', );
        let select = this.getSelect();
        let voices = this.speaker.getVoices();
        if (select.value != '') {
            let selection = parseInt(select.value);
            return voices[selection];
        }
        return voices[0];
    }

    requeue(statement: Statement) {
        console.log('requeue', statement);
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
        Html.addClass('#pause', 'pressed');
        Html.removeClass('#play', 'pressed');
    }
    
    resumeSpeaker() {
    console.log('resumeSpeaker', );
        this.speaker.resume();
        Html.addClass('#play', 'pressed');
        Html.removeClass('#pause', 'pressed');
    }

    toggleStopped() {
        this.stopped = !this.stopped;
        if (!this.stopped) {
            this.play();
        } else {
            this.stop();
        }
    }

    play() {
        Html.addClass('#play', 'pressed');
        Html.removeClass('#stop', 'pressed');
        this.sayNext();
    }

    stop() {
        Html.addClass('#stop', 'pressed');
        Html.removeClass('#play', 'pressed');
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