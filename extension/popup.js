document.addEventListener('DOMContentLoaded', async () => {
    const setupSection = document.getElementById('setup-section');
    const mainSection = document.getElementById('main-section');
    const apiKeyInput = document.getElementById('apiKey');
    const activationCodeInput = document.getElementById('activationCode');
    const activateBtn = document.getElementById('activateBtn');
    const setupStatus = document.getElementById('setup-status');
    const timerDisplay = document.getElementById('timer');
    const extractBtn = document.getElementById('extractBtn');
    const solveBtn = document.getElementById('solveBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const status = document.getElementById('status');
    const aiModelSelect = document.getElementById('aiModel');

    let currentAssignment = null;
    let currentSolution = null;

    // Check if extension is activated
    const isActivated = await checkActivation();
    if (isActivated) {
        showMainSection();
        startTimer();
    } else {
        showSetupSection();
    }

    // Load saved API key and activation code
    chrome.storage.local.get(['apiKey', 'activationCode', 'expiryDate'], function(result) {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.activationCode) {
            activationCodeInput.value = result.activationCode;
        }
    });

    // Save API key when changed
    apiKeyInput.addEventListener('change', function() {
        chrome.storage.local.set({ apiKey: apiKeyInput.value });
    });

    // Activation button click handler
    activateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const activationCode = activationCodeInput.value.trim();

        if (!apiKey || !activationCode) {
            setupStatus.textContent = 'Please enter both API key and activation code';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activationCode })
            });

            if (response.ok) {
                const data = await response.json();
                await chrome.storage.local.set({
                    apiKey,
                    activationCode,
                    expiryDate: data.expiryDate
                });
                showMainSection();
                startTimer();
            } else {
                setupStatus.textContent = 'Invalid activation code or API key';
            }
        } catch (error) {
            setupStatus.textContent = 'Error activating extension. Please try again.';
            console.error('Activation error:', error);
        }
    });

    // Timer functionality
    function startTimer() {
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    async function updateTimer() {
        const { expiryDate } = await chrome.storage.local.get('expiryDate');
        if (!expiryDate) {
            timerDisplay.textContent = 'Not activated';
            return;
        }

        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        const timeLeft = expiry - now;

        if (timeLeft <= 0) {
            timerDisplay.textContent = 'Subscription expired';
            showSetupSection();
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        timerDisplay.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    // Helper functions
    async function checkActivation() {
        const { apiKey, activationCode, expiryDate } = await chrome.storage.local.get(['apiKey', 'activationCode', 'expiryDate']);
        if (!apiKey || !activationCode || !expiryDate) return false;
        
        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        return now < expiry;
    }

    function showSetupSection() {
        setupSection.classList.add('active');
        mainSection.classList.remove('active');
    }

    function showMainSection() {
        setupSection.classList.remove('active');
        mainSection.classList.add('active');
    }

    // Existing functionality
    extractBtn.addEventListener('click', async () => {
        status.textContent = 'Extracting assignment...';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractAssignment,
                args: [tab.url] // Pass current URL if needed by content script
            });
            // Listen for message from content script with extracted assignment
            chrome.runtime.onMessage.addListener(function listener(request) {
                if (request.action === "assignmentExtracted") {
                    currentAssignment = request.assignmentData;
                    status.textContent = 'Assignment extracted successfully!';
                    chrome.runtime.onMessage.removeListener(listener); // Remove listener after receiving data
                }
            });

            // Inject content script to extract assignment if not already injected
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js'] // Inject content.js if it's not already there
            }).then(() => {
                // Send message to content script to extract assignment
                chrome.tabs.sendMessage(tab.id, { action: "extractAssignment" });
            }).catch(err => console.error('Failed to inject content script:', err));

        } catch (error) {
            status.textContent = 'Error extracting assignment';
            console.error('Extraction error:', error);
        }
    });

    solveBtn.addEventListener('click', async () => {
        if (!currentAssignment) {
            status.textContent = 'Please extract assignment first!';
            return;
        }

        status.textContent = 'Solving assignment...';
        
        try {
            const model = aiModelSelect.value;
            const apiKey = apiKeyInput.value;
            
            if (!apiKey) {
                status.textContent = 'Please enter your API key in the setup section!';
                return;
            }

            const solution = await solveWithAI(currentAssignment, model, apiKey);
            
            currentSolution = solution;
            status.textContent = 'Solution generated successfully!';
        } catch (error) {
            status.textContent = 'Error generating solution: ' + error.message;
            console.error('Solving error:', error);
        }
    });

    pasteBtn.addEventListener('click', async () => {
        if (!currentSolution) {
            status.textContent = 'Please generate solution first!';
            return;
        }

        status.textContent = 'Pasting solution...';
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: pasteSolution,
                args: [currentSolution]
            });
            
            status.textContent = 'Solution pasted successfully!';
        } catch (error) {
            status.textContent = 'Error pasting solution: ' + error.message;
            console.error('Pasting error:', error);
        }
    });
});

