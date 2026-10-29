import { View, Text } from 'react-native'
import clsx from 'clsx'
import type { Dayjs } from 'dayjs'
import { getCardDate } from '@/lib/applications'
import LineBadge from '@/components/LineBadge'
import LineTrack from '@/components/LineTrack'
import { colors } from '@/constants/theme'
import { useLine } from '@/lib/lines'
import { hot, tintedCard } from '@/lib/surfaces'

// One line in the list: code, name and the date that matters, with a small route map underneath
const ApplicationCard = ({ application, now }: { application: Application; now: Dayjs }) => {
  const date = getCardDate(application, now)
  const line = useLine(application.id)

  return (
    <View className="rounded-[20px] border border-border p-3.5" style={tintedCard(line.color)}>
      <View className="flex-row items-center gap-3">
        <LineBadge id={application.id} />
        <View className="app-card-body">
          <Text className="app-card-title" numberOfLines={1}>{application.title}</Text>
          <Text className="app-card-org" numberOfLines={1}>{application.organization}</Text>
        </View>
        {date && (
          <View className="rounded-full px-2.5 py-1" style={date.urgent ? hot() : { backgroundColor: colors.muted }}>
            <Text className={clsx('text-[11px] font-sans-bold', date.urgent ? 'text-white' : 'text-primary')}>{date.label}</Text>
          </View>
        )}
      </View>
      <View className="ml-11.5 mt-3">
        <LineTrack application={application} compact />
      </View>
    </View>
  )
}

export default ApplicationCard
