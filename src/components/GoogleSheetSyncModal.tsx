import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sheet, Play, Download, AlertCircle, Sparkles, RefreshCw, FileSpreadsheet, Info } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, getSavedWebAppUrl, saveWebAppUrl, testSheetConnection, exportRecordsToCSV, formatCurrentTimestamp } from '../utils/googleSheetSync';
import { GoogleSheetRecord, LearnerProfile } from '../types';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LearnerProfile;
  records: GoogleSheetRecord[];
  onRefreshRecords: () => void;
  onSaveUrl: (url: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  profile,
  records,
  onRefreshRecords,
  onSaveUrl,
}) => {
  const [webAppUrl, setWebAppUrl] = useState(getSavedWebAppUrl());
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'settings' | 'logs'>('settings');

  if (!isOpen) return null;

  const currentNickname = profile.nickname || profile.name || '익명';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = GOOGLE_APPS_SCRIPT_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSaveAndTest = async () => {
    const trimmed = webAppUrl.trim();
    saveWebAppUrl(trimmed);
    onSaveUrl(trimmed);

    if (!trimmed) {
      setTestResult({ success: false, message: '웹 앱 URL을 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSheetConnection(trimmed);
    setIsTesting(false);
    setTestResult(result);
    onRefreshRecords();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                토크어라운드 구글 스프레드시트 연동
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold font-mono">
                  Google Apps Script
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                5개 열 구성: <code className="text-amber-300 font-mono">timestamp, nickname, scenario_name, play_count, appropriateness_score</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Strip (개인정보 수집 및 학습 기록 안내 문구) */}
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>학습 참여도 및 피드백 제공을 위해 닉네임, 플레이한 시나리오, 대화 적합도 점수가 구글 시트에 자동 기록됩니다.</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-300 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>1. 웹 앱 URL 등록 & 테스트</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-amber-500 text-amber-300 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>2. Apps Script 코드 복사</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-300 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>3. 전송 기록 로그 ({records.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* TAB 1: Settings & Live Test */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-200">
                  Google Apps Script 웹 앱 URL (Web App URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={e => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 text-xs sm:text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    onClick={handleSaveAndTest}
                    disabled={isTesting}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>전송 테스트 중...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-stone-950" />
                        <span>저장 & 연동 테스트</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  * Apps Script 배포 시 생성된 <code className="text-amber-300">/exec</code>로 끝나는 URL을 입력하세요.
                </p>
              </div>

              {/* Test Result Message Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? '구글 시트 연동 성공!' : '연동 확인 필요'}</div>
                    <div>{testResult.message}</div>
                    {testResult.success && (
                      <div className="mt-1 text-[11px] text-emerald-300">
                        이제 시나리오 대화가 끝날 때마다 5개 열 데이터가 실시간으로 구글 시트에 자동 저장됩니다.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Schema Table Preview */}
              <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2">
                <span className="text-xs font-bold text-stone-300">
                  구글 시트에 기록되는 5개 열(A~E) 데이터 전송 형식
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse font-mono">
                    <thead>
                      <tr className="bg-stone-800/60 text-stone-300">
                        <th className="p-2 border border-stone-700">A: timestamp</th>
                        <th className="p-2 border border-stone-700">B: nickname</th>
                        <th className="p-2 border border-stone-700">C: scenario_name</th>
                        <th className="p-2 border border-stone-700 text-center">D: play_count</th>
                        <th className="p-2 border border-stone-700 text-center text-amber-400">E: appropriateness_score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-stone-200 bg-stone-900/40">
                        <td className="p-2 border border-stone-800 text-stone-400">{formatCurrentTimestamp()}</td>
                        <td className="p-2 border border-stone-800 font-bold text-amber-300">{currentNickname}</td>
                        <td className="p-2 border border-stone-800 text-stone-300">{profile.last_scenario_name || '[캠퍼스] 룸메이트 갈등 중재 (Alex)'}</td>
                        <td className="p-2 border border-stone-800 text-center">{profile.play_count || 1}</td>
                        <td className="p-2 border border-stone-800 text-center font-bold text-amber-400">
                          {profile.last_appropriateness_score !== undefined ? `${profile.last_appropriateness_score}%` : '92%'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Apps Script Code & Deployment Guide */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>새 5개 열 구글 시트 연동 초간단 4단계 가이드</span>
                </div>
                <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
                  <li>
                    사용하실 <strong>구글 스프레드시트</strong> 상단 메뉴에서 <span className="text-white bg-stone-800 px-1.5 py-0.5 rounded font-medium">[확장 프로그램] → [Apps Script]</span>를 클릭합니다.
                  </li>
                  <li>
                    아래의 <strong>최신 앱스 스크립트 코드</strong>를 전체 복사하여 <code className="text-amber-400">Code.gs</code>에 붙여넣습니다. (기존 코드가 있다면 전체 덮어쓰기)
                  </li>
                  <li>
                    오른쪽 상단 파란색 <span className="text-white bg-blue-600 px-1.5 py-0.5 rounded font-medium">[배포] → [새 배포]</span>를 누르고, 톱니바퀴에서 <span className="text-white bg-stone-800 px-1.5 py-0.5 rounded font-medium">[웹 앱]</span>을 선택합니다.
                  </li>
                  <li>
                    액세스 권한을 <span className="text-amber-300 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/40">[모든 사용자 (Anyone)]</span>로 지정하고 배포 후 나온 <strong>웹 앱 URL</strong>을 [1. 등록 & 테스트]에 입력하세요!
                  </li>
                </ol>
              </div>

              {/* Code Box with 1-Click Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 font-mono">
                    Code.gs (최신 5개 열 Apps Script 코드)
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20'
                        : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>전체 코드 1클릭 복사</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300 overflow-x-auto max-h-60 leading-relaxed selection:bg-amber-500 selection:text-stone-950">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Records Log & CSV Export */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-200">
                    로컬 및 시트 전송 기록 ({records.length}건)
                  </span>
                  <p className="text-[11px] text-stone-400">
                    대화 시뮬레이션을 완료할 때마다 5개 열 데이터가 자동 기록됩니다.
                  </p>
                </div>
                <button
                  onClick={() => exportRecordsToCSV(records)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>CSV 다운로드</span>
                </button>
              </div>

              {records.length === 0 ? (
                <div className="p-8 text-center text-stone-500 rounded-2xl bg-stone-950/40 border border-stone-800 space-y-1">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                  <p className="font-semibold text-xs">아직 저장된 시뮬레이션 기록이 없습니다.</p>
                  <p className="text-[11px]">대화 시나리오를 1개 완료하면 여기에 기록이 자동으로 추가됩니다.</p>
                </div>
              ) : (
                <div className="border border-stone-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-[11px] text-left border-collapse font-mono">
                    <thead className="sticky top-0 bg-stone-950 text-stone-300 border-b border-stone-800">
                      <tr>
                        <th className="p-2 font-semibold">일시</th>
                        <th className="p-2 font-semibold">닉네임</th>
                        <th className="p-2 font-semibold">시나리오</th>
                        <th className="p-2 font-semibold text-center">플레이수</th>
                        <th className="p-2 font-semibold text-center text-amber-400">적합도 점수</th>
                        <th className="p-2 font-semibold text-center">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 bg-stone-900/30">
                      {records.map((r, i) => (
                        <tr key={i} className="hover:bg-stone-800/30 transition-colors">
                          <td className="p-2 text-stone-400">{r.timestamp}</td>
                          <td className="p-2 font-bold text-stone-100">{r.nickname}</td>
                          <td className="p-2 text-stone-300 max-w-[120px] truncate">{r.scenario_name}</td>
                          <td className="p-2 text-center text-stone-200">{r.play_count}</td>
                          <td className="p-2 text-center font-bold text-amber-400">{r.appropriateness_score}</td>
                          <td className="p-2 text-center">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              저장됨
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between">
          <div className="text-[11px] text-stone-400">
            {webAppUrl ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> 연동 URL 준비 완료
              </span>
            ) : (
              <span className="text-amber-400">웹 앱 URL을 등록하면 대화 종료 시 시트에 자동 기록됩니다.</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
