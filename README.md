# discord-voice-messages

A browser extension that allows you to send voice messages in the Discord web application, similar to the mobile experience.

## Features

- **Native Integration**: Adds a microphone button directly to the Discord message bar.
- **Real-time Visualization**: High-quality "liquid" animation that reacts to your voice volume while recording.
- **Cross-Browser Support**: Works on both Google Chrome and Mozilla Firefox.
- **High Quality Audio**: Captures audio using the Opus codec and sends it as an `.ogg` file for the best compatibility with Discord's voice message system.
- **Seamless Upload**: Automatically injects the recorded message into Discord's upload system once finished.

## Installation

### Google Chrome / Brave / Edge
1. Download or clone this repository (`discord-voice-messages`) to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked** and select the folder containing the extension files.

### Mozilla Firefox
1. Download or clone this repository to your local machine.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select any file in the extension folder (e.g., `manifest.json`).

## How to Use

1. Open Discord in your web browser.
2. Go to any text channel or DM.
3. Click the **Microphone (🎤)** icon located at the right side of the message input area.
4. Speak your message! You will see a red glow reacting to your voice.
5. Click the **Stop (🔴)** icon to finish recording.
6. The audio file will be automatically added to the message bar. Press **Enter** to send it!

## Project Structure

- `assets/icons/`: Contains extension icons and the original logo.
- `content.js`: Main logic for UI injection, audio recording, and visual effects.
- `content.css`: Styles for the voice button and animations.
- `manifest.json`: Extension configuration.

## Technical Details

- Uses **Web Audio API** (`AudioContext`, `AnalyserNode`) for real-time voice analysis.
- Uses **MediaRecorder API** for capturing high-quality audio.
- Compatible with **Manifest V3**.


