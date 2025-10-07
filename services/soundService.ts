// A self-contained sound service using the Web Audio API to generate sounds programmatically.

type SoundType = 'move' | 'select' | 'emphasis' | 'uiclick' | 'startAmbient' | 'stopAmbient' | 'crypticFlash' | 'jumpscare' | 'jumpscare_short' | 'startHeartbeat' | 'stopHeartbeat';

let audioContext: AudioContext | null = null;
let mainGain: GainNode | null = null;
let ambientOscillator: OscillatorNode | null = null;
let heartbeatSource: AudioBufferSourceNode | null = null;
let isInitialized = false;

const init = (): boolean => {
  if (isInitialized) return true;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return false;
    
    audioContext = new AudioContext();
    // Resume context on user gesture if it's suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    mainGain = audioContext.createGain();
    mainGain.connect(audioContext.destination);
    isInitialized = true;
    return true;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.", e);
    return false;
  }
};

const playSound = (type: SoundType) => {
  if (!audioContext || !mainGain) return;
  if (audioContext.state === 'suspended') {
      audioContext.resume();
  }

  const now = audioContext.currentTime;

  switch (type) {
    case 'move': {
      const bufferSize = audioContext.sampleRate * 0.2; // 0.2 second buffer
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      source.connect(gainNode).connect(mainGain);
      source.start(now);
      source.stop(now + 0.2);
      break;
    }
    case 'select': {
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gainNode).connect(mainGain);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
    case 'emphasis': {
      const osc1 = audioContext.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, now);

      const osc2 = audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(221.5, now);

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc1.connect(gainNode).connect(mainGain);
      osc2.connect(gainNode).connect(mainGain);
      osc1.start(now);
      osc1.stop(now + 1);
      osc2.start(now);
      osc2.stop(now + 1);
      break;
    }
    case 'uiclick': {
        const osc = audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
  
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  
        osc.connect(gainNode).connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
    }
    case 'crypticFlash': {
      const osc = audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.1);

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gainNode).connect(mainGain);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }
    case 'jumpscare': {
      const bufferSize = audioContext.sampleRate * 10; // 10 second buffer
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.7, now); // LOUD and sudden
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 9.5);
      
      source.connect(gainNode).connect(mainGain);
      source.start(now);
      source.stop(now + 10);
      break;
    }
    case 'jumpscare_short': {
      const bufferSize = audioContext.sampleRate * 1; // 1 second buffer
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.7, now); // LOUD and sudden
      
      source.connect(gainNode).connect(mainGain);
      source.start(now);
      source.stop(now + 1);
      break;
    }
    case 'startAmbient': {
      if (ambientOscillator) return; // Already playing
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.015, now + 2); // Fade in

      ambientOscillator = audioContext.createOscillator();
      ambientOscillator.type = 'sine';
      ambientOscillator.frequency.setValueAtTime(55, now);
      
      ambientOscillator.connect(gainNode).connect(mainGain);
      ambientOscillator.start(now);
      break;
    }
    case 'stopAmbient': {
      if (ambientOscillator && mainGain) {
        // This is tricky as oscillators can't be paused. We stop the current one.
        // It will be recreated on the next 'startAmbient' call.
        ambientOscillator.stop(now);
        ambientOscillator = null;
      }
      break;
    }
    case 'startHeartbeat': {
        if (heartbeatSource || !audioContext) return;
        const bpm = 150;
        const beatDuration = 60 / bpm; // 0.4s
        const bufferSize = audioContext.sampleRate * beatDuration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        const createThump = (startSample: number, frequency: number, volume: number) => {
            const thumpDuration = 0.1 * audioContext.sampleRate; // 100ms
            for (let i = 0; i < thumpDuration; i++) {
                if (startSample + i >= bufferSize) break;
                const time = i / audioContext.sampleRate;
                const envelope = Math.exp(-time * 25); // Exponential decay
                const sample = Math.sin(2 * Math.PI * frequency * time) * volume * envelope;
                data[startSample + i] += sample;
            }
        };
        
        createThump(0, 60, 0.8);
        createThump(Math.floor(0.18 * audioContext.sampleRate), 55, 0.5);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.4, now);
        
        source.connect(gainNode).connect(mainGain);
        source.start(now);
        heartbeatSource = source;
        break;
    }
    case 'stopHeartbeat': {
        if (heartbeatSource) {
            heartbeatSource.stop(now);
            heartbeatSource = null;
        }
        break;
    }
  }
};

const setMuted = (isMuted: boolean) => {
  if (mainGain && audioContext) {
    const value = isMuted ? 0 : 1;
    mainGain.gain.setValueAtTime(value, audioContext.currentTime);
  }
};


export const soundService = {
  init,
  play: playSound,
  setMuted,
};