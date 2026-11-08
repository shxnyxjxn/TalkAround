import { SentenceTapItem, SentenceTapStats } from '../types';

const STORAGE_KEY_SENTENCE_TAPS = 'grade5_sentence_taps_v1';

class SentenceTapTracker {
  private taps: Record<string, SentenceTapItem> = {};
  private sessionTaps: Record<string, SentenceTapItem> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SENTENCE_TAPS);
      if (raw) {
        this.taps = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load sentence taps:', e);
      this.taps = {};
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SENTENCE_TAPS, JSON.stringify(this.taps));
    } catch (e) {
      console.warn('Failed to save sentence taps:', e);
    }
  }

  /**
   * Record a tap on an English sentence (listening to audio, viewing hint, practicing)
   */
  public recordTap(sentenceEn: string, sentenceKo?: string, category?: string): SentenceTapStats {
    const key = sentenceEn.trim();
    if (!key) return this.getStats();

    const now = new Date().toISOString();

    // Update cumulative
    if (!this.taps[key]) {
      this.taps[key] = {
        sentence: key,
        sentenceKo: sentenceKo || '',
        category: category || 'general',
        tapCount: 1,
        lastTappedAt: now,
      };
    } else {
      this.taps[key].tapCount += 1;
      this.taps[key].lastTappedAt = now;
      if (sentenceKo && !this.taps[key].sentenceKo) {
        this.taps[key].sentenceKo = sentenceKo;
      }
    }

    // Update current session
    if (!this.sessionTaps[key]) {
      this.sessionTaps[key] = {
        sentence: key,
        sentenceKo: sentenceKo || '',
        category: category || 'general',
        tapCount: 1,
        lastTappedAt: now,
      };
    } else {
      this.sessionTaps[key].tapCount += 1;
      this.sessionTaps[key].lastTappedAt = now;
    }

    this.saveToStorage();
    return this.getStats();
  }

  /**
   * Get stats for cumulative or current session
   */
  public getStats(useSessionOnly: boolean = false): SentenceTapStats {
    const source = useSessionOnly ? this.sessionTaps : this.taps;
    const items = { ...source };
    const list = Object.values(items);

    const totalTaps = list.reduce((sum, item) => sum + item.tapCount, 0);
    const uniqueSentencesCount = list.length;
    const averageTaps = uniqueSentencesCount > 0 
      ? Number((totalTaps / uniqueSentencesCount).toFixed(2)) 
      : 0;

    let topSentence: SentenceTapItem | undefined = undefined;
    if (list.length > 0) {
      topSentence = [...list].sort((a, b) => b.tapCount - a.tapCount)[0];
    }

    return {
      items,
      totalTaps,
      uniqueSentencesCount,
      averageTaps,
      topSentence,
    };
  }

  /**
   * Formats sentence tap frequencies into a concise string for Google Sheet cells
   * e.g. "Practice makes perfect!(5회), Our classroom is very clean and bright.(3회)"
   */
  public formatSummaryString(useSessionOnly: boolean = false): string {
    const stats = this.getStats(useSessionOnly);
    const list = Object.values(stats.items).sort((a, b) => b.tapCount - a.tapCount);
    if (list.length === 0) return '문장 탭 기록 없음';

    return list
      .slice(0, 15) // top 15 sentences to fit nicely in sheet cell
      .map(item => `"${item.sentence}"(${item.tapCount}회)`)
      .join(', ');
  }

  /**
   * Formats array of { sentence, taps }
   */
  public getDetailsArray(useSessionOnly: boolean = false): Array<{ sentence: string; taps: number }> {
    const stats = this.getStats(useSessionOnly);
    return Object.values(stats.items)
      .sort((a, b) => b.tapCount - a.tapCount)
      .map(i => ({ sentence: i.sentence, taps: i.tapCount }));
  }

  /**
   * Reset session taps for a new game
   */
  public resetSession() {
    this.sessionTaps = {};
  }

  /**
   * Reset all cumulative taps
   */
  public resetAll() {
    this.taps = {};
    this.sessionTaps = {};
    this.saveToStorage();
  }
}

export const sentenceTracker = new SentenceTapTracker();
