// Function to extract assignment details
function extractAssignment() {
    const assignmentText = document.querySelector('.assignment-description')?.textContent || '';
    const codeEditor = document.querySelector('.ace_editor')?.env?.editor?.getValue() || '';
    const language = document.querySelector('.language-selector')?.value || 'python';
    
    return {
        description: assignmentText,
        starterCode: codeEditor,
        language: language
    };
}

// Function to simulate typing
function simulateTyping(element, text) {
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    
    // Clear existing content
    element.value = '';
    element.dispatchEvent(inputEvent);
    
    // Type each character with random delay
    let i = 0;
    function typeNextChar() {
        if (i < text.length) {
            element.value += text[i];
            element.dispatchEvent(inputEvent);
            i++;
            setTimeout(typeNextChar, Math.random() * 100 + 50); // Random delay between 50-150ms
        } else {
            element.dispatchEvent(changeEvent);
        }
    }
    typeNextChar();
}

// Function to paste solution
function pasteSolution(solution) {
    const editor = document.querySelector('.ace_editor')?.env?.editor;
    if (editor) {
        // Get the textarea element
        const textarea = editor.container.querySelector('textarea');
        if (textarea) {
            simulateTyping(textarea, solution);
        }
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'extract':
            const assignment = extractAssignment();
            sendResponse(assignment);
            break;
        case 'paste':
            pasteSolution(request.solution);
            sendResponse({ success: true });
            break;
    }
    return true;
}); 