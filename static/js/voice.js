import {Statement} from '/js/voice/models.js';
import Html from '/js/voice/html.js';
import Speaker from '/js/voice/speaker.js';
import ErrorMessenger from '/js/services/errorMessenger.js';

window.addEventListener('DOMContentLoaded', () => {
    (window).syntheticVoice = new Voice();
    window.addEventListener('user-error', (ev) => {
        ErrorMessenger.displayError(ev.detail);
    });
});

class Voice {
    speaker = new Speaker();
    voices = {};
    constructor() {
        this.registerEvents();
    }

    setupVoices(iter) {
        let voices = this.speaker.getVoices();
        if (voices.length < 1) {
            if (!iter) {
                iter = 500;
            }
            if (iter > 3000) {
                ErrorMessenger.displayError('This browser does not support SpeechSynthesis')
            }
            return setTimeout(() => this.setupVoices(iter * 1.5), iter);
        }
        for (let voice of voices) {
            if (voice.default) {
                console.log("default voice found!", voice.name);
            }
            if (!this.voices[voice.lang]) {
                this.voices[voice.lang] = {
                    name: voice.lang,
                    voices: []
                };
            }
            let name = voice.name;
            let plusIndex = name.indexOf("+");
            if (plusIndex > -1) {
                this.voices[voice.lang].name = voice.name.substring(0, plusIndex);
                name = name.substring(plusIndex + 1);
            }
            this.voices[voice.lang].voices.push({
                voice,
                name
            });
        }
    }

    setupLangOptions() {
        this.setupVoices(500);
        let select = this.getLangSelect();
        while (select.options.length > 0) {
            select.options.remove(0);
        }
        for (let lang in this.voices) {
            let info = this.voices[lang];
            let opt = document.createElement("option");
            opt.setAttribute("value", lang);
            opt.innerHTML = info.name;
            select.options.add(opt);
        }
        select.value = navigator.language;
        this.setVoiceOptions(navigator.language);
    }

    /**Setup the select list options */
    setVoiceOptions(lang) {
        let voiceSelect = this.getVoiceSelect();
        //clear out any existing options
        while (voiceSelect.options.length > 0) {
            voiceSelect.options.remove(0);
        }
        let voices = (this.voices[lang] || { voices: [] }).voices;
        console.log(voices);
        for (let i = 0; i < voices.length; i++) {
            let voice = voices[i];
            let opt = document.createElement('option');
            opt.text = `${voice.name}`;
            voiceSelect.options.add(opt);
            opt.value = i.toString();
        }
    }

    registerEvents() {
        this.speaker.addEventListener('ready', () => this.setupLangOptions());
        let clear = document.getElementById('clear');
        clear.addEventListener('click', ev => this.clearBox(ev));
        let submit = document.getElementById('submit');
        submit.addEventListener('click', ev => this.sayUtterance(ev));
        let langSelect = this.getLangSelect();
        langSelect.addEventListener('change', (ev) => this.setVoiceOptions(ev.currentTarget.value))
    }

    /**Add a new statement to the queue */
    sayUtterance(ev) {
        ev.preventDefault();
        let textArea = this.getBox();
        let text = textArea.value;
        let voice = this.selectedVoice;
        let statement = new Statement(
            -1,
            text,
            voice.name,
            voice.lang,
        );
        this.speaker.speak(statement);
    }

    /**Get the voice based on the user's selection */
    get selectedVoice() {
        let langSelect = this.getLangSelect();
        let voiceSelect = this.getVoiceSelect();
        let lang;
        if (langSelect.value == '') {
            lang = this.voices[langSelect.value] || this.voices[navigator.language];
        } else {
            lang = this.voices[navigator.language];
        }
        if (voiceSelect.value != '') {
            let selection = parseInt(voiceSelect.value);
            return lang.voices[selection].voice;
        }
        return lang.voices[0].voice;
    }

    stop() {
        this.speaker.cancel();
        Html.addClass('#stop', 'pressed');
        Html.removeClass('#play', 'pressed');
    }

    clearBox(ev) {
        ev.preventDefault();
        let box = this.getBox();
        box.value = '';
    }

    getBox() {
        return document.getElementById('next-utter');
    }

    getVoiceSelect() {
        return document.getElementById('voice-selection');
    }
    getLangSelect() {
        return document.getElementById('lang-selection');
    }
}
