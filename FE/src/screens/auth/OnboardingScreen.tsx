import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@constants/Colors';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Time Credit',
    subtitle: 'Mỗi giờ hỗ trợ = 1 Time Credit',
    description: 'Không dùng tiền — bạn đổi thời gian và kỹ năng. Giúp người khác 1 giờ, nhận về 1 Time Credit để dùng khi bạn cần.',
    bgCard: '#ECFDF5', // Light green
  },
  {
    id: '2',
    title: 'Chia sẻ kỹ năng',
    subtitle: 'Ai cũng có điều gì đó để dạy',
    description: 'Lập trình, nấu ăn, thiết kế, ngoại ngữ... Đăng ký kỹ năng của bạn và kết nối với người cần. AI sẽ gợi ý người phù hợp nhất.',
    bgCard: '#FFF7ED', // Light orange
  },
  {
    id: '3',
    title: 'Cộng đồng tin cậy',
    subtitle: 'Được xây dựng trên sự tin tưởng',
    description: 'Xác minh OTP và QR khi gặp mặt. Đánh giá đa chiều sau mỗi buổi. Huy hiệu và điểm uy tín giúp bạn nổi bật.',
    bgCard: '#F0FDF4', // Light green
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.card, { backgroundColor: item.bgCard }]}>
          {/* Vùng này ban đầu chứa các Icon hình ảnh (mình đã loại bỏ theo yêu cầu của bạn) */}
          <Text style={styles.placeholderText}>HourLink</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={[
            styles.subtitle, 
            { color: item.id === '2' ? Colors.accent : (item.id === '3' ? '#0284C7' : Colors.primary) }
          ]}>
            {item.subtitle}
          </Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
                currentIndex === index && index === 1 && { backgroundColor: Colors.accent } // Orange dot for 2nd screen
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Bắt đầu ngay' : 'Tiếp theo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  slide: {
    width,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  card: {
    height: height * 0.4,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  placeholderText: {
    color: 'rgba(0,0,0,0.05)',
    fontSize: 40,
    fontWeight: 'bold',
  },
  textContainer: {
    paddingRight: Spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Fonts.bold,
  }
});
