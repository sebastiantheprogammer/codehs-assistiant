// Background script for CodeHS Assistant Admin
console.log('CodeHS Assistant Admin background script loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkStatus") {
        sendResponse({status: "active"});
    }

    if (request.action === 'generateCode') {
        fetch('http://localhost:3000/api/generate-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, code: data.code });
        })
        .catch(error => {
            console.error('Error generating code:', error);
            sendResponse({ success: false, error: 'Error generating code' });
        });
        return true;
    }

    if (request.action === 'verifyCode') {
        fetch('http://localhost:3000/api/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: request.code })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true });
        })
        .catch(error => {
            console.error('Error verifying code:', error);
            sendResponse({ success: false, error: 'Error verifying code' });
        });
        return true;
    }
}); 