import { sendInfo, sendExiting, setup_click_watcher, initialResponseHandler } from '../../analytics/analytics';

window.addEventListener('load', () => {
    sendInfo().then(initialResponseHandler);
});

window.addEventListener('DOMContentLoaded', () => {
    setup_click_watcher();
});

window.addEventListener('beforeunload', () => {
    sendExiting();
});