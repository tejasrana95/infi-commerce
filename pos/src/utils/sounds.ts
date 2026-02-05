// Sound utility for playing UI feedback sounds
let audioContext: AudioContext | null = null;

// Initialize audio context on first use
const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// Play a beep sound with specified frequency and duration
export const playBeep = (frequency: number = 800, duration: number = 100, volume: number = 0.3) => {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
        console.warn('Unable to play sound:', error);
    }
};

// Specific sound effects
export const sounds = {
    addToCart: () => playBeep(800, 100, 0.2), // Higher pitch, short
    removeFromCart: () => playBeep(400, 150, 0.2), // Lower pitch, slightly longer
    checkout: () => {
        // Play custom MP3 audio
        try {
            const audio = new Audio('/success_ding.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.warn('Unable to play checkout sound:', err));
        } catch (error) {
            console.warn('Unable to play checkout sound:', error);
        }
    },
    error: () => playBeep(300, 200, 0.25), // Low pitch, longer
    click: () => playBeep(1000, 50, 0.1), // Very short, high pitch
};

// Play sound conditionally based on settings
export const playSoundIfEnabled = (soundFn: () => void, isEnabled: boolean) => {
    if (isEnabled) {
        soundFn();
    }
};
