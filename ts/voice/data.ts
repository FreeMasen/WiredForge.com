import Dexie from 'dexie';
import { Statement, IStatement } from './models'

export default class Data extends Dexie {
    private statements: Dexie.Table<IStatement, number>;
    constructor() {
        super('wired.forge.voice');
        this.version(1).stores({
            statements: '++id, text, voiceName, voiceLang, lastSpokenEpoch'
        });
    }

    async getAllStatements(): Promise<Array<Statement>> {
        return this.statements
                .toArray(list => this.mapStatements(list));
    }

    async getSpoken(): Promise<Array<Statement>> {
        return this.statements
                .where('lastSpokenEpoch')
                .above(-1)
                .toArray(list => this.mapStatements(list));
    }

    async getUnspoken(): Promise<Array<Statement>> {
        return this.statements
                .where('lastSpokenEpoch')
                .below(0)
                .toArray(list => this.mapStatements(list));
    }

    
    private mapStatements(list: Array<IStatement>): Array<Statement> {
        return list.map(s => Statement.fromJson(s))
        .sort((l, r) => l.id - r.id);
    }

    async upsertStatement(s: IStatement) {
        s.id = await this.statements.put(s)
    }

    async deleteStatement(s: IStatement) {
        let id = this.statements.delete(s.id);
    }
}