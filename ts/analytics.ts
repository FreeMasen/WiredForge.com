import * as analyst from '../../analytics/analytics';

window.addEventListener('load', () => {
    console.log('analytics.js', 'load');
    analyst.sendInfo();
    console.log('new line!')
});

window.addEventListener('DOMContentLoaded', () => {
    analyst.setup_click_watcher();
});

window.addEventListener('beforeunload', () => {
    console.log('analytics.js', 'before unload');
    analyst.sendExiting();

});