import { CefrLevel, Choice, Episode, SpeechEvaluation, Turn } from '../types';

interface EvaluateSpeechParams {
  userSpokenText: string;
  currentTurn: Turn;
  episode: Episode;
}

export async function evaluateUserSpeech({
  userSpokenText,
  currentTurn,
  episode,
}: EvaluateSpeechParams): Promise<SpeechEvaluation> {
  const bestChoice = currentTurn.choices.find(c => c.isBest) || currentTurn.choices[0];

  // 1. Try server-side Gemini evaluation first
  try {
    const res = await fetch('/api/evaluate-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userSpokenText,
        npcDialogue: currentTurn.npcDialogue,
        contextNote: currentTurn.contextNote,
        npcName: episode.npc.name,
        npcRole: episode.npc.role,
        targetCefr: episode.targetCefr,
        turnNumber: currentTurn.turnNumber,
        episodeTitle: episode.titleKo,
        referenceBestChoice: bestChoice,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.evaluation && data.evaluation.feedbackTitle) {
        return {
          cefrLevel: (data.evaluation.cefrLevel || 'B2') as CefrLevel,
          isBest: Boolean(data.evaluation.isBest),
          affinityChange: Number(data.evaluation.affinityChange ?? 10),
          feedbackTitle: data.evaluation.feedbackTitle,
          feedbackDetail: data.evaluation.feedbackDetail || '',
          strengths: data.evaluation.strengths || '',
          improvements: data.evaluation.improvements || '',
          npcReactionDialogue: data.evaluation.npcReactionDialogue || bestChoice.npcReactionDialogue,
          npcReactionDialogueKo: data.evaluation.npcReactionDialogueKo || bestChoice.npcReactionDialogueKo,
          npcReactionMood: data.evaluation.npcReactionMood || 'neutral',
          nativePolish: data.evaluation.nativePolish || bestChoice.text,
          nativePolishKo: data.evaluation.nativePolishKo || bestChoice.textKo,
        };
      }
    }
  } catch (err) {
    console.warn('Backend speech evaluation unavailable, utilizing local AI heuristic evaluator:', err);
  }

  // 2. Intelligent local heuristic evaluator fallback
  return evaluateLocally(userSpokenText, currentTurn, episode, bestChoice);
}

