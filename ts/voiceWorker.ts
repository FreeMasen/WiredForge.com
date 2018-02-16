import {Statement, IVoiceMessage, MessageType, IDbMessage} from './voice/models';
import Data from './voice/data';

let data = new Data();
addEventListener('message', async ev => {
    console.log('message', ev);
    let message: IVoiceMessage = ev.data;
    switch (message.messageType) {
        case MessageType.Add:
        case MessageType.Update:
        console.log('upserting', message.statements.length, 'statements');
            for (let s of message.statements) {
                console.log('statement', s);
                await data.upsertStatement(s).then(() => {
                    console.log('statement, upserted');
                    sendUpdate();
                }).catch(e => {
                    console.log('error upserting', e);
                });
            }
        break;
        case MessageType.Remove:
            for (let s of message.statements) {
                await data.deleteStatement(s).then(() => {
                    console.log('statement deleted');
                    sendUpdate();
                }).catch(e => {
                    console.error('error removing', e);
                });
            }
        break;
        case MessageType.Request:
            sendUpdate();
        break;
    }
});

async function sendUpdate() {
    let update: IDbMessage = {
        queued: [],
        completed: []
    };
    update.completed = (await data.getSpoken()).map(s => s.toJson());
    update.queued = (await data.getUnspoken()).map(s => s.toJson());
    console.log('sending update', update);
    postMessage(update, null);
}

sendUpdate();