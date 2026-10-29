import { useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import {styled} from 'nativewind';
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { useRouter } from 'expo-router'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useApplications } from '@/lib/applications-store'
import { icons } from '@/constants/icons'
import { colors } from '@/constants/theme'
import { getCalendarEvents, getMonthGrid, groupEventsByDay } from '@/lib/applications'
import { pale, wash } from '@/lib/surfaces'

const SafeAreaView = styled(RNSafeAreaView);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Read when drawn, so they follow light and dark mode
const typeColor = (type: ApplicationType) =>
  ({ job: colors.jobStrong, university: colors.universityStrong, professor: colors.professorStrong })[type]

const LEGEND: { type: ApplicationType; label: string }[] = [
  { type: 'job', label: 'Job' },
  { type: 'university', label: 'University' },
  { type: 'professor', label: 'Professor' },
]

const Calendar = () => {
  const router = useRouter()
  const { applications } = useApplications()
  const today = dayjs()
  const [month, setMonth] = useState(today.startOf('month'))
  const [selected, setSelected] = useState(today)

  const eventsByDay = groupEventsByDay(getCalendarEvents(applications))
  const agenda = eventsByDay[selected.format('YYYY-MM-DD')] ?? []
  const isSelectedToday = selected.isSame(today, 'day')

  const changeMonth = (step: number) => setMonth((current) => current.add(step, 'month'))

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-5 pt-5 pb-30" showsVerticalScrollIndicator={false}>
        <View className="cal-header">
          <Text className="cal-month">{month.format('MMMM YYYY')}</Text>
          <View className="cal-nav">
            <Pressable className="detail-back" onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel="Previous month">
              <Image source={icons.back} className="size-4.5" tintColor={colors.primary} />
            </Pressable>
            <Pressable className="detail-back" onPress={() => changeMonth(1)} accessibilityRole="button" accessibilityLabel="Next month">
              <Image source={icons.back} className="size-4.5" tintColor={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
          </View>
        </View>

        <View className="cal-card border-0" style={wash()}>
          <View className="cal-weekdays">
            {WEEKDAYS.map((day) => (
              <Text key={day} className="cal-weekday">{day}</Text>
            ))}
          </View>
          <View className="cal-grid">
            {getMonthGrid(month).map((day, index) => {
              if (!day) return <View key={`blank-${index}`} className="cal-cell" />

              const isSelected = day.isSame(selected, 'day')
              const isToday = day.isSame(today, 'day')
              const events = eventsByDay[day.format('YYYY-MM-DD')] ?? []
              // One dot per type on this day, so three jobs don't hide a university deadline
              const dotTypes = [...new Set(events.map((event) => event.type))]
              return (
                <View key={day.date()} className="cal-cell">
                  <Pressable
                    className={clsx('cal-day', isSelected ? 'cal-day-selected' : isToday && 'cal-day-today')}
                    onPress={() => setSelected(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.format('MMMM D')}${events.length ? `, ${events.length} ${events.length === 1 ? 'event' : 'events'}` : ''}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text className={clsx('cal-day-text', (isSelected || isToday) && 'cal-day-text-strong', isSelected && 'cal-day-text-selected')}>
                      {day.date()}
                    </Text>
                    <View className="cal-dots">
                      {dotTypes.map((type) => (
                        <View key={type} className="cal-dot" style={{ backgroundColor: typeColor(type) }} />
                      ))}
                    </View>
                  </Pressable>
                </View>
              )
            })}
          </View>
        </View>

        <View className="cal-legend">
          {LEGEND.map((item) => (
            <View key={item.type} className="cal-legend-item">
              <View className="cal-legend-dot" style={{ backgroundColor: typeColor(item.type) }} />
              <Text className="cal-legend-text">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* The chosen day, styled like This week on Home */}
        <View className="mt-4.5 gap-2 rounded-[26px] p-3" style={wash()}>
          <View className="flex-row items-center justify-between px-1.5 pb-1 pt-0.5">
            <Text className="text-base font-sans-extrabold text-primary">
              {selected.format('dddd')}{isSelectedToday ? ' · Today' : ''}
            </Text>
            <View className="rounded-full bg-card/80 px-3 py-1">
              <Text className="text-xs font-sans-bold text-primary">{selected.format('MMM D')}</Text>
            </View>
          </View>
          {agenda.length > 0 ? (
            agenda.map((event) => {
              const color = typeColor(event.type)
              const time = dayjs(event.date)
              return (
                <Pressable
                  key={event.id}
                  className="flex-row items-center gap-3 rounded-[18px] bg-card p-2.5"
                  onPress={() => router.push({ pathname: '/application/[id]', params: { id: event.applicationId } })}
                  accessibilityRole="button"
                >
                  <View className="h-12 flex-row items-baseline justify-center gap-1 rounded-[14px] px-3 pt-3.5" style={{ backgroundColor: pale(color) }}>
                    <Text className="text-[15px] font-sans-extrabold text-primary">{time.format('h:mm')}</Text>
                    <Text className="text-[11px] font-sans-extrabold" style={{ color }}>{time.format('A')}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-[15px] font-sans-bold text-primary" numberOfLines={1}>{event.title}</Text>
                    <Text className="text-xs font-sans-medium text-muted-foreground" numberOfLines={1}>{event.meta}</Text>
                  </View>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: color }}>
                    <Text className="text-[11px] font-sans-bold text-white">{LEGEND.find((item) => item.type === event.type)?.label}</Text>
                  </View>
                </Pressable>
              )
            })
          ) : (
            <View className="rounded-[18px] bg-card p-4">
              <Text className="text-sm font-sans-medium text-muted-foreground">Nothing due. Tap a day with a dot.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Calendar