// Content script functions
function extractAssignment() {
    // This function runs in the context of the content script
    // Add your assignment extraction logic here
    console.log('Extracting assignment...');

    // Example of sending extracted data back to popup.js
    const assignmentData = {
        description: document.querySelector('#problem-description')?.innerText || '',
        starterCode: document.querySelector('#code-editor')?.innerText || '',
        language: 'javascript' // You might need to dynamically determine this
    };
    chrome.runtime.sendMessage({ action: "assignmentExtracted", assignmentData });

}

function pasteSolution(solution) {
    // This function runs in the context of the content script
    // Add your solution pasting logic here
    console.log('Pasting solution...', solution);
    const codeEditor = document.querySelector('#code-editor'); // Example selector
    if (codeEditor) {
        codeEditor.innerText = solution; // Or use a more appropriate method for CodeHS editor
    }
}

// Helper function to estimate tokens (rough estimate)
function estimateTokens(text) {
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
}

// AI API integration
async function solveWithAI(assignment, model, apiKey) {
    const prompt = `Solve this programming assignment:\n\n${assignment.description}\n\nStarter code:\n${assignment.starterCode}\n\nLanguage: ${assignment.language}\n\nProvide only the complete code solution.`;
    const estimatedTokens = estimateTokens(prompt);
    console.log(`Estimated input tokens: ${estimatedTokens}`);

    switch (model) {
        case 'chatgpt':
            console.log(`Estimated cost (ChatGPT): $${(estimatedTokens * 0.0015 / 1000).toFixed(6)}`);
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are a programming expert. Provide only the code solution without any explanations or markdown formatting."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Response:', errorText);
                    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }

                const data = await response.json();
                const outputTokens = data.usage.completion_tokens;
                console.log(`Actual output tokens: ${outputTokens}`);
                console.log(`Actual total cost (ChatGPT): $${((estimatedTokens + outputTokens) * 0.0015 / 1000).toFixed(6)}`);
                
                return data.choices[0].message.content;
            } catch (error) {
                console.error('ChatGPT API Error:', error);
                throw error;
            }

        case 'gemini':
            console.log(`Estimated cost (Gemini): Consult Google AI pricing`);
            try {
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                });

                if (!geminiResponse.ok) {
                    const errorText = await geminiResponse.text();
                    console.error('Gemini API Response:', errorText);
                    throw new Error(`Gemini API request failed: ${geminiResponse.status} ${geminiResponse.statusText}\n${errorText}`);
                }

                const geminiData = await geminiResponse.json();
                // Gemini response might have candidate[0].content.parts[0].text
                return geminiData.candidates[0].content.parts[0].text;
            } catch (error) {
                console.error('Gemini API Error:', error);
                throw error;
            }

        case 'deepseek':
            console.log(`Estimated cost (Deepseek): Consult Deepseek pricing`);
            try {
                const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat", // or "deepseek-coder"
                        messages: [
                            { role: "system", content: "You are a programming expert. Provide only the code solution without any explanations or markdown formatting."},
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });

                if (!deepseekResponse.ok) {
                    const errorText = await deepseekResponse.text();
                    console.error('Deepseek API Response:', errorText);
                    throw new Error(`Deepseek API request failed: ${deepseekResponse.status} ${deepseekResponse.statusText}\n${errorText}`);
                }

                const deepseekData = await deepseekResponse.json();
                return deepseekData.choices[0].message.content;
            } catch (error) {
                console.error('Deepseek API Error:', error);
                throw error;
            }

        default:
            throw new Error('Unknown AI model selected.');
    }
} 