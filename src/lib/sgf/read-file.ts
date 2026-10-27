import { decodeGibBytes, gibToSgf, looksLikeGib } from "./gib";
import { MAX_SGF_CHARS } from "./replay";

/** Định dạng kỳ phổ được hỗ trợ — dùng chung cho mọi nơi hiện hướng dẫn tải lên. */
export const SUPPORTED_RECORD_NOTE = "Hỗ trợ .sgf (xuất từ KGS, OGS, Sabaki, gokifu…) và .gib (Tygem). File .gib được đổi sang SGF khi lưu.";
export const RECORD_ACCEPT = ".sgf,.gib,text/plain";

/**
 * Đọc file kỳ phổ trong trình duyệt và trả về SGF (UTF-8).
 *  • `.sgf`: dò thuộc tính CA[...] rồi giải mã đúng bảng mã (GBK, Shift_JIS…).
 *  • `.gib` của Tygem: giải mã theo bảng mã Hàn/Trung rồi đổi sang SGF.
 * Nhận diện theo nội dung, không chỉ theo đuôi file.
 */
export async function readSgfFile(file: File): Promise<string> {
  if (file.size > MAX_SGF_CHARS * 3) throw new Error("File quá lớn (tối đa 200 KB).");
  const bytes = new Uint8Array(await file.arrayBuffer());

  const head = new TextDecoder("latin1").decode(bytes.slice(0, 4096));
  let text: string;
  if (/^\s*\\HS\b/.test(head) || /\.gib$/i.test(file.name)) {
    text = decodeGibBytes(bytes);
  } else {
    const charset = /CA\[([^\]]+)\]/i.exec(head)?.[1]?.trim().toLowerCase() ?? "utf-8";
    try {
      text = new TextDecoder(charset).decode(bytes);
    } catch {
      text = new TextDecoder("utf-8").decode(bytes);
    }
  }

  if (looksLikeGib(text)) text = gibToSgf(text);
  if (text.length > MAX_SGF_CHARS) throw new Error("File kỳ phổ quá lớn (tối đa 200 KB).");
  return text;
}
