// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('CodeHS Assistant installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiKey') {
        chrome.storage.local.get(['apiKey'], function(result) {
            sendResponse({ apiKey: result.apiKey });
        });
        return true;
    }
}); 