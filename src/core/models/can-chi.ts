/**
 * Vietnamese Can Chi Mapping Table
 * Maps Chinese/Pinyin GanZhi strings (returned by lunar-javascript) to Vietnamese names.
 * The cycle repeats every 60 years.
 */

// Ten Heavenly Stems (Thiên Can)
const CANS: Record<string, string> = {
    '甲': 'Giáp',
    '乙': 'Ất',
    '丙': 'Bính',
    '丁': 'Đinh',
    '戊': 'Mậu',
    '己': 'Kỷ',
    '庚': 'Canh',
    '辛': 'Tân',
    '壬': 'Nhâm',
    '癸': 'Quý'
};

// Twelve Earthly Branches (Địa Chi)
const CHIS: Record<string, string> = {
    '子': 'Tý',
    '丑': 'Sửu',
    '寅': 'Dần',
    '卯': 'Mão',
    '辰': 'Thìn',
    '巳': 'Tỵ',
    '午': 'Ngọ',
    '未': 'Mùi',
    '申': 'Thân',
    '酉': 'Dậu',
    '戌': 'Tuất',
    '亥': 'Hợi'
};

/**
 * Converts a Chinese GanZhi string (e.g., "癸卯") to Vietnamese (e.g., "Quý Mão").
 */
export function translateGanZhiToVietnamese(ganZhi: string): string {
    if (!ganZhi || ganZhi.length !== 2) return ganZhi;

    const can = CANS[ganZhi[0]];
    const chi = CHIS[ganZhi[1]];

    if (can && chi) {
        return `${can} ${chi}`;
    }

    return ganZhi;
}
