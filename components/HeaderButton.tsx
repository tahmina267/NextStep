import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, View } from 'react-native'
import { colors } from '@/constants/theme'
import { brand } from '@/lib/surfaces'

const useNative = Platform.OS !== 'web'

type Kind = 'sparkle' | 'bell' | 'plus'

type Props = {
  kind: Kind
  onPress: () => void
  accessibilityLabel: string
  children: ReactNode
  // The bell's dot, shown when there are reminders to come
  showDot?: boolean
  dark?: boolean
}

// The round buttons at the top of Home, each with a small motion of its own, played when tapped
// (or hovered with a mouse): the sparkle twinkles, the bell rings, the plus turns.
// They also dip a little under the finger. "Reduce motion" keeps only the dip
const HeaderButton = ({ kind, onPress, accessibilityLabel, children, showDot, dark }: Props) => {
  const [press] = useState(() => new Animated.Value(1))
  const [idle] = useState(() => new Animated.Value(0))
  const [turn] = useState(() => new Animated.Value(0))
  const [dot] = useState(() => new Animated.Value(1))
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {})
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => sub.remove()
  }, [])

  // The button's own motion, played once per tap on a phone (and on hover with a mouse): short and
  // quick, as tap feedback should be, instead of looping and pulling attention from the content
  const play = () => {
    if (reduceMotion) return
    idle.stopAnimation()
    idle.setValue(0)
    if (kind === 'sparkle') {
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 160, easing: Easing.out(Easing.back(2)), useNativeDriver: useNative }),
        Animated.timing(idle, { toValue: 0, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: useNative }),
      ]).start()
    } else if (kind === 'bell') {
      Animated.sequence(
        [1, -0.7, 0.4, -0.2, 0].map((value) =>
          Animated.timing(idle, { toValue: value, duration: 70, easing: Easing.inOut(Easing.quad), useNativeDriver: useNative }),
        ),
      ).start()
      Animated.sequence([
        Animated.timing(dot, { toValue: 1.8, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: useNative }),
        Animated.timing(dot, { toValue: 1, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: useNative }),
      ]).start()
    }
  }

  const hoverIn = () => {
    play()
    if (kind === 'plus' && !reduceMotion) Animated.spring(turn, { toValue: 1, useNativeDriver: useNative, speed: 20, bounciness: 8 }).start()
    Animated.spring(press, { toValue: 1.08, useNativeDriver: useNative, speed: 30, bounciness: 8 }).start()
  }
  const hoverOut = () => {
    if (kind === 'plus') Animated.spring(turn, { toValue: 0, useNativeDriver: useNative, speed: 16, bounciness: 6 }).start()
    Animated.spring(press, { toValue: 1, useNativeDriver: useNative, speed: 30, bounciness: 6 }).start()
  }

  const pressIn = () => {
    // Phones have no cursor, so the motion plays on touch
    if (Platform.OS !== 'web') play()
    Animated.spring(press, { toValue: 0.86, useNativeDriver: useNative, speed: 40, bounciness: 0 }).start()
    if (kind === 'plus') Animated.spring(turn, { toValue: 1, useNativeDriver: useNative, speed: 18, bounciness: 8 }).start()
  }
  const pressOut = () => {
    Animated.spring(press, { toValue: 1, useNativeDriver: useNative, speed: 20, bounciness: 12 }).start()
    if (kind === 'plus') Animated.spring(turn, { toValue: 0, useNativeDriver: useNative, speed: 14, bounciness: 6 }).start()
  }

  const iconMotion =
    kind === 'sparkle'
      ? [
          { rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '18deg'] }) },
          { scale: idle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) },
        ]
      : kind === 'bell'
        ? [{ rotate: idle.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] }) }]
        : [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }]

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} onHoverIn={hoverIn} onHoverOut={hoverOut} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={4}>
      <Animated.View
        className={dark ? 'home-icon-button-primary' : 'home-icon-button'}
        style={[{ transform: [{ scale: press }] }, dark ? brand() : null]}
      >
        {/* The bell swings from its top, like a real bell */}
        <Animated.View style={{ transform: iconMotion, transformOrigin: kind === 'bell' ? '50% 15%' : '50% 50%' }}>
          {children}
        </Animated.View>
        {kind === 'bell' && showDot && (
          <View className="absolute right-2.5 top-2" pointerEvents="none">
            <Animated.View
              className="size-2 rounded-full"
              style={{ backgroundColor: colors.accent, opacity: 0.35, position: 'absolute', transform: [{ scale: dot }] }}
            />
            <View className="size-2 rounded-full" style={{ backgroundColor: colors.accent }} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

export default HeaderButton
