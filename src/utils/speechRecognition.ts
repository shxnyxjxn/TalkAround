/**
 * Browser Web Speech API interface wrapper for voice recording & STT
 */

// Define Web Speech API types if not fully declared in TS env
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindow;
      const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        try {
          this.recognition = new SpeechRecognitionConstructor();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';
          this.recognition.maxAlternatives = 1;
        } catch (e) {
          console.warn('Speech recognition could not be initialized:', e);
        }
      }
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public start(callbacks: {
    onInterim?: (text: string) => void;
    onResult: (finalText: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.isSupported()) {
      callbacks.onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    try {
      const win = window as unknown as IWindow;
      const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      let accumulatedFinal = '';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedFinal += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (interimText && callbacks.onInterim) {
          callbacks.onInterim((accumulatedFinal + interimText).trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errMsg = 'Speech recognition error occurred';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errMsg = 'Microphone permission was denied. Please allow microphone access or type your response.';
        } else if (event.error === 'no-speech') {
          errMsg = 'No speech was detected. Please try speaking closer to the microphone.';
        }
        callbacks.onError?.(errMsg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onResult(accumulatedFinal.trim());
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      this.isListening = false;
      callbacks.onError?.(e?.message || 'Failed to start speech recognition');
      return false;
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  public getListeningState(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
