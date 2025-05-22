// --- Text Generator Elements ---
const promptInput = document.getElementById('promptInput');
const generateTextButton = document.getElementById('generateTextButton');
const textButtonText = document.getElementById('textButtonText');
const textLoadingSpinner = document.getElementById('textLoadingSpinner');
const outputTextArea = document.getElementById('outputTextArea');
const copyButton = document.getElementById('copyButton');
const copyMessage = document.getElementById('copyMessage');
const textErrorMessage = document.getElementById('textErrorMessage');

// --- Image Generator Elements ---
const imagePromptInput = document.getElementById('imagePromptInput');
const generateImageButton = document.getElementById('generateImageButton');
const imageButtonText = document.getElementById('imageButtonText');
const imageLoadingSpinner = document.getElementById('imageLoadingSpinner');
const imageOutputArea = document.getElementById('imageOutputArea');
const generatedImage = document.getElementById('generatedImage');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const downloadImageButton = document.getElementById('downloadImageButton');
const imageErrorMessage = document.getElementById('imageErrorMessage');

// --- Text Generation Logic ---
generateTextButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();

    textErrorMessage.classList.add('hidden');
    outputTextArea.textContent = '';
    copyButton.classList.add('hidden');
    copyMessage.classList.add('hidden');

    if (!prompt) {
        textErrorMessage.textContent = 'Please enter a prompt before generating text.';
        textErrorMessage.classList.remove('hidden');
        return;
    }

    textButtonText.textContent = 'Generating...';
    textLoadingSpinner.classList.remove('hidden');
    generateTextButton.disabled = true;
    outputTextArea.textContent = 'Generating response... Please wait.';

    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas provides this at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const generatedText = result.candidates[0].content.parts[0].text;
            outputTextArea.textContent = generatedText;
            copyButton.classList.remove('hidden');
        } else {
            outputTextArea.textContent = 'No text generated. The AI might not have produced a valid response for this prompt.';
        }

    } catch (error) {
        console.error('Error generating text:', error);
        textErrorMessage.textContent = `Failed to generate text: ${error.message}. Please try again.`;
        textErrorMessage.classList.remove('hidden');
        outputTextArea.textContent = 'An error occurred while generating text.';
    } finally {
        textButtonText.textContent = 'Generate Text';
        textLoadingSpinner.classList.add('hidden');
        generateTextButton.disabled = false;
    }
});

// --- Copy to Clipboard Logic ---
copyButton.addEventListener('click', () => {
    const textToCopy = outputTextArea.textContent;
    if (textToCopy && textToCopy !== 'Your AI-generated text will appear here.' && textToCopy !== 'Generating response... Please wait.' && textToCopy !== 'No text generated. The AI might not have produced a valid response for this prompt.' && textErrorMessage.classList.contains('hidden')) {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand('copy');
            copyMessage.textContent = 'Copied to clipboard!';
            copyMessage.classList.remove('hidden');
            setTimeout(() => {
                copyMessage.classList.add('hidden');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            copyMessage.textContent = 'Failed to copy text. Please try again manually.';
            copyMessage.classList.remove('hidden');
            copyMessage.classList.add('text-red-600');
            setTimeout(() => {
                copyMessage.classList.add('hidden');
                copyMessage.classList.remove('text-red-600');
            }, 3000);
        } finally {
            document.body.removeChild(tempTextArea);
        }
    }
});

// --- Image Generation Logic ---
generateImageButton.addEventListener('click', async () => {
    const prompt = imagePromptInput.value.trim();

    imageErrorMessage.classList.add('hidden');
    generatedImage.classList.add('hidden');
    imagePlaceholder.classList.remove('hidden');
    generatedImage.src = ''; // Clear previous image
    downloadImageButton.classList.add('hidden'); // Hide download button initially

    if (!prompt) {
        imageErrorMessage.textContent = 'Please enter a prompt before generating an image.';
        imageErrorMessage.classList.remove('hidden');
        return;
    }

    imageButtonText.textContent = 'Generating...';
    imageLoadingSpinner.classList.remove('hidden');
    generateImageButton.disabled = true;
    imagePlaceholder.textContent = 'Generating image... Please wait.';

    try {
        const payload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1} };
        const apiKey = ""; // Canvas provides this at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response Data:', errorData); // Log the full error object for debugging
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData) || 'Unknown error'}`);
        }

        const result = await response.json();

        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
            generatedImage.src = imageUrl;
            generatedImage.classList.remove('hidden'); // Show the image
            imagePlaceholder.classList.add('hidden'); // Hide the placeholder
            downloadImageButton.classList.remove('hidden'); // Show the download button
        } else {
            imagePlaceholder.textContent = 'No image generated. The AI might not have produced a valid image for this prompt.';
            imagePlaceholder.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error generating image:', error); // Log the full error object for debugging
        let errorMessageText = 'An unknown error occurred.';

        if (error instanceof Error) {
            errorMessageText = `Failed to generate image: ${error.message}. Please try again.`;
        } else if (typeof error === 'object' && error !== null) {
            // Try to get a more specific message if it's an object
            if (error.error && error.error.message) {
                errorMessageText = `Failed to generate image: ${error.error.message}. Please try again.`;
            } else {
                // Fallback to stringifying the whole object if no specific message
                errorMessageText = `Failed to generate image: ${JSON.stringify(error)}. Please try again.`;
            }
        } else {
            errorMessageText = `Failed to generate image: ${String(error)}. Please try again.`;
        }

        imageErrorMessage.textContent = errorMessageText;
        imageErrorMessage.classList.remove('hidden');
        imagePlaceholder.textContent = 'An error occurred while generating image.';
        imagePlaceholder.classList.remove('hidden');
    } finally {
        imageButtonText.textContent = 'Generate Image';
        imageLoadingSpinner.classList.add('hidden');
        generateImageButton.disabled = false;
    }
});

// --- New: Image Download Logic ---
downloadImageButton.addEventListener('click', () => {
    const imageUrl = generatedImage.src;
    if (imageUrl && imageUrl !== '') {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = 'generated_image.png'; // Default filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
