import {Statement, IVoiceMessage, MessageType, IDbMessage} from './voice/models';
import Data from './voice/data';

let data = new Data();
addEventListener('message', async ev => {
    let message: IVoiceMessage = ev.data;
    switch (message.messageType) {
        case MessageType.Add:
        case MessageType.Update:
            for (let s of message.statements) {
                await data.upsertStatement(s);
            }
            sendUpdate(message.messageType);
        break;
        case MessageType.Remove:
            for (let s of message.statements) {
                await data.deleteStatement(s)
                sendUpdate(message.messageType);
            }
        break;
        case MessageType.Request:
            sendUpdate(message.messageType);
        break;
    }
});
addEventListener('messageerror', ev => {
    console.error('messageerror', ev);
});

async function sendUpdate(messageType: MessageType) {
    let update: IDbMessage = {
        messageType,
        queued: [],
        completed: []
    };
    update.completed = (await data.getSpoken()).map(s => s.toJson());
    update.queued = (await data.getUnspoken()).map(s => s.toJson());
    postMessage(update);
}

sendUpdate(MessageType.Request);