function evaluateLocally(
  userSpokenText: string,
  currentTurn: Turn,
  episode: Episode,
  bestChoice: Choice
): SpeechEvaluation {
  const lower = userSpokenText.toLowerCase();
  const wordCount = userSpokenText.trim().split(/\s+/).length;

  // Key negotiation terms check
  const c1BusinessKeywords = [
    'agility', 'integrated', 'turnaround', 'defect', 'de-risk', 'inventory', 'overhead',
    'concession', 'compromise', 'scale', 'economies', 'halfway', 'commitment', 'tenable',
    'liquidated', 'damages', 'penalty', 'cap', 'ceiling', 'grace', 'reciprocal', 'benchmarks',
    'exclusivity', 'threshold', 'quota', 'convert', 'preferred', 'draw-down',
    'working capital', 'advance', 'deposit', 'bill of lading', 'transition', 'mitigate',
    'contingent', 'leverage', 'differentiator', 'margin'
  ];

  const diplomaticPhrases = [
    'understand', 'recognize', 'that said', 'however', 'could we', 'we would agree',
    'propose', 'delighted', 'respect', 'align', 'prepared to', 'partnership'
  ];

  const bluntOrNegativeTerms = [
    'garbage', 'fake', 'cheap', 'crazy', 'insult', 'no discount', 'impossible',
    'don\'t care', 'bad for', 'take it or leave', 'free bank', 'no way'
  ];

  let c1Hits = 0;
  for (const kw of c1BusinessKeywords) {
    if (lower.includes(kw)) c1Hits++;
  }

  let diplomaticHits = 0;
  for (const phr of diplomaticPhrases) {
    if (lower.includes(phr)) diplomaticHits++;
  }

  let bluntHits = 0;
  for (const bl of bluntOrNegativeTerms) {
    if (lower.includes(bl)) bluntHits++;
  }

  // Check similarity with pre-authored choices
  let bestChoiceMatch = bestChoice;
  let highestOverlap = 0;

  for (const choice of currentTurn.choices) {
    const choiceWords = choice.text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const userWords = lower.split(/\W+/).filter(w => w.length > 3);
    const overlap = choiceWords.filter(w => userWords.includes(w)).length;
    if (overlap > highestOverlap) {
      highestOverlap = overlap;
      bestChoiceMatch = choice;
    }
  }

  // Scoring logic
  let cefrLevel: CefrLevel = 'B1';
  let isBest = false;
  let affinityChange = 5;
  let feedbackTitle = '기본적인 의사는 전달되었으나 전략적 비즈니스 어휘가 더 필요합니다.';
  let feedbackDetail = '상대방의 입장을 고려한 완곡 화법이나 구체적인 반대급부 제안을 보강하면 훨씬 강력한 설득력을 갖출 수 있습니다.';
  let strengths = '상대방의 요구에 적극적으로 반응하며 의사를 표현했습니다.';
  let improvements = '단순 동의나 거절을 넘어 조건부 양보와 업계 전문 용어를 활용해 보세요.';
  let npcReactionMood: any = 'neutral';
  let npcReactionDialogue = bestChoiceMatch.npcReactionDialogue;
  let npcReactionDialogueKo = bestChoiceMatch.npcReactionDialogueKo;

  if (bluntHits > 0) {
    cefrLevel = wordCount < 10 ? 'A2' : 'B1';
    affinityChange = -20;
    feedbackTitle = '⚠️ 직설적이거나 감정적인 어조로 협상 주도권을 잃을 수 있습니다.';
    feedbackDetail = '비즈니스 협상에서는 감정적 단어("cheap", "crazy", "garbage") 대신 객관적인 규격과 리스크 관리 관점으로 접근해야 합니다.';
    strengths = '자신의 단호한 입장이나 주장을 솔직하게 밝혔습니다.';
    improvements = '공격적인 어조를 피하고 상호 윈윈을 유도하는 완곡한 외교적 화법을 연습해 보세요.';
    npcReactionMood = 'annoyed';
    npcReactionDialogue = "That's a rather blunt counter. In enterprise procurement, we need structured proposals, not emotional pushback.";
    npcReactionDialogueKo = "다소 직설적인 반론이군요. 대기업 구매 협상에서는 감정적 반발이 아니라 체계적인 대안이 필요합니다.";
  } else if (c1Hits >= 2 || (diplomaticHits >= 2 && wordCount >= 20) || highestOverlap >= 5) {
    cefrLevel = 'C1';
    isBest = true;
    affinityChange = 20;
    feedbackTitle = '🎯 탁월한 C1급 전략적 협상술과 세련된 프로페셔널 화법!';
    feedbackDetail = '상대방의 고민(원가, 리스크, 납기)에 깊이 공감하면서도 자사의 핵심 가치와 조건을 지켜낸 최상급 비즈니스 영어입니다.';
    strengths = '전문 비즈니스 어휘와 상대방을 존중하는 세련된 프레이밍을 훌륭하게 구사했습니다.';
    improvements = '완벽합니다! 이 정도 뉘앙스라면 글로벌 유통사 중역 회의실에서도 충분히 신뢰를 얻을 수 있습니다.';
    npcReactionMood = 'impressed';
    npcReactionDialogue = bestChoice.npcReactionDialogue;
    npcReactionDialogueKo = bestChoice.npcReactionDialogueKo;
  } else if (c1Hits >= 1 || diplomaticHits >= 1 || wordCount >= 12) {
    cefrLevel = 'B2';
    isBest = false;
    affinityChange = 10;
    feedbackTitle = '✨ 정중하고 명확한 B2급 비즈니스 소통입니다.';
    feedbackDetail = '문법과 격식은 잘 갖추어졌으나, 바이어가 더 매력적으로 느낄 만한 레버리지(규모의 경제, 상한선 설정 등)를 얹어주면 완벽합니다.';
    strengths = '격식 있는 태도로 상대방과 대화를 이어갔습니다.';
    improvements = '양보 시 반드시 반대급부 조건을 결합하는 전략적 협상 문장 구조를 더 다듬어 보세요.';
    npcReactionMood = 'neutral';
    npcReactionDialogue = "I hear your point. Let's see if we can align on specific contractual parameters around that.";
    npcReactionDialogueKo = "말씀하신 취지는 이해했습니다. 그에 관한 구체적인 계약 조건들을 조율해 볼 수 있는지 살펴보죠.";
  } else {
    cefrLevel = wordCount < 6 ? 'A2' : 'B1';
    isBest = false;
    affinityChange = 0;
    feedbackTitle = '💡 문장이 다소 짧거나 교과서적인 표현 위주입니다.';
    feedbackDetail = '글로벌 비즈니스 대화에서는 한두 문장으로 끝내기보다 배경 설명과 대안을 함께 제시하는 것이 좋습니다.';
    strengths = '질문의 핵심을 파악하고 간단하게 답했습니다.';
    improvements = '제시된 힌트 키워드를 참고하여 문장을 1~2개 더 풍성하게 연결해 보세요.';
    npcReactionMood = 'neutral';
  }

  return {
    cefrLevel,
    isBest,
    affinityChange,
    feedbackTitle,
    feedbackDetail,
    strengths,
    improvements,
    npcReactionDialogue,
    npcReactionDialogueKo,
    npcReactionMood,
    nativePolish: bestChoice.text,
    nativePolishKo: bestChoice.textKo,
  };
}
