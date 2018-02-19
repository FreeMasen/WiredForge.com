import {Statement, IVoiceMessage, MessageType, IDbMessage} from './voice/models';
import Data from './voice/data';

let data = new Data();
addEventListener('message', async ev => {
    let message: IVoiceMessage = ev.data;
    switch (message.messageType) {
        case MessageType.Add:
        case MessageType.Update:
            for (let s of message.statements) {
                await data.upsertStatement(s).then(() => {
                    sendUpdate();
                }).catch(e => {
                    console.error('error upserting', e);
                });
            }
        break;
        case MessageType.Remove:
            for (let s of message.statements) {
                await data.deleteStatement(s).then(() => {
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
addEventListener('messageerror', ev => {
    console.error('messageerror', ev);
});

async function sendUpdate() {
    let update: IDbMessage = {
        queued: [],
        completed: []
    };
    update.completed = (await data.getSpoken()).map(s => s.toJson());
    update.queued = (await data.getUnspoken()).map(s => s.toJson());
    postMessage(update);
}

sendUpdate();