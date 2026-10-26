/**
 * Dữ liệu mẫu cho Go Đà Nẵng — HOÀN TOÀN HƯ CẤU (tên người, CLB, địa điểm đều là giả định).
 *
 * Một nguồn duy nhất cho hai nơi dùng:
 *   • demo mode  → `materializeSeed(today)` (lib/seed/index.ts)
 *   • Supabase   → `npm run seed:sql` sinh ra supabase/seed.sql
 *
 * Mọi ngày đều tính theo "số ngày trước hôm nay" nên dữ liệu luôn trông mới.
 */

export type SeedClub = {
  n: number;
  slug: string;
  name: string;
  description: string;
  address: string;
  meets_at: string;
};

export type SeedPlayer = {
  n: number;
  name: string;
  email: string;
  rank: number; // xem lib/rank.ts
  club: string; // slug
  since: number;
  bio: string;
};

export type SeedMatch = {
  n: number;
  black: number; // player n
  white: number;
  winner: number;
  method: "points" | "resign" | "time";
  score: number | null;
  daysAgo: number;
  /** phút từ 00:00 của ngày chơi đến lúc người ghi gửi ván */
  createdMin: number;
  /** số phút từ lúc gửi đến lúc đối thủ trả lời */
  respondedAfterMin: number;
  location: string;
  club: string | null;
  note: string | null;
  boardSize: 9 | 13 | 19;
  handicap: number;
  status: "pending" | "confirmed" | "rejected";
  recordedBy: number;
  reason: string | null;
};

export type SeedKudos = { match: number; player: number };

export const SEED_CLUBS: SeedClub[] = [
  {
    n: 1,
    slug: "song-han",
    name: "CLB Cờ Vây Sông Hàn",
    description:
      "Nhóm lâu đời nhất thành phố. Bàn gỗ, trà nóng, và luật bất thành văn: ván nào cũng phải có phút nhận xét sau cuộc.",
    address: "Khu vực cầu Rồng, Hải Châu",
    meets_at: "Thứ bảy · 14:00–18:00",
  },
  {
    n: 2,
    slug: "tra-that-ky-duyen",
    name: "Trà thất Kỳ Duyên",
    description:
      "Một căn gác nhỏ có bốn bàn cờ và rất nhiều trà. Hợp cho những ván chậm, ít người, nhiều suy nghĩ.",
    address: "Khu phố cổ Hải Châu",
    meets_at: "Thứ ba & thứ năm · 19:00–22:00",
  },
  {
    n: 3,
    slug: "son-tra",
    name: "CLB Cờ Vây Sơn Trà",
    description: "Đánh cờ buổi sáng, ăn sáng cùng nhau, rồi đánh tiếp. Có góc dạy người mới.",
    address: "Khu vực Mân Thái, Sơn Trà",
    meets_at: "Chủ nhật · 08:00–11:30",
  },
  {
    n: 4,
    slug: "sinh-vien",
    name: "Cờ Vây Sinh viên Đà Nẵng",
    description: "Sinh viên các trường đại học cùng chơi, cùng học. Người mới luôn có bàn để ngồi.",
    address: "Khu đại học, Liên Chiểu",
    meets_at: "Thứ tư · 18:30–21:00",
  },
  {
    n: 5,
    slug: "ngu-hanh-son",
    name: "Nhóm Cờ Vây Ngũ Hành Sơn",
    description: "Nhóm nhỏ, thân, hay hẹn nhau ở quán cà phê gần biển vào tối thứ sáu.",
    address: "Khu vực Mỹ An, Ngũ Hành Sơn",
    meets_at: "Thứ sáu · 19:00–21:30",
  },
];

