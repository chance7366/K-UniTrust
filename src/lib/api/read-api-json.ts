/** fetch 응답이 HTML(오류·로그인 페이지)일 때 JSON.parse 대신 읽기 쉬운 메시지를 반환 */
export async function readApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(
      "서버 응답 오류입니다. 페이지를 새로고침하거나 다시 로그인해 주세요.",
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("서버 응답 형식이 올바르지 않습니다.");
  }
}
