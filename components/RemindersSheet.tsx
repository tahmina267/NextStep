import { useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import dayjs, { type Dayjs } from 'dayjs'
import { colors } from '@/constants/theme'
import { useApplications } from '@/lib/applications-store'
import { getReminderNotifications, type ReminderNotification } from '@/lib/notifications'
import { deliver, getDeliveredReminders, requestWebPermission } from '@/lib/web-reminders'
import { ringNow } from '@/lib/alarms.web'
import { useLine } from '@/lib/lines'
import { formatTimeDistance } from '@/lib/applications'

const isWeb = Platform.OS === 'web'

type Row = { key: string; applicationId: string; title: string; body: string; date: Date; alarm: boolean }

// "Today", "Tomorrow", then the weekday for this week, then the date
const dayLabel = (date: Dayjs, now: Dayjs) => {
  const days = date.startOf('day').diff(now.startOf('day'), 'day')
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days < 7) return date.format('dddd')
  return date.format('ddd, MMM D')
}

// What kind of heads-up it is, from the titles lib/notifications gives them
const kindIcon = (row: Row): keyof typeof Ionicons.glyphMap => {
  if (row.alarm) return 'alarm-outline'
  if (row.title.startsWith('Time is over')) return 'flag-outline'
  if (row.title.startsWith('Time to follow up')) return 'mail-outline'
  return 'notifications-outline'
}

const ReminderRow = ({ row, now, past }: { row: Row; now: Dayjs; past?: boolean }) => {
  const line = useLine(row.applicationId)
  const date = dayjs(row.date)
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${line.color}1A` }}>
        <Ionicons name={kindIcon(row)} size={19} color={line.color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-sans-bold text-primary" numberOfLines={1}>{row.title}</Text>
        <Text className="text-xs font-sans-medium text-muted-foreground" numberOfLines={1}>
          <Text className="font-sans-bold" style={{ color: line.color }}>{line.code}</Text> · {row.body}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-xs font-sans-bold text-primary">{date.format('h:mm A')}</Text>
        <Text className="text-[11px] font-sans-medium text-muted-foreground">{past ? `${formatTimeDistance(row.date.toISOString(), now)} ago` : `in ${formatTimeDistance(row.date.toISOString(), now)}`}</Text>
      </View>
    </View>
  )
}

const DayGroups = ({ rows, now, past }: { rows: Row[]; now: Dayjs; past?: boolean }) => {
  const groups: { label: string; rows: Row[] }[] = []
  rows.forEach((row) => {
    const label = dayLabel(dayjs(row.date), now)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  })
  return (
    <>
      {groups.map((group) => (
        <View key={group.label} className="mt-3">
          <Text className="board-label mb-0.5">{group.label}</Text>
          <View className="rounded-[18px] border border-border bg-card px-3.5">
            {group.rows.map((row, i) => (
              <View key={row.key} className={i < group.rows.length - 1 ? 'border-b border-border' : ''}>
                <ReminderRow row={row} now={now} past={past} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  )
}

// Opened from the bell on Home: every reminder and alarm still to come, grouped by day,
// and on web the ones that already went off plus a way to try a reminder and an alarm
const RemindersSheet = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { applications } = useApplications()
  const [, refresh] = useState(0)
  const now = dayjs()
  const toRow = (n: ReminderNotification): Row => ({ key: n.identifier, applicationId: n.applicationId, title: n.title, body: n.body, date: n.date, alarm: n.alarm })
  const upcoming = getReminderNotifications(applications).slice(0, 30).map(toRow)
  const delivered = isWeb ? getDeliveredReminders().map((n, i) => ({ ...toRow(n), key: `${n.identifier}-${i}` })) : []
  const sample = applications[0]

  // Fires in a few seconds so there's time to look away from the sheet
  const test = (alarm: boolean) => {
    if (!sample) return
    requestWebPermission()
    onClose()
    setTimeout(() => {
      const body = `${sample.title} · ${sample.organization}`
      if (alarm) ringNow('Test alarm', body, sample.id)
      else deliver({ identifier: `test-${Date.now()}`, date: new Date(), title: 'Test reminder', body, applicationId: sample.id, alarm: false })
      refresh((n) => n + 1)
    }, 3000)
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      {/* Same width as the app on a wide screen, so the sheet doesn't stretch across the browser */}
      <View className="flex-1 w-full max-w-[480px] self-center">
        <Pressable className="flex-1 bg-black/40" onPress={onClose} accessibilityLabel="Close reminders" />
        <View className="max-h-[82%] rounded-t-3xl bg-background px-5 pb-8 pt-3">
          <View className="mb-2 h-1.5 w-11 self-center rounded-full bg-border" />
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-sans-bold text-primary" accessibilityRole="header">Reminders</Text>
              <Text className="text-xs font-sans-medium text-muted-foreground">
                {upcoming.length} coming up{isWeb ? ' · they go off while this page is open' : ''}
              </Text>
            </View>
            <Pressable className="modal-close" onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text className="modal-close-text">✕</Text>
            </Pressable>
          </View>

          <ScrollView className="mt-1" showsVerticalScrollIndicator={false}>
            {upcoming.length > 0 ? (
              <DayGroups rows={upcoming} now={now} />
            ) : (
              <Text className="home-empty-state">No reminders yet. Add them when you create or edit an application.</Text>
            )}

            {delivered.length > 0 && (
              <>
                <Text className="mt-5 text-sm font-sans-bold text-primary">Earlier</Text>
                <DayGroups rows={delivered} now={now} past />
              </>
            )}

            {isWeb && (
              <View className="mt-5 flex-row items-center gap-2">
                <Text className="flex-1 text-xs font-sans-medium text-muted-foreground">Try it now</Text>
                <Pressable className="h-9 flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3.5" onPress={() => test(false)} accessibilityRole="button">
                  <Ionicons name="notifications-outline" size={14} color={colors.primary} />
                  <Text className="text-xs font-sans-bold text-primary">Test reminder</Text>
                </Pressable>
                <Pressable className="h-9 flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3.5" onPress={() => test(true)} accessibilityRole="button">
                  <Ionicons name="alarm-outline" size={14} color={colors.primary} />
                  <Text className="text-xs font-sans-bold text-primary">Test alarm</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default RemindersSheet
