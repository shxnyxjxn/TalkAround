import { GoogleSheetRecord } from '../types';

const STORAGE_KEY_WEBAPP_URL = 'grade5_words_gas_webapp_url';
const STORAGE_KEY_RECORDS = 'grade5_words_sheet_records';

export const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxIrQc4-yR5-BA11Xy1jIL-175KuJO8Wj-hfqjP46SEBUCgsIVuBR-SiLuVxA07U-AxcQ/exec';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ====================================================================
 * [초등 5학년 영어 단어 게임] 구글 스프레드시트 자동 기록 스크립트
 * ====================================================================
 * 헤더 열 구성:
 * timestamp | name | play_count | correct_count | wrong_count | average_taps | sentence_tap_frequency
 * 
 * [1분 배포 가이드]
 * 1. 구글 스프레드시트 상단 메뉴 > [확장 프로그램] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트를 전체 복사하여 붙여넣기
 * 3. 오른쪽 위 파란색 [배포] 버튼 클릭 > [새 배포] 선택
 * 4. 톱니바퀴 아이콘 클릭 > [웹 앱] 선택
 *    - 설명: 초등 영단어 게임 & 문장별 탭 빈도/평균 연동
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자 (Anyone)' <-- 필수로 지정!
 * 5. [배포] 버튼 누르고 승인 완료 후 생성된 '웹 앱 URL'을 게임에 연결하세요!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // 시트에 데이터가 없으면 헤더(1행) 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "timestamp", 
        "name", 
        "play_count", 
        "correct_count", 
        "wrong_count", 
        "average_taps", 
        "sentence_tap_frequency"
      ]);
      
      // 헤더 스타일 꾸미기 (파란 배경, 흰색 볼드 글씨, 가운데 정렬)
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setBackground("#2563eb");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
    } else {
      // 기존 5열 시트인 경우 6, 7열 헤더 확장
      var lastCol = sheet.getLastColumn();
      if (lastCol <= 5) {
        sheet.getRange(1, 6).setValue("average_taps").setFontWeight("bold");
        sheet.getRange(1, 7).setValue("sentence_tap_frequency").setFontWeight("bold");
      }
    }

    var payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }

    var timestamp = payload.timestamp || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var name = payload.name || "익명 학생";
    var playCount = payload.play_count !== undefined ? Number(payload.play_count) : 1;
    var correctCount = payload.correct_count !== undefined ? Number(payload.correct_count) : 0;
    var wrongCount = payload.wrong_count !== undefined ? Number(payload.wrong_count) : 0;
    var averageTaps = payload.average_taps !== undefined ? Number(payload.average_taps) : 0;
    var sentenceSummary = payload.sentence_summary || payload.sentence_tap_frequency || "문장 탭 없음";

    // 1. 요약 메인 행 추가
    sheet.appendRow([
      timestamp, 
      name, 
      playCount, 
      correctCount, 
      wrongCount, 
      averageTaps, 
      sentenceSummary
    ]);

    // 2. 문장별 상세 데이터가 있을 경우 '문장별_탭_상세' 탭에도 자동 보조 기록
    if (payload.sentence_tap_details && Array.isArray(payload.sentence_tap_details) && payload.sentence_tap_details.length > 0) {
      var detailSheet = ss.getSheetByName("문장별_탭_상세");
      if (!detailSheet) {
        detailSheet = ss.insertSheet("문장별_탭_상세");
        detailSheet.appendRow(["timestamp", "name", "sentence", "tap_count", "average_taps"]);
        detailSheet.getRange(1, 1, 1, 5).setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");
      }
      for (var i = 0; i < payload.sentence_tap_details.length; i++) {
        var itm = payload.sentence_tap_details[i];
        detailSheet.appendRow([timestamp, name, itm.sentence, itm.taps, averageTaps]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "성공적으로 구글 시트에 저장되었습니다! (문장별 탭 빈도 & 평균 포함)",
      data: {
        timestamp: timestamp,
        name: name,
        play_count: playCount,
        correct_count: correctCount,
        wrong_count: wrongCount,
        average_taps: averageTaps,
        sentence_tap_frequency: sentenceSummary
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    title: "초등학교 5학년 영어 단어 게임 구글 시트 연동 웹앱",
    columns: ["timestamp", "name", "play_count", "correct_count", "wrong_count", "average_taps", "sentence_tap_frequency"],
    message: "Google Apps Script가 정상 동작 중입니다. POST로 데이터를 전송하세요.",
    serverTime: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Reads Google Apps Script Web App URL:
 * 1. Checks .env.local (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL)
 * 2. Checks import.meta.env.VITE_GOOGLE_SCRIPT_URL
 * 3. Checks localStorage
 * 4. Defaults to the user provided URL
 */
export function getSavedWebAppUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_WEBAPP_URL;

  const envUrl = 
    (import.meta as any).env?.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
    (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL ||
    '';

  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.trim();
  }

  const localSaved = localStorage.getItem(STORAGE_KEY_WEBAPP_URL);
  if (localSaved && localSaved.startsWith('http')) {
    return localSaved.trim();
  }

  return DEFAULT_WEBAPP_URL;
}

export function saveWebAppUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_WEBAPP_URL, url.trim());
}

export function getSavedRecords(): GoogleSheetRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: GoogleSheetRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save records to localStorage:', e);
  }
}

