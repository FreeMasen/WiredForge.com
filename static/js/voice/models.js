
export class Statement {
    constructor(
        id = -1,
        text,
        voiceName,
        voiceLang,
        lastSpoken,
    ) {
        this.id = id;
        this.text = text;
        this.voiceName = voiceName;
        this.voiceLang = voiceLang;
        this.lastSpoken = lastSpoken;
    }

    static fromJson(json) {
        let lastSpoken = json.lastSpokenEpoch &&
                        json.lastSpokenEpoch > -1 ?
                        new Date(json.lastSpokenEpoch) :
                        null;
        return new Statement(
            json.id,
            json.text,
            json.voiceName,
            json.voiceLang,
            lastSpoken
        );
    }

    toJson() {
        let json = {
            text: this.text,
            voiceName: this.voiceName,
            voiceLang: this.voiceLang,
            lastSpokenEpoch: this.lastSpoken ?
                        this.lastSpoken.valueOf() :
                        -1
        }

        if (this.id > -1)
            json.id = this.id;
        return json;
    }

    toUtterance() {
        let ret = new SpeechSynthesisUtterance(this.text);
        let filtered = speechSynthesis.getVoices()
                .filter(v => v.name == this.voiceName 
                            && v.lang == this.voiceLang);
        if (filtered.length > 0) {
            ret.voice = filtered[0];
        }
        return ret;
    }
}



export const MessageType = Object.freeze({
    Add: 'Add',
    Remove: 'Remove',
    Update: 'Update',
    Request: 'Request',
})
