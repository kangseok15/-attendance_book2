import React, { useState } from 'react';
import { Cloud, CloudCheck, CloudOff, X, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { getSyncUrl, saveSyncUrl, testConnection } from '../utils/cloudSync';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUrl: (url: string) => void;
  onManualPull: () => Promise<void>;
  onManualPush: () => Promise<void>;
  lastSyncedAt?: string | null;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaveUrl,
  onManualPull,
  onManualPush,
  lastSyncedAt,
}) => {
  const [url, setUrl] = useState(() => getSyncUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState<'pull' | 'push' | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(url);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    saveSyncUrl(url);
    onSaveUrl(url.trim());
  };

  const handlePull = async () => {
    setBusy('pull');
    await onManualPull();
    setBusy(null);
  };

  const handlePush = async () => {
    setBusy('push');
    await onManualPush();
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              여러 기기 동기화 설정 (Google 스프레드시트)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Google Apps Script로 배포한 웹 앱 URL을 입력하면, 이 기기와 다른 기기의 출석부
            데이터가 같은 Google 스프레드시트를 통해 공유됩니다. (동일한 URL을 모든 기기에
            각각 입력해야 합니다.)
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Apps Script 웹 앱 URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/xxxxx/exec"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudCheck className="w-3.5 h-3.5" />}
              연결 테스트
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              저장 및 사용
            </button>
            {getSyncUrl() && (
              <button
                onClick={() => {
                  setUrl('');
                  saveSyncUrl('');
                  onSaveUrl('');
                  setTestResult(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 cursor-pointer"
              >
                <CloudOff className="w-3.5 h-3.5" />
                동기화 끄기
              </button>
            )}
          </div>

          {testResult && (
            <div
              className={`text-xs rounded-lg px-3 py-2 ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lastSyncedAt ? `마지막 동기화: ${new Date(lastSyncedAt).toLocaleString('ko-KR')}` : '아직 동기화 기록 없음'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePull}
                disabled={!getSyncUrl() || busy !== null}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {busy === 'pull' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                지금 불러오기
              </button>
              <button
                onClick={handlePush}
                disabled={!getSyncUrl() || busy !== null}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {busy === 'push' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                지금 올리기
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            같은 시간에 여러 명이 동시에 출석을 체크하면 나중에 저장한 내용이 앞의 내용을
            덮어씁니다(자동 병합 없음). 보통 한 명씩 순서대로 체크하는 경우라면 문제없습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
