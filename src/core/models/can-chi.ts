/**
 * Vietnamese Can Chi Mapping Table
 * Maps Chinese/Pinyin GanZhi strings (returned by lunar-javascript) to Vietnamese names.
 * The cycle repeats every 60 years.
 */

// Ten Heavenly Stems (Thiên Can)
const CANS: Record<string, string> = {
  甲: "Giáp",
  乙: "Ất",
  丙: "Bính",
  丁: "Đinh",
  戊: "Mậu",
  己: "Kỷ",
  庚: "Canh",
  辛: "Tân",
  壬: "Nhâm",
  癸: "Quý",
};

// Twelve Earthly Branches (Địa Chi)
const CHIS: Record<string, string> = {
  子: "Tý",
  丑: "Sửu",
  寅: "Dần",
  卯: "Mão",
  辰: "Thìn",
  巳: "Tỵ",
  午: "Ngọ",
  未: "Mùi",
  申: "Thân",
  酉: "Dậu",
  戌: "Tuất",
  亥: "Hợi",
};

// Map for ShengXiao (Zodiac Animals) in Vietnamese
const ANIMALS: Record<string, string> = {
  鼠: "Chuột",
  牛: "Trâu",
  虎: "Hổ",
  兔: "Mèo",
  龙: "Rồng",
  蛇: "Rắn",
  马: "Ngựa",
  羊: "Dê",
  猴: "Khỉ",
  鸡: "Gà",
  狗: "Chó",
  猪: "Lợn",
};

// Map for NaYin (Five Elements / Fate) in Vietnamese — full 30 entries of the
// 60-year cycle. lunar-javascript returns simplified Chinese.
const NAYIN: Record<string, string> = {
  海中金: "Hải Trung Kim",
  炉中火: "Lô Trung Hỏa",
  大林木: "Đại Lâm Mộc",
  路旁土: "Lộ Bàng Thổ",
  剑锋金: "Kiếm Phong Kim",
  山头火: "Sơn Đầu Hỏa",
  涧下水: "Giản Hạ Thủy",
  城头土: "Thành Đầu Thổ",
  白蜡金: "Bạch Lạp Kim",
  杨柳木: "Dương Liễu Mộc",
  泉中水: "Tuyền Trung Thủy",
  屋上土: "Ốc Thượng Thổ",
  霹雳火: "Tích Lịch Hỏa",
  松柏木: "Tùng Bách Mộc",
  长流水: "Trường Lưu Thủy",
  沙中金: "Sa Trung Kim",
  山下火: "Sơn Hạ Hỏa",
  平地木: "Bình Địa Mộc",
  壁上土: "Bích Thượng Thổ",
  金箔金: "Kim Bạc Kim",
  覆灯火: "Phú Đăng Hỏa",
  天河水: "Thiên Hà Thủy",
  大驿土: "Đại Dịch Thổ",
  钗钏金: "Thoa Xuyến Kim",
  桑柘木: "Tang Đố Mộc",
  大溪水: "Đại Khê Thủy",
  沙中土: "Sa Trung Thổ",
  天上火: "Thiên Thượng Hỏa",
  石榴木: "Thạch Lựu Mộc",
  大海水: "Đại Hải Thủy",
};

/**
 * Converts a Chinese GanZhi or Animal or NaYin string to Vietnamese.
 */
export function translateGanZhiToVietnamese(chinese: string): string {
  if (!chinese) return chinese;

  // Handle 2-char GanZhi
  if (chinese.length === 2) {
    const can = CANS[chinese[0]];
    const chi = CHIS[chinese[1]];
    if (can && chi) return `${can} ${chi}`;
  }

  // Handle single char (Stem, Branch, or Animal)
  if (chinese.length === 1) {
    return CANS[chinese] || CHIS[chinese] || ANIMALS[chinese] || chinese;
  }

  // Handle NaYin or descriptive strings
  return NAYIN[chinese] || chinese;
}
