// Audio Manager for CircuPlay - Retro 8-bit Sound Effects
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
        this.sounds = {};
        
        this.init();
    }
    
    // Initialize audio context and create sounds
    init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('🔊 AudioManager initialized');
            
            // Resume audio context on user interaction (required by browser policies)
            this.setupUserInteraction();
            
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.enabled = false;
        }
    }
    
    // Setup user interaction to resume audio context
    setupUserInteraction() {
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('🔊 Audio context resumed');
                });
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
    }
    
    // Generate 8-bit style beep sound
    playBeep(frequency = 440, duration = 0.1, type = 'square') {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Create envelope for retro sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.warn('Failed to play beep:', error);
        }
    }
    
    // Component placement sound
    playPlaceComponent() {
        this.playBeep(800, 0.1, 'square');
    }
    
    // Switch toggle sound
    playSwitch() {
        // Two-tone switch sound
        this.playBeep(300, 0.05, 'square');
        setTimeout(() => {
            this.playBeep(600, 0.05, 'square');
        }, 50);
    }
    
    // LED activation sound
    playLEDOn() {
        this.playBeep(1200, 0.15, 'sine');
    }
    
    // Error sound
    playError() {
        this.playBeep(150, 0.3, 'sawtooth');
    }
    
    // Success sound
    playSuccess() {
        // Ascending arpeggio
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playBeep(freq, 0.2, 'triangle');
            }, index * 100);
        });
    }
    
    // Power activation sound
    playPowerOn() {
        this.playBeep(220, 0.3, 'square');
        setTimeout(() => {
            this.playBeep(440, 0.2, 'square');
        }, 150);
    }
    
    // Circuit clear sound
    playClear() {
        // Descending sweep
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    // Buzzer sound
    playBuzzer() {
        this.playBeep(880, 0.2, 'square'); // Classic buzzer frequency
    }
    
    // Button click sound
    playClick() {
        this.playBeep(1000, 0.05, 'square');
    }
    
    // Hover sound
    playHover() {
        this.playBeep(600, 0.03, 'triangle');
    }
    
    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
    }
    
    // Toggle audio on/off
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.playClick();
        }
        return this.enabled;
    }
    
    // Get current state
    getState() {
        return {
            enabled: this.enabled,
            volume: this.volume,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable'
        };
    }
}

// Global audio manager instance
window.audioManager = new AudioManager();

console.log('🔊 Audio system loaded');