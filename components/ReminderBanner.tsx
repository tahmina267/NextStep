import { useEffect, useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { onReminderBanner, tap, type WebReminder } from '@/lib/web-reminders'
import LineBadge from '@/components/LineBadge'

// On web, a reminder that comes due while the app is open slides in at the top, like a phone
// notification banner; tapping it opens the application
const ReminderBanner = () => {
  const [reminder, setReminder] = useState<WebReminder | null>(null)

  useEffect(() => onReminderBanner(setReminder), [])

  useEffect(() => {
    if (!reminder) return
    const timer = setTimeout(() => setReminder(null), 8000)
    return () => clearTimeout(timer)
  }, [reminder])

  if (Platform.OS !== 'web' || !reminder) return null

  return (
    <View className="absolute left-3 right-3 top-3 z-50" pointerEvents="box-none">
      <Pressable
        className="flex-row items-center gap-3 rounded-[18px] border border-border bg-card p-3.5"
        style={{ boxShadow: '0 10px 30px rgba(14,14,16,0.16)' } as object}
        onPress={() => {
          setReminder(null)
          tap(reminder.applicationId)
        }}
        accessibilityRole="alert"
      >
        <LineBadge id={reminder.applicationId} size={32} />
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-sans-bold uppercase tracking-[1px] text-muted-foreground">NextStep · now</Text>
          <Text className="text-sm font-sans-bold text-primary" numberOfLines={1}>{reminder.title}</Text>
          <Text className="text-xs font-sans-medium text-muted-foreground" numberOfLines={2}>{reminder.body}</Text>
        </View>
        <Pressable onPress={() => setReminder(null)} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10}>
          <Text className="text-base font-sans-bold text-muted-foreground">✕</Text>
        </Pressable>
      </Pressable>
    </View>
  )
}

export default ReminderBanner