// Hạng: 1d = 1, 1k = 0, 2k = -1 …
export const SEED_PLAYERS: SeedPlayer[] = [
  { n: 1, name: "Lê Quang Huy", email: "quang.huy@example.com", rank: 4, club: "song-han", since: 2006, bio: "Chơi cờ từ thời cấp ba. Thích khai cuộc Trung Quốc và ghét ván hoà." },
  { n: 2, name: "Đinh Công Sơn", email: "cong.son@example.com", rank: 2, club: "ngu-hanh-son", since: 2008, bio: "Thầy cờ không chính thức của cả nhóm. Luôn có một nước 'đáng lẽ' để gợi ý." },
  { n: 3, name: "Trần Minh Khôi", email: "minh.khoi@example.com", rank: 2, club: "song-han", since: 2011, bio: "Đánh nhanh, tính chậm. Hay thắng ở trung bàn rồi thua ở yose." },
  { n: 4, name: "Nguyễn Thị Thu Hiền", email: "thu.hien@example.com", rank: 1, club: "son-tra", since: 2014, bio: "Mỗi sáng chủ nhật đều có mặt. Mê tesuji và bánh mì." },
  { n: 5, name: "Phạm Đức Anh", email: "duc.anh@example.com", rank: 1, club: "tra-that-ky-duyen", since: 2013, bio: "Kiên nhẫn, thủ chắc. Thắng ít khi đậm nhưng hiếm khi thua." },
  { n: 6, name: "Võ Thanh Tùng", email: "thanh.tung@example.com", rank: 0, club: "song-han", since: 2016, bio: "Đang cố lên dan trong năm nay. Đã nói vậy ba năm rồi." },
  { n: 7, name: "Đặng Hoài Nam", email: "hoai.nam@example.com", rank: -1, club: "son-tra", since: 2017, bio: "Thích đánh góc, ngại đánh biên. Luôn mang theo bộ cờ du lịch." },
  { n: 8, name: "Hồ Ngọc Lan", email: "ngoc.lan@example.com", rank: -1, club: "tra-that-ky-duyen", since: 2018, bio: "Học cờ từ bố. Đánh mềm mỏng nhưng cắt rất đau." },
  { n: 9, name: "Bùi Anh Tuấn", email: "anh.tuan@example.com", rank: -2, club: "sinh-vien", since: 2019, bio: "Sinh viên năm cuối, kỹ sư tương lai, kỳ thủ hiện tại." },
  { n: 10, name: "Trương Gia Bảo", email: "gia.bao@example.com", rank: -2, club: "sinh-vien", since: 2020, bio: "Học cờ qua video, nay muốn thử cờ thật." },
  { n: 11, name: "Huỳnh Mỹ Linh", email: "my.linh@example.com", rank: -3, club: "son-tra", since: 2019, bio: "Làm thiết kế, đánh cờ như xếp bố cục: thích cân đối." },
  { n: 12, name: "Đỗ Quốc Việt", email: "quoc.viet@example.com", rank: -3, club: "ngu-hanh-son", since: 2018, bio: "Đánh đến khuya vẫn tỉnh. Cà phê đen không đường." },
  { n: 13, name: "Lương Thanh Hà", email: "thanh.ha@example.com", rank: -4, club: "tra-that-ky-duyen", since: 2021, bio: "Mới đi cùng bạn, rồi ở lại luôn." },
  { n: 14, name: "Phan Nhật Nam", email: "nhat.nam@example.com", rank: -5, club: "sinh-vien", since: 2022, bio: "Chăm chỉ giải bài tsumego trước khi ngủ." },
  { n: 15, name: "Ngô Khánh Vy", email: "khanh.vy@example.com", rank: -6, club: "ngu-hanh-son", since: 2022, bio: "Thích bàn 13×13, bảo là 'vừa đủ để suy nghĩ'." },
  { n: 16, name: "Châu Minh Triết", email: "minh.triet@example.com", rank: -7, club: "sinh-vien", since: 2023, bio: "Chuyển từ cờ vua sang, vẫn đang quen với việc không có quân bị ăn mất hẳn." },
  { n: 17, name: "Dương Thảo Nguyên", email: "thao.nguyen@example.com", rank: -7, club: "son-tra", since: 2023, bio: "Học cùng chị Hiền. Đang mê khai cuộc 3-3." },
  { n: 18, name: "Mai Xuân Thành", email: "xuan.thanh@example.com", rank: -9, club: "ngu-hanh-son", since: 2024, bio: "Mới học, đang mê. Hỏi gì cũng được, miễn đừng cười." },
  { n: 19, name: "Lâm Tuấn Kiệt", email: "tuan.kiet@example.com", rank: -11, club: "sinh-vien", since: 2025, bio: "Ván đầu tiên là ở CLB sinh viên, ván thứ hai là về nhà tự mua bàn cờ." },
  { n: 20, name: "Vũ Phương Thảo", email: "phuong.thao@example.com", rank: -4, club: "tra-that-ky-duyen", since: 2020, bio: "Hay đến muộn, hay đi sớm, nhưng ván nào cũng quyết liệt." },
];

