/**
 * Discord Voice Messages Extension
 * Core logic for recording and sending voice messages in Discord Web.
 */

// --- Constants & Configuration ---
const CONFIG = {
    BUTTON_ID: 'discord-voice-msg-btn',
    ICONS: {
        MIC: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`,
        STOP: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`
    },
    MIME_TYPES: [
        'audio/ogg; codecs=opus',
        'audio/ogg',
        'audio/webm; codecs=opus',
        'audio/webm'
    ],
    SELECTORS: {
        TEXT_AREA_CONTAINER: '[class^="channelTextArea_"]',
        BUTTONS_CONTAINER: '[class^="buttons_"]',
        FILE_INPUT: 'input[type="file"][class^="fileInput_"], input[type="file"]',
        TEXT_BOX: '[role="textbox"]'
    }
};

// --- State Management ---
let state = {
    mediaRecorder: null,
    audioChunks: [],
    audioContext: null,
    analyser: null,
    animationFrameId: null,
    currentStream: null,
    isRecording: false
};

// --- Initialization ---

/**
 * Injects the voice message button into the Discord UI.
 */
function injectVoiceButton() {
    if (document.getElementById(CONFIG.BUTTON_ID)) return;

    const channelTextArea = document.querySelector(CONFIG.SELECTORS.TEXT_AREA_CONTAINER);
    if (!channelTextArea) return;

    const buttonsContainer = channelTextArea.querySelector(CONFIG.SELECTORS.BUTTONS_CONTAINER);
    if (!buttonsContainer) return;

    const btn = document.createElement('button');
    btn.id = CONFIG.BUTTON_ID;
    btn.innerHTML = CONFIG.ICONS.MIC;
    btn.className = 'voice-msg-button';
    btn.title = 'Record Voice Message';

    btn.onclick = async () => {
        if (!state.isRecording) {
            await startRecording(btn);
        } else {
            stopRecording(btn);
        }
    };

    buttonsContainer.insertBefore(btn, buttonsContainer.firstChild);
}

// --- Recording Logic ---

/**
 * Starts audio recording and initializes the volume visualizer.
 */
async function startRecording(btn) {
    try {
        state.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.isRecording = true;
        
        setupVisualizer(btn);

        const selectedMimeType = CONFIG.MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type)) || '';
        state.mediaRecorder = new MediaRecorder(state.currentStream, selectedMimeType ? { mimeType: selectedMimeType } : {});
        state.audioChunks = [];

        state.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                state.audioChunks.push(event.data);
            }
        };

        state.mediaRecorder.onstop = async () => {
            const mimeType = state.mediaRecorder.mimeType || 'audio/ogg; codecs=opus';
            const audioBlob = new Blob(state.audioChunks, { type: mimeType });
            await uploadToDiscord(audioBlob);
        };

        state.mediaRecorder.start();
        btn.classList.add('recording');
        btn.innerHTML = CONFIG.ICONS.STOP;
    } catch (err) {
        console.error('Failed to start recording:', err);
        alert('Could not access microphone. Please check your permissions.');
        cleanupState(btn);
    }
}

/**
 * Stops the current recording session.
 */
function stopRecording(btn) {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }
    cleanupState(btn);
}

// --- Visualizer & Cleanup ---

/**
 * Sets up the Web Audio API visualizer for the recording animation.
 */
function setupVisualizer(btn) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
    const source = state.audioContext.createMediaStreamSource(state.currentStream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    source.connect(state.analyser);

    const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    let smoothedVolume = 0;
    
    function animate() {
        if (!state.analyser) return;
        state.analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Map volume to animation values
        const targetVolume = Math.min(1.5, average / 50); 
        smoothedVolume = smoothedVolume * 0.8 + targetVolume * 0.2;
        
        const scale = 1 + (smoothedVolume * 0.15);
        const glow = smoothedVolume * 15;
        const spread = smoothedVolume * 30;
        
        btn.style.transform = `scale(${scale})`;
        btn.style.boxShadow = `0 0 ${glow}px #ed4245, 0 0 ${spread}px rgba(237, 66, 69, 0.4)`;
        
        state.animationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

/**
 * Cleans up recording state and stops microphone tracks.
 */
function cleanupState(btn) {
    state.isRecording = false;

    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    if (state.audioContext) state.audioContext.close();
    
    if (state.currentStream) {
        state.currentStream.getTracks().forEach(track => track.stop());
        state.currentStream = null;
    }
    
    state.analyser = null;
    state.audioContext = null;
    
    btn.classList.remove('recording');
    btn.innerHTML = CONFIG.ICONS.MIC;
    btn.style.transform = '';
    btn.style.boxShadow = '';
}

// --- Discord Integration ---

/**
 * Uploads the recorded audio blob to Discord's file input.
 */
async function uploadToDiscord(blob) {
    const fileInput = document.querySelector(CONFIG.SELECTORS.FILE_INPUT);
    
    if (fileInput) {
        // We use .ogg extension as it's better supported by Discord's voice message feature
        const file = new File([blob], 'voice-message.ogg', { type: 'audio/ogg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Trigger change event so Discord processes the file
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Refocus the text box
        const textArea = document.querySelector(CONFIG.SELECTORS.TEXT_BOX);
        if (textArea) textArea.focus();
    } else {
        console.error('Discord file input not found');
        alert('Could not find Discord upload button. Please ensure attachments are allowed in this channel.');
    }
}

// --- Main Execution ---

// Observe DOM changes to re-inject button when navigating
const observer = new MutationObserver(() => injectVoiceButton());
observer.observe(document.body, { childList: true, subtree: true });

// Initial injection
injectVoiceButton();
