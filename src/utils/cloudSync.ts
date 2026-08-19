import { Student, AttendanceRecord } from '../types/attendance';

const SYNC_URL_KEY = 'soongshin_mirae_sync_url_v1';

export interface CloudPayload {
  students: Student[];
  records: Record<string, AttendanceRecord>;
  updatedAt: string;
}

export function getSyncUrl(): string {
  try {
    return localStorage.getItem(SYNC_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSyncUrl(url: string): void {
  try {
    localStorage.setItem(SYNC_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save sync URL:', e);
  }
}

export function isSyncEnabled(): boolean {
  return getSyncUrl().length > 0;
}

/**
 * Pull the latest shared data from the Google Sheets (Apps Script) backend.
 * Returns null if sync isn't configured, or if the request fails.
 */
export async function pullFromCloud(): Promise<CloudPayload | null> {
  const url = getSyncUrl();
  if (!url) return null;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.students) && data.records) {
      return data as CloudPayload;
    }
    return null;
  } catch (e) {
    console.error('클라우드 동기화(불러오기) 실패:', e);
    return null;
  }
}

/**
 * Push local data up to the Google Sheets (Apps Script) backend.
 * Fire-and-forget: failures are logged but never block the UI.
 * Note: Content-Type is text/plain to avoid a CORS preflight request,
 * which Apps Script Web Apps do not handle. The body is still JSON.
 */
export async function pushToCloud(payload: {
  students: Student[];
  records: Record<string, AttendanceRecord>;
}): Promise<boolean> {
  const url = getSyncUrl();
  if (!url) return false;

  try {
    const body: CloudPayload = {
      students: payload.students,
      records: payload.records,
      updatedAt: new Date().toISOString(),
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (e) {
    console.error('클라우드 동기화(저장) 실패:', e);
    return false;
  }
}

/**
 * Quick connectivity check used by the settings modal's "연결 테스트" button.
 */
export async function testConnection(url: string): Promise<{ ok: boolean; message: string }> {
  if (!url.trim()) {
    return { ok: false, message: 'URL을 입력해주세요.' };
  }
  try {
    const res = await fetch(url.trim(), { method: 'GET' });
    if (!res.ok) {
      return { ok: false, message: `연결 실패 (HTTP ${res.status}). 배포 설정을 확인해주세요.` };
    }
    const data = await res.json();
    if (data && typeof data === 'object') {
      return { ok: true, message: '연결 성공! 이 주소로 데이터를 동기화합니다.' };
    }
    return { ok: false, message: '응답 형식이 올바르지 않습니다. Apps Script 코드를 확인해주세요.' };
  } catch (e) {
    return { ok: false, message: '연결할 수 없습니다. URL과 배포(누구나 액세스) 설정을 확인해주세요.' };
  }
}
