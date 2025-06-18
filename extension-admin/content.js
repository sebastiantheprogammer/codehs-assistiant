// Content script for CodeHS Assistant Admin
console.log('CodeHS Assistant Admin content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractAssignment") {
        // Add your assignment extraction logic here
        sendResponse({status: "success"});
    }
    if (request.action === 'verifyCode') {
        chrome.runtime.sendMessage({ action: 'verifyCode', code: request.code }, response => {
            if (response.success) {
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: response.error });
            }
        });
        return true;
    }
    return true;
}); 