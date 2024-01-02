import Dexie from '/js/dexie.js';
import { Statement } from '/js/voice/models.js'

export default class Data extends Dexie {
    statements;
    constructor() {
        super('wired.forge.voice');
        this.version(1).stores({
            statements: '++id, text, voiceName, voiceLang, lastSpokenEpoch'
        });
    }

    async getAllStatements() {
        return this.statements
                .toArray(list => this.mapStatements(list));
    }

    async getSpoken() {
        return this.statements
                .where('lastSpokenEpoch')
                .above(-1)
                .toArray(list => this.mapStatements(list));
    }

    async getUnspoken() {
        return this.statements
                .where('lastSpokenEpoch')
                .below(0)
                .toArray(list => this.mapStatements(list));
    }

    
    mapStatements(list) {
        return list.map(s => Statement.fromJson(s))
        .sort((l, r) => l.id - r.id);
    }

    async upsertStatement(s) {
        s.id = await this.statements.put(s)
    }

    async deleteStatement(s) {
        let id = this.statements.delete(s.id);
    }
}
