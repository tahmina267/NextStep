import { View, Text } from 'react-native'
import { useLine } from '@/lib/lines'

// The round line code (J1, U1, P1…) in the application's line colour
const LineBadge = ({ id, size = 34 }: { id?: string; size?: number }) => {
  const line = useLine(id)

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: line.color }}
      accessibilityLabel={line.code}
    >
      <Text className="font-sans-extrabold" style={{ color: line.textColor, fontSize: Math.round(size * 0.35) }}>
        {line.code}
      </Text>
    </View>
  )
}

export default LineBadge
