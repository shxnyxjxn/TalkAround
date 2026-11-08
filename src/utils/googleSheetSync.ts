import { GoogleSheetRecord } from '../types';

const STORAGE_KEY_WEBAPP_URL = 'talk_around_gas_webapp_url';
const STORAGE_KEY_RECORDS = 'talk_around_sheet_records';

export const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxIrQc4-yR5-BA11Xy1jIL-175KuJO8Wj-hfqjP46SEBUCgsIVuBR-SiLuVxA07U-AxcQ/exec';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ====================================================================
 * [토크어라운드 (Talk Around)] 구글 스프레드시트 학습 기록 자동 저장 스크립트
 * ====================================================================
 * 5개 헤더 열 구성 (A~E열):
 * A: timestamp | B: nickname | C: scenario_name | D: play_count | E: appropriateness_score
 * 
 * [1분 배포 가이드]
 * 1. 구글 스프레드시트 상단 메뉴 > [확장 프로그램] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트를 전체 복사하여 붙여넣기
 * 3. 오른쪽 위 파란색 [배포] 버튼 클릭 > [새 배포] 선택
 * 4. 톱니바퀴 아이콘 클릭 > [웹 앱] 선택
 *    - 설명: 토크어라운드 대화 적합도 시뮬레이션 기록 연동
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자 (Anyone)' <-- 필수!
 * 5. [배포] 버튼 누르고 생성된 '웹 앱 URL'을 게임의 [구글 시트 연동 설정]에 등록하세요!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // 시트에 데이터가 없으면 헤더(1행) 자동 생성 (A~E열)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["timestamp", "nickname", "scenario_name", "play_count", "appropriateness_score"]);
      
      // 헤더 스타일 꾸미기 (다크 테마 배경, 앰버 옐로우 텍스트, 중앙 정렬)
      var headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setBackground("#1c1917");
      headerRange.setFontColor("#f59e0b");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
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
    var nickname = payload.nickname || payload.name || "익명";
    var scenarioName = payload.scenario_name || "NYC 실전 회화 시뮬레이션";
    var playCount = payload.play_count !== undefined ? Number(payload.play_count) : 1;
    var appropriatenessScore = payload.appropriateness_score !== undefined ? payload.appropriateness_score : "100%";

    // 데이터 행 추가 (A~E열)
    sheet.appendRow([timestamp, nickname, scenarioName, playCount, appropriatenessScore]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "성공적으로 구글 시트에 기록되었습니다.",
      data: {
        timestamp: timestamp,
        nickname: nickname,
        scenario_name: scenarioName,
        play_count: playCount,
        appropriateness_score: appropriatenessScore
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
    title: "토크어라운드 (Talk Around) 대화 적합도 기록 웹앱",
    columns: ["timestamp", "nickname", "scenario_name", "play_count", "appropriateness_score"],
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

export function saveRecordLocally(record: GoogleSheetRecord): void {
  const current = getSavedRecords();
  saveRecords([record, ...current]);
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
  nickname: string;
  scenario_name: string;
  play_count: number;
  appropriateness_score: number | string;
}

export interface SyncResult {
  success: boolean;
  message: string;
}

/**
 * Sends simulation log to Google Sheets with the exact 5 keys:
 * timestamp, nickname, scenario_name, play_count, appropriateness_score
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

  const cleanPayload: SyncPayload = {
    timestamp: payload.timestamp || formatCurrentTimestamp(),
    nickname: payload.nickname || (payload as any).name || '익명',
    scenario_name: payload.scenario_name || 'NYC 실전 회화 시뮬레이션',
    play_count: Number(payload.play_count) || 1,
    appropriateness_score: payload.appropriateness_score !== undefined ? payload.appropriateness_score : '100%',
  };

  // 1. Try server proxy first to avoid any browser CORS / mixed-content restrictions
  try {
    const proxyRes = await fetch('/api/sync-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webAppUrl: targetUrl, payload: cleanPayload }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.success) {
        return {
          success: true,
          message: '구글 스프레드시트에 성공적으로 저장되었습니다! ✅',
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
      body: JSON.stringify(cleanPayload),
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
        body: JSON.stringify(cleanPayload),
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
    nickname: '테스트 학습자',
    scenario_name: '[캠퍼스] 카페 주문 시뮬레이션 (Sarah)',
    play_count: 1,
    appropriateness_score: '95%',
  };

  return sendRecordToGoogleSheet(testPayload, url);
}

/**
 * Exports records as a clean CSV with the exact 5 keys:
 * timestamp, nickname, scenario_name, play_count, appropriateness_score
 */
export function exportRecordsToCSV(records: GoogleSheetRecord[], filename: string = 'talk_around_records.csv') {
  const headers = ['timestamp', 'nickname', 'scenario_name', 'play_count', 'appropriateness_score'];
  const rows = records.map(r => [
    `"${r.timestamp}"`,
    `"${(r.nickname || '익명').replace(/"/g, '""')}"`,
    `"${(r.scenario_name || '').replace(/"/g, '""')}"`,
    r.play_count,
    `"${r.appropriateness_score}"`,
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
