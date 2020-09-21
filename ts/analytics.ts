import { sendInfo, sendExiting, setup_click_watcher, initialResponseHandler, notifyUser, notificationNeeded } from '../../analytics/analytics';

window.addEventListener('load', () => {
    if (notificationNeeded()) {
        notifyUser();
    }
    sendInfo().then(initialResponseHandler);
    setup_click_watcher();
});

window.addEventListener('beforeunload', () => {
    sendExiting();
});