export function formatCurrentTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const mins = pad(now.getMinutes());
  const secs = pad(now.getSeconds());
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

export interface SyncPayload {
  timestamp: string;
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
  average_taps?: number;
  sentence_summary?: string;
  total_sentence_taps?: number;
  sentence_tap_details?: Array<{ sentence: string; taps: number }>;
}

export interface SyncResult {
  success: boolean;
  message: string;
}

/**
 * Sends game log and sentence tap frequency/average to Google Sheets
 */
export async function sendRecordToGoogleSheet(
  payload: SyncPayload,
  webAppUrl: string = getSavedWebAppUrl()
): Promise<SyncResult> {
  const targetUrl = webAppUrl || getSavedWebAppUrl() || DEFAULT_WEBAPP_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      success: false,
      message: '구글 시트 연동 웹앱 URL이 등록되지 않았습니다.',
    };
  }

  // 1. Try server proxy first to avoid any browser CORS / mixed-content restrictions
  try {
    const proxyRes = await fetch('/api/sync-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl: targetUrl, payload }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.success) {
        return {
          success: true,
          message: '구글 스프레드시트에 문장별 탭 빈도 및 평균이 성공적으로 저장되었습니다! ✅',
        };
      }
    }
  } catch (proxyError) {
    console.warn('Server proxy sync failed, trying direct browser fetch fallback:', proxyError);
  }

  // 2. Direct browser fetch with text/plain (GAS handles text/plain without preflight CORS issues)
  try {
    const directRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (directRes.ok) {
      return {
        success: true,
        message: '구글 스프레드시트에 성공적으로 저장되었습니다! ✅',
      };
    }
  } catch (directError) {
    // 3. Fallback to no-cors mode if strict browser policy applies
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: '구글 시트로 전송 요청을 완료했습니다 (no-cors). 시트에서 반영 여부를 확인해보세요!',
      };
    } catch (noCorsErr: any) {
      return {
        success: false,
        message: `전송 실패: ${noCorsErr?.message || '네트워크 오류가 발생했습니다.'}`,
      };
    }
  }

  return {
    success: false,
    message: '구글 시트 전송 중 응답을 받지 못했습니다.',
  };
}

/**
 * Tests connection with Google Apps Script Web App
 */
export async function testSheetConnection(url: string): Promise<SyncResult> {
  const testPayload: SyncPayload = {
    timestamp: formatCurrentTimestamp(),
    name: '🧪 연동 테스트',
    play_count: 1,
    correct_count: 1,
    wrong_count: 0,
    average_taps: 3.5,
    sentence_summary: '"Practice makes perfect!"(5회), "Our classroom is clean."(2회)',
    total_sentence_taps: 7,
    sentence_tap_details: [
      { sentence: 'Practice makes perfect!', taps: 5 },
      { sentence: 'Our classroom is clean.', taps: 2 },
    ],
  };

  return sendRecordToGoogleSheet(testPayload, url);
}

/**
 * Exports records as a clean CSV with all columns:
 * timestamp, name, play_count, correct_count, wrong_count, average_taps, sentence_summary
 */
export function exportRecordsToCSV(records: GoogleSheetRecord[], filename: string = 'english_game_records.csv') {
  const headers = ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count', 'average_taps', 'sentence_summary'];
  const rows = records.map(r => [
    `"${r.timestamp}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    r.play_count,
    r.correct_count,
    r.wrong_count,
    r.average_taps !== undefined ? r.average_taps : 0,
    `"${(r.sentence_summary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
