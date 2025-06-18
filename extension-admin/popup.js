document.addEventListener('DOMContentLoaded', async () => {
    const extractBtn = document.getElementById('extractBtn');
    const solveBtn = document.getElementById('solveBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const status = document.getElementById('status');
    const apiKeyInput = document.getElementById('apiKey');
    const generateCodeBtn = document.getElementById('generateCodeBtn');
    const viewCodesBtn = document.getElementById('viewCodesBtn');
    const generatedCode = document.getElementById('generatedCode');

    // New API Key Management Elements
    const apiKeyProvider = document.getElementById('apiKeyProvider');
    const apiKeyType = document.getElementById('apiKeyType');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeysList = document.getElementById('apiKeysList');

    // Load saved API key (this part might become obsolete or change once backend is fully integrated)
    const { apiKey } = await chrome.storage.local.get('apiKey');
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }

    // Save API key when changed (this part might become obsolete or change once backend is fully integrated)
    apiKeyInput.addEventListener('change', async () => {
        await chrome.storage.local.set({ apiKey: apiKeyInput.value });
    });

    // Function to render API keys from the backend
    async function renderApiKeys() {
        try {
            const response = await fetch('http://localhost:3000/api/keys');
            if (response.ok) {
                const keys = await response.json();
                apiKeysList.innerHTML = ''; // Clear existing list
                if (keys.length === 0) {
                    apiKeysList.innerHTML = '<p>No API keys configured yet.</p>';
                    return;
                }
                const ul = document.createElement('ul');
                ul.style.listStyle = 'none';
                ul.style.padding = '0';
                ul.style.marginTop = '15px';

                keys.forEach(key => {
                    const li = document.createElement('li');
                    li.style.background = 'rgba(0, 0, 0, 0.2)';
                    li.style.padding = '10px';
                    li.style.borderRadius = '8px';
                    li.style.marginBottom = '8px';
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';

                    li.innerHTML = `
                        <div>
                            <strong>${key.provider}:</strong> ${key.apiKey.substring(0, 5)}... (${key.type})
                        </div>
                        <button class="delete-key-btn" data-id="${key.id}" style="background: #ff4d4d; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
                    `;
                    ul.appendChild(li);
                });
                apiKeysList.appendChild(ul);

                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-key-btn').forEach(button => {
                    button.addEventListener('click', async (event) => {
                        const keyId = event.target.dataset.id;
                        try {
                            const deleteResponse = await fetch(`http://localhost:3000/api/keys/${keyId}`, {
                                method: 'DELETE'
                            });
                            if (deleteResponse.ok) {
                                status.textContent = 'API key deleted.';
                                renderApiKeys(); // Re-render the list
                            } else {
                                throw new Error('Failed to delete API key');
                            }
                        } catch (error) {
                            status.textContent = 'Error deleting API key';
                            console.error('Delete API key error:', error);
                        }
                    });
                });

            } else {
                throw new Error('Failed to fetch API keys');
            }
        } catch (error) {
            status.textContent = 'Error loading API keys';
            console.error('API Key fetch error:', error);
        }
    }

    // Event listener for saving API key
    saveApiKeyBtn.addEventListener('click', async () => {
        const provider = apiKeyProvider.value;
        const apiKey = apiKeyInput.value;
        const type = apiKeyType.value;

        if (!apiKey) {
            status.textContent = 'API Key cannot be empty.';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider, apiKey, type })
            });

            if (response.ok) {
                status.textContent = `${provider} API key saved successfully!`;
                apiKeyInput.value = ''; // Clear input
                renderApiKeys(); // Re-render the list
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save API key');
            }
        } catch (error) {
            status.textContent = 'Error saving API key';
            console.error('Save API key error:', error);
        }
    });

    // Initial render of API keys
    renderApiKeys();

    // Generate activation code
    generateCodeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:3000/api/generate-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                generatedCode.textContent = `Generated Code: ${data.code}`;
                generatedCode.style.display = 'block';
            } else {
                throw new Error('Failed to generate code');
            }
        } catch (error) {
            status.textContent = 'Error generating code';
            console.error('Code generation error:', error);
        }
    });

    // View active codes
    viewCodesBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:3000/api/active-codes');
            if (response.ok) {
                const data = await response.json();
                const codesList = data.codes.map(code => 
                    `Code: ${code.code} - Expires: ${new Date(code.expiryDate).toLocaleDateString()}`
                ).join('\n');
                generatedCode.textContent = codesList;
                generatedCode.style.display = 'block';
            } else {
                throw new Error('Failed to fetch codes');
            }
        } catch (error) {
            status.textContent = 'Error fetching active codes';
            console.error('Code fetch error:', error);
        }
    });

    // Extract assignment
    extractBtn.addEventListener('click', async () => {
        status.textContent = 'Extracting assignment...';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractAssignment
            });
            status.textContent = 'Assignment extracted successfully!';
        } catch (error) {
            status.textContent = 'Error extracting assignment';
            console.error('Extraction error:', error);
        }
    });

    // Solve assignment
    solveBtn.addEventListener('click', async () => {
        status.textContent = 'Solving assignment...';
        try {
            const { apiKey } = await chrome.storage.local.get('apiKey');
            // Add your solving logic here
            status.textContent = 'Assignment solved!';
        } catch (error) {
            status.textContent = 'Error solving assignment';
            console.error('Solving error:', error);
        }
    });

    // Paste solution
    pasteBtn.addEventListener('click', async () => {
        status.textContent = 'Pasting solution...';
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: pasteSolution
            });
            status.textContent = 'Solution pasted successfully!';
        } catch (error) {
            status.textContent = 'Error pasting solution';
            console.error('Pasting error:', error);
        }
    });
});

// Content script functions
function extractAssignment() {
    // Add your assignment extraction logic here
    console.log('Extracting assignment...');
}

function pasteSolution() {
    // Add your solution pasting logic here
    console.log('Pasting solution...');
} 