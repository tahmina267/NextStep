import { useEffect, useState, type ComponentProps } from 'react'
import { Animated, Easing, Image, Platform, Pressable, Text, View, type ImageSourcePropType } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, components } from '@/constants/theme'
import { gradient } from '@/lib/surfaces'

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

// The "Meniscus" shape in the app's Metro colours: white bar, grey icons, a bubble in each tab's
// line colour with a white icon
const BUBBLE_ICON = '#FFFFFF'
// How far above the bar the backdrop starts: past the top of the bubble and its glow
const BACKDROP_ABOVE = 48
// From the line colour set in lib/lines
// Each tab's bubble is a two-colour gradient from the "Gradient Combinations" cheat sheet;
// the first colour also tints the tab's name and glow
const TAB_GRADIENTS = [
  ['#667EEA', '#764BA2'],
  ['#FF6EC7', '#7873F5'],
  ['#11998E', '#38EF7D'],
  ['#FF9966', '#FF5E62'],
]
const TAB_COLORS = TAB_GRADIENTS.map(([from]) => from)

const BAR_HEIGHT = 66
const RADIUS = 22
// Side padding inside the bar, so the first and last notch stay clear of the rounded corners
const PAD = 20
const BUBBLE = 52
// The bubble's centre sits just above the bar's top edge
const BUBBLE_CENTER = -2
// The notch (meniscus) the bubble floats in: half-width and depth
const NOTCH_HALF = 34
const NOTCH_DEPTH = 31
const SHOULDER = 8

