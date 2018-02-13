export interface IStatement {
    id?: number;
    text: string;
    voiceName: string;
    voiceLang: string;
    lastSpokenEpoch?: number;
}
export class Statement implements IStatement {
    constructor(
        public id: number = -1,
        public text: string,
        public voiceName: string,
        public voiceLang: string,
        public lastSpoken?: Date,
    ) {}

    static fromJson(json: IStatement): Statement {
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

    toJson(): IStatement {
        return {
            id: this.id > -1 ? this.id : undefined,
            text: this.text,
            voiceName: this.voiceName,
            voiceLang: this.voiceLang,
            lastSpokenEpoch: this.lastSpoken.valueOf()
        }
    }

    toUtterance(): SpeechSynthesisUtterance {
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