/**
 * Bộ đọc SGF (Smart Game Format) tối giản nhưng đúng chuẩn FF[4]:
 * cây ván cờ, thuộc tính nhiều giá trị, ký tự thoát `\`. Không đệ quy để file xấu không làm tràn stack.
 */

export class SgfError extends Error {}

export type SgfNode = Record<string, string[]>;
export type SgfTree = { nodes: SgfNode[]; children: SgfTree[] };

export function parseSgf(text: string): SgfTree {
  const s = text.replace(/^﻿/, "");
  const n = s.length;
  let i = s.indexOf("(");
  if (i < 0) throw new SgfError("Đây không phải file SGF (không thấy dấu \"(\" mở đầu).");

  const stack: SgfTree[] = [];
  let root: SgfTree | null = null;

  const skipSpace = () => {
    while (i < n && /\s/.test(s[i])) i++;
  };

  function readNode(): SgfNode {
    const node: SgfNode = {};
    for (;;) {
      skipSpace();
      let ident = "";
      while (i < n && /[A-Za-z]/.test(s[i])) ident += s[i++];
      if (!ident) return node;
      const key = ident.replace(/[a-z]/g, ""); // theo chuẩn, chữ thường trong tên thuộc tính bị bỏ qua
      const values: string[] = [];
      for (;;) {
        skipSpace();
        if (s[i] !== "[") break;
        i++;
        let v = "";
        for (;;) {
          if (i >= n) throw new SgfError("File SGF bị cụt: thiếu dấu \"]\".");
          const c = s[i++];
          if (c === "]") break;
          if (c === "\\") {
            const next = s[i++];
            if (next === "\n") continue; // nối dòng mềm
            if (next === "\r") {
              if (s[i] === "\n") i++;
              continue;
            }
            v += next ?? "";
          } else v += c;
        }
        values.push(v);
      }
      if (!values.length) throw new SgfError(`Thuộc tính ${key} không có giá trị.`);
      (node[key] ??= []).push(...values);
    }
  }

  while (i < n) {
    skipSpace();
    const c = s[i];
    if (c === "(") {
      i++;
      const tree: SgfTree = { nodes: [], children: [] };
      if (stack.length) stack[stack.length - 1].children.push(tree);
      else if (root) break; // chỉ lấy ván đầu tiên trong file
      else root = tree;
      stack.push(tree);
    } else if (c === ")") {
      i++;
      stack.pop();
      if (!stack.length) break;
    } else if (c === ";") {
      i++;
      if (!stack.length) throw new SgfError("Nước đi nằm ngoài cây ván cờ.");
      stack[stack.length - 1].nodes.push(readNode());
    } else if (i < n) {
      throw new SgfError(`Ký tự lạ "${c}" ở vị trí ${i}.`);
    }
  }
  if (!root || stack.length) throw new SgfError("File SGF bị cụt: thiếu dấu \")\" đóng.");
  return root;
}

/** Đường chính: đi theo nhánh đầu tiên ở mọi chỗ rẽ (các biến thể còn lại bị bỏ qua). */
export function mainLine(tree: SgfTree): SgfNode[] {
  const out: SgfNode[] = [];
  for (let t: SgfTree | undefined = tree; t; t = t.children[0]) out.push(...t.nodes);
  return out;
}
