import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@constants/Colors';
import { initialsOf, avatarColorOf } from '@utils/chatFormat';

interface AvatarProps {
  /** URL ảnh đại diện (Cloudinary). Không có thì rơi về avatar chữ */
  uri?: string | null;
  /** Họ tên — dùng để lấy chữ cái đầu và màu nền ổn định */
  name?: string;
  size?: number;
  /** Hiện chấm xanh trạng thái ở góc dưới phải */
  showDot?: boolean;
  /** Viền trắng quanh avatar (dùng khi đặt trên nền màu) */
  ring?: boolean;
}

/**
 * Avatar — hiển thị ảnh đại diện thống nhất trong toàn app.
 *
 * Ưu tiên ảnh thật của người dùng; chỉ khi không có ảnh mới hiện avatar chữ.
 * Nhờ vậy avatar ở màn chat trùng khớp với avatar ở hồ sơ.
 */
export default function Avatar({ uri, name, size = 44, showDot = false, ring = false }: AvatarProps) {
  const color = avatarColorOf(name);
  const dotSize = Math.max(9, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            { width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.bgCard },
            ring && styles.ring,
          ]}
        />
      ) : (
        <View
          style={[
            styles.letter,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: color.bg },
            ring && styles.ring,
          ]}
        >
          <Text style={{ color: color.fg, fontSize: size * 0.36, fontWeight: '700' }}>
            {initialsOf(name)}
          </Text>
        </View>
      )}

      {showDot && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              right: -1,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  letter: { justifyContent: 'center', alignItems: 'center' },
  ring: { borderWidth: 2, borderColor: '#FFFFFF' },
  dot: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
