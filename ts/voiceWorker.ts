import {Statement, IVoiceMessage, MessageType, IDbMessage} from './voice/models';
import Data from './voice/data';

let data = new Data();
addEventListener('message', async ev => {
    let message: IVoiceMessage = ev.data;
    switch (message.messageType) {
        case MessageType.Add:
            for (let s of message.statements) {
                await data.upsertStatement(s);
            }
        break;
        case MessageType.Remove:
            for (let s of message.statements) {
                await data.deleteStatement(s);
            }
        break;
        case MessageType.Update:
            for (let s of message.statements) {
                await data.upsertStatement(s);
            }
        break;
        case MessageType.Request:

        break;
    }
});

async function sendUpdate() {
    let update: IDbMessage = {
        queued: [],
        completed: []
    };
    update.queued = await data.getSpoken();
    update.completed = await data.getUnspoken();
    postMessage(update, null)
}

sendUpdate();