const NOTES = [
  "Ván giằng co ở góc phải dưới, cuối cùng thua một cái ko.",
  "Lần đầu thử khai cuộc Trung Quốc, hiệu quả bất ngờ.",
  "Mất một con rồng lớn ở trung bàn. Bài học nhớ đời.",
  "Chơi xong là sáng rồi. Trà nguội từ lâu.",
  "Nước cắt ở phút 40 làm đối thủ im lặng cả phút.",
  "Đánh nhanh theo kiểu cờ chớp nhưng hay.",
  "Nhận xét xong mới thấy mình bỏ lỡ nước thắng từ lâu.",
  "Hoà khí suốt ván, đến yose thì cả hai cùng nín thở.",
  "Biên trên là nơi quyết định ván này.",
  "Một ván sạch sẽ, không có gì để than phiền.",
  "Thắng nhờ tính toán semeai chính xác.",
  "Chấp bốn quân, tưởng dễ, ai ngờ khó.",
  "Ván thứ ba trong tuần với cùng một người. Đã đến lúc nghỉ ngơi.",
  "Quán đông quá nên đánh ở hiên.",
  "Nước thử của đối thủ khiến mình lúng túng cả khai cuộc.",
  "Cờ vây là vậy: thấy mình hơn rồi, đột nhiên hết hơn.",
  "Mưa suốt buổi. Ván hay hơn thường lệ.",
  "Đánh xong cả hai cùng ăn bún chả cá.",
];