// The bar's outline with a smooth dip centred on x
const barPath = (width: number, x: number) => {
  const h = BAR_HEIGHT
  const r = RADIUS
  const l = x - NOTCH_HALF
  const rr = x + NOTCH_HALF
  return [
    `M ${r} 0`,
    `L ${l - SHOULDER} 0`,
    `C ${l} 0 ${l + 2} ${NOTCH_DEPTH} ${x} ${NOTCH_DEPTH}`,
    `C ${rr - 2} ${NOTCH_DEPTH} ${rr} 0 ${rr + SHOULDER} 0`,
    `L ${width - r} 0`,
    `Q ${width} 0 ${width} ${r}`,
    `L ${width} ${h - r}`,
    `Q ${width} ${h} ${width - r} ${h}`,
    `L ${r} ${h}`,
    `Q 0 ${h} 0 ${h - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    'Z',
  ].join(' ')
}

// Bottom navigation in the "Meniscus" style: the active tab rises into a glowing bubble that floats
// in a notch cut into the bar; bubble, notch and label glide to whichever tab is tapped
const MeniscusTabBar = ({ state, descriptors, navigation, icons }: TabBarProps & { icons: Record<string, ImageSourcePropType> }) => {
  const insets = useSafeAreaInsets()
  // Read here, not at load, so they follow light and dark mode
  const BAR = colors.card
  const BAR_EDGE = colors.border
  const ICON = colors.mutedForeground
  const PAGE = colors.background
  const bottomGap = Math.max(insets.bottom, components.tabBar.horizontalInset)
  const [width, setWidth] = useState(0)
  // Created once; React Compiler doesn't allow reading refs while rendering
  const [position] = useState(() => new Animated.Value(state.index))
  const [pop] = useState(() => new Animated.Value(1))
  const [notchX, setNotchX] = useState<number | null>(null)
  const count = state.routes.length
  const tabWidth = width > 0 ? (width - PAD * 2) / count : 0
  const centerOf = (index: number) => PAD + tabWidth * index + tabWidth / 2

  useEffect(() => {
    // Slide to the new tab with a soft spring, and re-pop the bubble as it lands
    pop.setValue(0.5)
    Animated.parallel([
      Animated.spring(position, { toValue: state.index, useNativeDriver: false, damping: 15, stiffness: 150, mass: 0.9 }),
      Animated.timing(pop, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(2.2)), useNativeDriver: false }),
    ]).start()
  }, [state.index, position, pop])

  // The notch is drawn in SVG, so it follows the animated position through a listener
  useEffect(() => {
    if (!tabWidth) return
    const id = position.addListener(({ value }) => setNotchX(PAD + tabWidth * value + tabWidth / 2))
    return () => position.removeListener(id)
  }, [position, tabWidth])

  const inputRange = state.routes.map((_, i) => i)
  const many = count > 1
  const slide = position.interpolate({
    inputRange: many ? inputRange : [0, 1],
    outputRange: many ? inputRange.map((i) => centerOf(i) - BUBBLE / 2) : [0, 0],
  })
  const labelSlide = position.interpolate({
    inputRange: many ? inputRange : [0, 1],
    outputRange: many ? inputRange.map((i) => centerOf(i) - tabWidth / 2) : [0, 0],
  })
  const bubbleColor = position.interpolate({
    inputRange: many ? inputRange : [0, 1],
    outputRange: many ? state.routes.map((_, i) => TAB_COLORS[i % TAB_COLORS.length]) : [TAB_COLORS[0], TAB_COLORS[0]],
  })
  const activeColor = TAB_COLORS[state.index % TAB_COLORS.length]
  const activeRoute = state.routes[state.index]
  const activeTitle = descriptors[activeRoute.key]?.options.title ?? activeRoute.name
  const x = notchX ?? (tabWidth ? centerOf(state.index) : 0)

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: components.tabBar.horizontalInset,
        right: components.tabBar.horizontalInset,
        bottom: bottomGap,
        height: BAR_HEIGHT,
      }}
    >
      {/* A backdrop in the page colour from above the bubble to the screen's bottom edge, so the list
          scrolling behind never shows through the notch or around the bar */}
      <View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: -components.tabBar.horizontalInset, right: -components.tabBar.horizontalInset, top: -BACKDROP_ABOVE, bottom: -bottomGap },
          Platform.OS === 'web'
            ? ({ backgroundImage: `linear-gradient(to bottom, ${PAGE}00 0px, ${PAGE} 22px)` } as object)
            : { backgroundColor: PAGE },
        ]}
      />
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          { height: BAR_HEIGHT, flexDirection: 'row', paddingHorizontal: PAD },
          Platform.OS === 'web'
            ? ({ filter: 'drop-shadow(0 10px 22px rgba(14,14,16,0.10))' } as object)
            : { shadowColor: '#0E0E10', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
        ]}
      >
        {width > 0 && (
          <Svg width={width} height={BAR_HEIGHT} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
            <Path d={barPath(width, x)} fill={BAR} stroke={BAR_EDGE} strokeWidth={1} />
          </Svg>
        )}

        {/* The tab's name, under the bubble inside the dip */}
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', bottom: 9, left: 0, width: tabWidth, alignItems: 'center', transform: [{ translateX: labelSlide }] }}
          >
            <Text className="text-[11px] font-sans-bold" style={{ color: activeColor, letterSpacing: 0.2 }} numberOfLines={1}>
              {activeTitle}
            </Text>
          </Animated.View>
        )}

        {state.routes.map((route, index) => {
          const focused = state.index === index
          const options = descriptors[route.key]?.options ?? {}
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
          }
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              className="flex-1 items-center justify-center"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title ?? route.name}
            >
              {/* The active icon lives in the bubble, so its spot in the row stays empty */}
              <Image source={icons[route.name]} resizeMode="contain" tintColor={ICON} style={{ width: 22, height: 22, opacity: focused ? 0 : 1 }} />
            </Pressable>
          )
        })}

        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: BUBBLE_CENTER - BUBBLE / 2,
                left: 0,
                width: BUBBLE,
                height: BUBBLE,
                borderRadius: BUBBLE / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bubbleColor,
                overflow: 'hidden',
                transform: [{ translateX: slide }],
              },
              Platform.OS === 'web'
                ? ({ boxShadow: `0 6px 16px ${activeColor}66, 0 0 34px ${activeColor}40` } as object)
                : { shadowColor: activeColor, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
            ]}
          >
            {/* One gradient layer per tab, cross-fading as the bubble slides from tab to tab */}
            {state.routes.map((route, i) => {
              const [from, to] = TAB_GRADIENTS[i % TAB_GRADIENTS.length]
              return (
                <Animated.View
                  key={route.key}
                  pointerEvents="none"
                  style={[
                    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
                    gradient(`linear-gradient(135deg, ${from} 0%, ${to} 100%)`, from),
                    { opacity: position.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' }) },
                  ]}
                />
              )
            })}
            <Animated.View style={{ transform: [{ scale: pop }] }}>
              <Image source={icons[activeRoute.name]} resizeMode="contain" tintColor={BUBBLE_ICON} style={{ width: 22, height: 22 }} />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </View>
  )
}

export default MeniscusTabBar
