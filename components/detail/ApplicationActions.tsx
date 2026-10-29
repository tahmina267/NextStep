import { View, Text, Pressable } from 'react-native'
import { showMessage } from '@/lib/dialog'
import clsx from 'clsx'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { brand } from '@/lib/surfaces'
import { useApplications } from '@/lib/applications-store'
import { STAGES_BY_TYPE, STAGE_META } from '@/lib/applications'
import { SectionTitle } from '@/components/detail/DetailParts'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Please try again')

// Stage picker and the AI chat button, shown under every application's details (edit and delete live in the top bar)
const ApplicationActions = ({ application }: { application: Application }) => {
  const { updateApplication } = useApplications()
  // The listener in ApplicationsProvider redraws the screen straight from the local cache, even offline
  const changeStage = (stage: ApplicationStage) => {
    if (stage === application.stage) return
    try {
      updateApplication(application.id, { stage } as Partial<ApplicationInput>)
    } catch (error) {
      showMessage('Update failed', errorMessage(error))
    }
  }

  return (
    <View className="mt-6 gap-3">
      <SectionTitle>Move to stage</SectionTitle>
      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {STAGES_BY_TYPE[application.type].map((stage) => {
          const isCurrent = application.stage === stage
          return (
            <Pressable
              key={stage}
              className={clsx('reminder-chip', isCurrent && 'reminder-chip-on')}
              onPress={() => changeStage(stage)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isCurrent }}
            >
              <Text className="reminder-chip-text">{STAGE_META[stage].label}</Text>
            </Pressable>
          )
        })}
      </View>
      {/* The chat, searching only this application's circular and notes */}
      <Pressable
        className="mt-3 h-13 flex-row items-center justify-center gap-2 rounded-[18px]"
        style={brand()}
        onPress={() => router.push({ pathname: '/ask', params: { applicationId: application.id } })}
        accessibilityRole="button"
      >
        <Ionicons name="sparkles" size={17} color="#FFFFFF" />
        <Text className="text-base font-sans-bold text-white">Ask about this application</Text>
      </Pressable>
    </View>
  )
}

export default ApplicationActions