/** Bộ sinh số giả ngẫu nhiên xác định (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FREE_VENUES = [
  "Cà phê Cầu Rồng",
  "Nhà anh Huy",
  "Quán trà Bạch Đằng",
  "Cà phê view biển Mỹ Khê",
  "Thư viện Khoa học Tổng hợp",
];

function pick<T>(r: () => number, items: T[]): T {
  return items[Math.floor(r() * items.length)];
}

function pickWeighted<T>(r: () => number, items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight);
  let roll = r() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

function buildMatches(): SeedMatch[] {
  const r = rng(20260101);
  const clubBySlug = new Map(SEED_CLUBS.map((c) => [c.slug, c]));
  const matches: SeedMatch[] = [];
  const TOTAL = 196;

  // Mức độ chăm chỉ của từng người (người mới / người cũ chơi nhiều hơn).
  const activity = new Map(SEED_PLAYERS.map((p) => [p.n, 0.45 + r() * 1.1]));

  for (let i = 0; i < TOTAL; i++) {
    // Mật độ tăng dần về gần hiện tại: daysAgo ~ 1 + 210 * u^1.7
    const daysAgo = Math.floor(1 + 210 * Math.pow(r(), 1.7));

    const a = pickWeighted(r, SEED_PLAYERS, (p) => activity.get(p.n)!);
    const b = pickWeighted(
      r,
      SEED_PLAYERS.filter((p) => p.n !== a.n),
      (p) => {
        const sameClub = p.club === a.club ? 3.2 : 1;
        const closeRank = 1 / (1 + Math.abs(p.rank - a.rank) * 0.35);
        return sameClub * closeRank * activity.get(p.n)!;
      },
    );

    const gap = a.rank - b.rank; // dương → a mạnh hơn
    const handicap = Math.abs(gap) >= 2 ? Math.min(9, Math.abs(gap)) : 0;
    // Bên yếu được chấp; khi chấp thì bên yếu cầm Đen. Không chấp: chọn màu ngẫu nhiên.
    const [weak, strong] = gap >= 0 ? [b, a] : [a, b];
    let black = handicap > 0 ? weak : r() < 0.5 ? a : b;
    let white = black === a ? b : a;
    if (handicap === 0 && Math.abs(gap) === 1) {
      // người yếu hơn 1 hạng có xu hướng cầm Đen
      black = weak;
      white = strong;
    }

    // Xác suất a thắng: logistic theo chênh hạng, trừ phần chấp.
    const effective = (gap > 0 ? 1 : -1) * Math.max(0, Math.abs(gap) - handicap * 0.85);
    const pA = 1 / (1 + Math.exp(-effective / 1.6));
    const winnerPlayer = r() < pA ? a : b;
    const loserPlayer = winnerPlayer === a ? b : a;

    const roll = r();
    const method: SeedMatch["method"] = roll < 0.7 ? "points" : roll < 0.94 ? "resign" : "time";
    let score: number | null = null;
    if (method === "points") {
      const m = r();
      const base = m < 0.5 ? 0.5 + Math.floor(r() * 6) : m < 0.88 ? 6.5 + Math.floor(r() * 10) : 16.5 + Math.floor(r() * 25);
      score = base;
    }

    // Địa điểm: ưu tiên CLB chung; không thì quán cà phê.
    let location: string;
    let clubSlug: string | null = null;
    if (a.club === b.club && r() < 0.78) {
      clubSlug = a.club;
      location = clubBySlug.get(a.club)!.name;
    } else if (r() < 0.45) {
      const host = r() < 0.5 ? a : b;
      clubSlug = host.club;
      location = clubBySlug.get(host.club)!.name;
    } else {
      location = pick(r, FREE_VENUES);
    }

    const boardRoll = r();
    const boardSize: 9 | 13 | 19 = boardRoll < 0.82 ? 19 : boardRoll < 0.92 ? 13 : 9;

    const createdMin = 600 + Math.floor(r() * 780);
    const note = r() < 0.34 ? pick(r, NOTES) : null;

    matches.push({
      n: i + 1,
      black: black.n,
      white: white.n,
      winner: winnerPlayer.n,
      method,
      score,
      daysAgo,
      createdMin,
      respondedAfterMin: 20 + Math.floor(r() * 1400),
      location,
      club: clubSlug,
      note,
      boardSize: boardSize,
      handicap: boardSize === 19 ? handicap : 0,
      status: "confirmed",
      recordedBy: r() < 0.55 ? winnerPlayer.n : loserPlayer.n,
      reason: null,
    });
  }

  // Sắp xếp từ cũ → mới để id tăng theo thời gian.
  matches.sort((x, y) => y.daysAgo - x.daysAgo || x.createdMin - y.createdMin);
  matches.forEach((m, i) => (m.n = i + 1));

  // Vài ván đặc biệt để demo luồng xác nhận (xem README → Demo).
  const hien = 4;
  const next = () => matches.length + 1;
  const special: Omit<SeedMatch, "n">[] = [
    {
      // Nam ghi, chờ Hiền xác nhận → hiện trong khay "Lời mời xác nhận" của Hiền
      black: 7, white: hien, winner: 7, method: "points", score: 4.5, daysAgo: 1, createdMin: 1210,
      respondedAfterMin: 0, location: "CLB Cờ Vây Sơn Trà", club: "son-tra",
      note: "Ván chủ nhật. Hiền đánh hay, nhưng góc dưới trái mình may mắn hơn.",
      boardSize: 19, handicap: 0, status: "pending", recordedBy: 7, reason: null,
    },
    {
      // Hiền ghi, chờ Thanh Hà xác nhận → hiện ở "Ván bạn đã gửi" của Hiền
      black: 13, white: hien, winner: hien, method: "resign", score: null, daysAgo: 0, createdMin: 600,
      respondedAfterMin: 0, location: "Cà phê Cầu Rồng", club: null,
      note: "Chị Hà chấp năm quân, đến trung bàn thì bỏ cuộc.",
      boardSize: 19, handicap: 5, status: "pending", recordedBy: hien, reason: null,
    },
    {
      // Tùng ghi, chờ Khôi
      black: 6, white: 3, winner: 3, method: "time", score: null, daysAgo: 0, createdMin: 780,
      respondedAfterMin: 0, location: "CLB Cờ Vây Sông Hàn", club: "song-han",
      note: null, boardSize: 19, handicap: 0, status: "pending", recordedBy: 6, reason: null,
    },
    {
      // Hiền ghi nhưng bị Đức Anh báo sai
      black: hien, white: 5, winner: hien, method: "points", score: 6.5, daysAgo: 3, createdMin: 1100,
      respondedAfterMin: 190, location: "Trà thất Kỳ Duyên", club: "tra-that-ky-duyen",
      note: null, boardSize: 19, handicap: 0, status: "rejected", recordedBy: hien,
      reason: "Mình nhớ là hơn 2.5 điểm chứ không phải 6.5. Hiền kiểm tra lại giúp nhé.",
    },
  ];
  for (const s of special) matches.push({ ...s, n: next() });
  return matches;
}

export const SEED_MATCHES: SeedMatch[] = buildMatches();

function buildKudos(): SeedKudos[] {
  const r = rng(77);
  const out: SeedKudos[] = [];
  for (const m of SEED_MATCHES) {
    if (m.status !== "confirmed") continue;
    const popularity = (m.note ? 1.6 : 1) * (m.score && m.score >= 20 ? 1.6 : 1) * (m.method === "time" ? 0.6 : 1);
    const count = Math.floor(r() * 5 * popularity);
    const pool = SEED_PLAYERS.filter((p) => p.n !== m.black && p.n !== m.white);
    const taken = new Set<number>();
    for (let i = 0; i < count; i++) {
      const p = pick(r, pool);
      if (!taken.has(p.n)) {
        taken.add(p.n);
        out.push({ match: m.n, player: p.n });
      }
    }
    // người chơi trong ván đôi khi tự đặt quân cho đối thủ
    if (r() < 0.25) out.push({ match: m.n, player: r() < 0.5 ? m.black : m.white });
  }
  return out;
}

export const SEED_KUDOS: SeedKudos[] = buildKudos();

/** UUID xác định, dễ nhận ra: a=users, b=clubs, c=matches, d=confirmations. */
export function seedId(kind: "a" | "b" | "c" | "d", n: number): string {
  return `00000000-0000-4000-${kind}000-${String(n).padStart(12, "0")}`;
}

/** Kỳ thủ mặc định khi đăng nhập demo. */
export const DEMO_DEFAULT_PLAYER = 4;
