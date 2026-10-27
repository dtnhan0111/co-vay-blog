import { MAX_SGF_CHARS } from "./replay";

/**
 * Đọc file .sgf trong trình duyệt. File từ Trung/Nhật/Hàn thường không phải UTF-8,
 * nên dò thuộc tính CA[...] rồi giải mã đúng bảng mã trước khi lưu.
 */
export async function readSgfFile(file: File): Promise<string> {
  if (file.size > MAX_SGF_CHARS * 3) throw new Error("File quá lớn (tối đa 200 KB).");
  const buffer = await file.arrayBuffer();
  const head = new TextDecoder("latin1").decode(buffer.slice(0, 4096));
  const charset = /CA\[([^\]]+)\]/i.exec(head)?.[1]?.trim().toLowerCase() ?? "utf-8";
  let text: string;
  try {
    text = new TextDecoder(charset).decode(buffer);
  } catch {
    text = new TextDecoder("utf-8").decode(buffer);
  }
  if (text.length > MAX_SGF_CHARS) throw new Error("File kỳ phổ quá lớn (tối đa 200 KB).");
  return text;
}
