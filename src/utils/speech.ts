/**
 * Speech synthesis utility for native English listening & pronunciation practice
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    
    // Prefer American English native voices (e.g. Samantha, Google US English, Alex, Natural)
    const usVoices = this.voices.filter(v => v.lang.startsWith('en-US') || v.lang.startsWith('en_US'));
    const preferredVoice = usVoices.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Karen') ||
      v.name.includes('Alex')
    ) || usVoices[0] || this.voices.find(v => v.lang.startsWith('en')) || null;

    this.selectedVoice = preferredVoice;
  }

  public speak(
    text: string, 
    speed: number = 1.0,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): boolean {
    if (!this.synth || typeof window === 'undefined') {
      callbacks?.onError?.();
      return false;
    }

    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.7, Math.min(1.5, speed));
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onstart = () => {
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        callbacks?.onEnd?.();
        this.currentUtterance = null;
      };

      utterance.onerror = () => {
        callbacks?.onError?.();
        this.currentUtterance = null;
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      callbacks?.onError?.();
      return false;
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

export const speechService = new SpeechService();
