import { Fragment } from 'react'
import { View, Text } from 'react-native'
import { getSteps, type StepState } from '@/lib/applications'
import { useLine } from '@/lib/lines'
import { activeScheme, colors } from '@/constants/theme'

// Read when drawn, so the unfinished part of the line stays quiet in dark mode too
const todoColor = () => (activeScheme() === 'dark' ? '#4A4A55' : '#D2D2D8')
const railColor = () => colors.border

// A stage station: filled once passed, a ring for where the application is now
const Station = ({ state, color, big }: { state: StepState; color: string; big?: boolean }) => {
  if (state === 'current') {
    const size = big ? 24 : 15
    return <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: big ? 5 : 3.5, borderColor: color, backgroundColor: colors.card }} />
  }
  const size = big ? 16 : 10
  const fill = state === 'done' ? color : state === 'failed' ? '#6E6E76' : todoColor()
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: big && state === 'todo' ? colors.card : fill,
        borderWidth: big ? 3 : 0,
        borderColor: big && state === 'todo' ? todoColor() : colors.card,
      }}
    />
  )
}

// The stages drawn as a metro line. `compact` is the one-line version for list rows
const LineTrack = ({ application, compact }: { application: Application; compact?: boolean }) => {
  const line = useLine(application.id)
  const steps = getSteps(application)
  // The rail between two stations is coloured once the train has gone past it
  const passed = (index: number) => steps[index]?.state === 'done' && steps[index + 1]?.state !== 'todo'

  if (compact) {
    const current = steps.find((s) => s.state === 'current' || s.state === 'failed') ?? steps[steps.length - 1]
    return (
      <View className="flex-row items-center" accessibilityLabel={`Stage: ${current.label}`}>
        {steps.map((step, index) => (
          <Fragment key={step.label}>
            <Station state={step.state} color={line.color} />
            {index < steps.length - 1 && (
              <View className="h-[3px] flex-1" style={{ backgroundColor: passed(index) ? line.color : railColor() }} />
            )}
          </Fragment>
        ))}
        <Text className="ml-2.5 w-20 text-xs font-sans-bold text-primary" numberOfLines={1}>{current.label}</Text>
      </View>
    )
  }

  return (
    <View className="flex-row" accessibilityLabel="Progress">
      {steps.map((step, index) => (
        <View key={step.label} className="flex-1 items-center gap-1.5">
          <View className="h-6 w-full items-center justify-center">
            {/* Rail halves on each side of the station */}
            {index > 0 && (
              <View className="absolute left-0 h-[5px] w-1/2" style={{ backgroundColor: passed(index - 1) ? line.color : railColor() }} />
            )}
            {index < steps.length - 1 && (
              <View className="absolute right-0 h-[5px] w-1/2" style={{ backgroundColor: passed(index) ? line.color : railColor() }} />
            )}
            <Station state={step.state} color={line.color} big />
          </View>
          <Text
            className={step.state === 'current' ? 'text-xs font-sans-extrabold text-primary' : 'text-xs font-sans-semibold text-muted-foreground'}
            numberOfLines={1}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default LineTrack
