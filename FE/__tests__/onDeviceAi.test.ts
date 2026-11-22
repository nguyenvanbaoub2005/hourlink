/// <reference types="jest" />
import {
  classifySkillOnDevice,
  evaluateImageFeatures,
  normalizeVi,
} from '../src/ai/onDeviceAi';

describe('On-Device AI (EdgeVision & N-Gram Classifier)', () => {
  it('normalizeVi bỏ dấu tiếng Việt và ký tự đặc biệt', () => {
    expect(normalizeVi('Chứng chỉ Tiếng Anh IELTS 7.5!')).toBe('chung chi tieng anh ielts 7 5');
  });

  it('nhận diện ảnh Chứng chỉ / Văn bằng từ tên file hoặc OCR text', () => {
    const res = evaluateImageFeatures(
      {
        uri: 'file:///cert.jpg',
        width: 1600,
        height: 1130,
        fileSize: 320 * 1024,
        fileName: 'IELTS_Certificate_2026.jpg',
      },
      ['UNIVERSITY OF CAMBRIDGE', 'IELTS Academic 7.5'],
      'Luyện thi IELTS',
    );
    expect(res.label).toBe('CERTIFICATE_DOCUMENT');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    expect(res.qualityScore).toBeGreaterThanOrEqual(85);
    expect(res.suggestedTitle).toContain('Chứng chỉ');
  });

  it('cảnh báo khi ảnh minh chứng có độ phân giải quá thấp', () => {
    const res = evaluateImageFeatures({
      uri: 'file:///blur.jpg',
      width: 240,
      height: 240,
      fileSize: 10 * 1024,
    });
    expect(res.label).toBe('LOW_RESOLUTION_WARNING');
    expect(res.qualityScore).toBeLessThan(55);
  });

  it('nhận diện ảnh chụp màn hình buổi học theo tỉ lệ màn hình điện thoại', () => {
    const res = evaluateImageFeatures({
      uri: 'file:///screen.png',
      width: 1170,
      height: 2532,
      fileSize: 400 * 1024,
    });
    expect(res.label).toBe('SCREENSHOT_EVIDENCE');
  });

  it('classifySkillOnDevice phân loại đúng danh mục kỹ năng và hình thức', () => {
    const coding = classifySkillOnDevice('Mình cần người hướng dẫn lập trình React Native qua Zoom');
    expect(coding.categoryName).toBe('Lập trình');
    expect(coding.suggestedFormat).toBe('ONLINE');
    expect(coding.confidence).toBeGreaterThan(0.7);

    const music = classifySkillOnDevice('Cần tìm bạn dạy đàn guitar cơ bản trực tiếp tại nhà');
    expect(music.categoryName).toBe('Nghệ thuật');
    expect(music.suggestedFormat).toBe('OFFLINE');
  });
});
