/**
 * 미래인재반 출석부 - Google 스프레드시트 동기화 백엔드
 *
 * 사용법:
 * 1. 아무 Google 스프레드시트나 새로 만든다.
 * 2. 확장 프로그램 > Apps Script 메뉴로 들어간다.
 * 3. 기본으로 있는 코드를 지우고 이 파일 내용을 전부 붙여넣는다.
 * 4. 저장 후 배포 > 새 배포 > 유형: 웹 앱
 *      - 실행할 사용자: 나
 *      - 액세스 권한이 있는 사용자: 전체
 *    로 설정하고 배포한다.
 * 5. 배포 후 나오는 웹 앱 URL을 출석부 앱의 "동기화 설정"에 붙여넣는다.
 *
 * 데이터는 이 스프레드시트 안에 'SyncData'라는 시트가 자동 생성되어
 * 그 안에 JSON 형태로 저장된다 (사람이 보기 위한 표가 아니라
 * 여러 기기 간 데이터를 저장/전달하기 위한 용도).
 */

const SHEET_NAME = 'SyncData';

function getDataSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange('A1').setValue(
      JSON.stringify({ students: [], records: {}, updatedAt: new Date().toISOString() })
    );
  }
  return sheet;
}

function doGet(e) {
  const sheet = getDataSheet_();
  const raw = sheet.getRange('A1').getValue();
  const json = raw && String(raw).trim().length > 0
    ? String(raw)
    : JSON.stringify({ students: [], records: {}, updatedAt: null });

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getDataSheet_();

  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const parsed = JSON.parse(body);

    if (!parsed || !Array.isArray(parsed.students) || typeof parsed.records !== 'object') {
      throw new Error('잘못된 데이터 형식입니다.');
    }

    sheet.getRange('A1').setValue(JSON.stringify(parsed));

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, updatedAt: parsed.updatedAt || null }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
