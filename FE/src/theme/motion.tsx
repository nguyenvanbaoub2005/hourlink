import React, { useEffect } from 'react';
import { InteractionManager, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Material 3 Spring Curves for 60fps Ergonomic Animations
 */
export const M3Spring = {
  emphasized: {
    damping: 20,
    stiffness: 180,
    mass: 1,
  },
  standard: {
    damping: 26,
    stiffness: 220,
    mass: 1,
  },
  subtle: {
    damping: 30,
    stiffness: 250,
    mass: 1,
  },
};

/**
 * Chạy tác vụ sau khi animation chuyển màn hình hoàn tất (giữ 60fps tuyệt đối)
 */
export function runAfterTransition(task: () => void) {
  const handle = InteractionManager.runAfterInteractions(() => {
    task();
  });
  return () => handle.cancel();
}

/**
 * 60fps Tactile Feedback Button (Phản hồi xúc giác co dãn mượt mà 60fps)
 */
interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  activeScale?: number;
  style?: StyleProp<ViewStyle>;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  activeScale = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        scale.value = withSpring(activeScale, M3Spring.standard);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, M3Spring.standard);
        onPressOut?.(e);
      }}
      style={style}
      {...rest}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

/**
 * 60fps Fade-in + Slide-up Container (Xuất hiện mượt mà chuẩn Material 3)
 */
interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 350,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
      translateY.value = withSpring(0, M3Spring.standard);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
