document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const solveBtn = document.getElementById('solveBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const statusDiv = document.getElementById('status');
    const apiKeyInput = document.getElementById('apiKey');
    const aiModelSelect = document.getElementById('aiModel');

    let currentAssignment = null;
    let currentSolution = null;

    // Load saved API key
    chrome.storage.local.get(['apiKey'], function(result) {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
    });

    // Save API key when changed
    apiKeyInput.addEventListener('change', function() {
        chrome.storage.local.set({ apiKey: apiKeyInput.value });
    });

    extractBtn.addEventListener('click', async function() {
        statusDiv.textContent = 'Extracting assignment...';
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
            
            currentAssignment = response;
            statusDiv.textContent = 'Assignment extracted successfully!';
        } catch (error) {
            statusDiv.textContent = 'Error extracting assignment: ' + error.message;
        }
    });

    solveBtn.addEventListener('click', async function() {
        if (!currentAssignment) {
            statusDiv.textContent = 'Please extract assignment first!';
            return;
        }

        statusDiv.textContent = 'Solving assignment...';
        
        try {
            const apiKey = apiKeyInput.value;
            const model = aiModelSelect.value;
            
            // Here you would make the API call to your chosen AI service
            // This is a placeholder for the actual API integration
            const solution = await solveWithAI(currentAssignment, model, apiKey);
            
            currentSolution = solution;
            statusDiv.textContent = 'Solution generated successfully!';
        } catch (error) {
            statusDiv.textContent = 'Error generating solution: ' + error.message;
        }
    });

    pasteBtn.addEventListener('click', async function() {
        if (!currentSolution) {
            statusDiv.textContent = 'Please generate solution first!';
            return;
        }

        statusDiv.textContent = 'Pasting solution...';
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'paste',
                solution: currentSolution
            });
            
            statusDiv.textContent = 'Solution pasted successfully!';
        } catch (error) {
            statusDiv.textContent = 'Error pasting solution: ' + error.message;
        }
    });
});

// Helper function to estimate tokens (rough estimate)
function estimateTokens(text) {
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
}

// ChatGPT API integration
async function solveWithAI(assignment, model, apiKey) {
    if (model === 'chatgpt') {
        try {
            const prompt = `Solve this programming assignment:\n\n${assignment.description}\n\nStarter code:\n${assignment.starterCode}\n\nLanguage: ${assignment.language}\n\nProvide only the complete code solution.`;
            const estimatedTokens = estimateTokens(prompt);
            
            console.log(`Estimated input tokens: ${estimatedTokens}`);
            console.log(`Estimated cost: $${(estimatedTokens * 0.0015 / 1000).toFixed(6)}`);

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
            console.log(`Actual total cost: $${((estimatedTokens + outputTokens) * 0.0015 / 1000).toFixed(6)}`);
            
            return data.choices[0].message.content;
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            throw new Error('Failed to generate solution: ' + error.message);
        }
    }
    // Add similar implementations for other AI models
    return "// Error: Selected AI model not implemented";
} 