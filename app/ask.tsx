import { useRef, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import clsx from 'clsx'
import { colors } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { useApplications } from '@/lib/applications-store'
import { findApplication } from '@/lib/applications'
import { askQuestion, type AnswerSource } from '@/lib/ai'
import Ionicons from '@expo/vector-icons/Ionicons'
import { brand, wash } from '@/lib/surfaces'

const SafeAreaView = styled(RNSafeAreaView)

type Message = {
  id: string
  role: 'user' | 'model'
  text: string
  // The excerpts this answer cites, shown under it
  sources?: AnswerSource[]
  // Shown in the chat but never sent back to the AI as history
  isError?: boolean
}

const SUGGESTIONS = {
  all: ['Which applications close this month?', 'Which jobs need React Native?', 'What should I prepare for my interviews?'],
  one: ['Summarize the requirements', 'What documents do I need?', 'What might they ask in the interview?'],
}

// "[2]" and "[1, 3]" both count as citations
const citedNumbers = (answer: string) =>
  new Set([...answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((match) => match[1].split(',').map(Number)))

// Chat over the user's own applications (RAG): answers come from their saved circulars and notes.
// Opened with `applicationId`, it only searches that one application
const Ask = () => {
  const router = useRouter()
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>()
  const { user, initializing } = useAuth()
  const { applications } = useApplications()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const listRef = useRef<FlatList<Message>>(null)

  if (initializing) return null
  if (!user) return <Redirect href="/sign-in" />

  const scoped = applicationId ? findApplication(applications, applicationId) : undefined
  const add = (message: Omit<Message, 'id'>) =>
    setMessages((current) => [...current, { ...message, id: `${current.length}-${Date.now()}` }])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || isThinking) return
    const history = messages.filter((message) => !message.isError).map(({ role, text }) => ({ role, text }))
    add({ role: 'user', text: question })
    setDraft('')
    setIsThinking(true)
    try {
      const { answer, sources } = await askQuestion({ question, history, applications, applicationId: scoped?.id })
      const cited = citedNumbers(answer)
      add({ role: 'model', text: answer, sources: sources.filter((source) => cited.has(source.n)) })
    } catch (error) {
      add({ role: 'model', text: error instanceof Error ? error.message : 'Something went wrong', isError: true })
    } finally {
      setIsThinking(false)
    }
  }

  const openSource = (source: AnswerSource) => {
    if (source.applicationId && findApplication(applications, source.applicationId)) {
      router.push({ pathname: '/application/[id]', params: { id: source.applicationId } })
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="modal-header">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full" style={wash()}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="modal-title" accessibilityRole="header">Ask NextStep</Text>
              <Text className="text-xs font-sans-medium text-muted-foreground" numberOfLines={1}>
                {scoped ? `About ${scoped.title} · ${scoped.organization}` : 'Answers from your saved circulars and notes'}
              </Text>
            </View>
          </View>
          <Pressable className="modal-close" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
            <Text className="modal-close-text">✕</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerClassName="grow gap-3 px-5 py-4"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            // A welcome card on the wash, with the suggestions as white cards to tap
            <View className="gap-2 rounded-[26px] p-3" style={wash()}>
              <View className="items-center gap-2 px-3 pb-2 pt-4">
                <View className="size-14 items-center justify-center rounded-full bg-card">
                  <Ionicons name="sparkles" size={26} color={colors.accent} />
                </View>
                <Text className="text-center text-lg font-sans-extrabold text-primary">
                  {scoped ? 'Ask about this application' : 'Ask anything about your applications'}
                </Text>
                <Text className="text-center text-[13px] font-sans-medium text-muted-foreground">
                  Answers come from the circulars and notes you&apos;ve saved, with the source for each point.
                </Text>
              </View>
              {SUGGESTIONS[scoped ? 'one' : 'all'].map((suggestion, index) => (
                <Pressable
                  key={suggestion}
                  className="flex-row items-center gap-3 rounded-[18px] bg-card px-3.5 py-3"
                  onPress={() => send(suggestion)}
                  accessibilityRole="button"
                >
                  <View className="size-9 items-center justify-center rounded-[12px]" style={{ backgroundColor: [colors.job, colors.university, colors.professor][index % 3] }}>
                    <Ionicons
                      name={(['calendar-outline', 'search-outline', 'bulb-outline'] as const)[index % 3]}
                      size={17}
                      color={[colors.jobStrong, colors.universityStrong, colors.professorStrong][index % 3]}
                    />
                  </View>
                  <Text className="flex-1 text-sm font-sans-bold text-primary">{suggestion}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <View className={clsx('max-w-[88%] gap-2', item.role === 'user' ? 'self-end' : 'self-start')}>
              <View
                className={clsx(
                  'px-4 py-3',
                  item.role === 'user' ? 'rounded-[20px] rounded-br-md bg-primary' : 'rounded-[20px] rounded-bl-md border border-border bg-card',
                  item.isError && 'border-destructive',
                )}
              >
                <Text
                  className={clsx('text-[15px] font-sans-medium', item.isError ? 'text-destructive' : item.role === 'user' ? 'text-on-primary' : 'text-primary')}
                  style={{ lineHeight: 22 }}
                  selectable
                >
                  {item.text}
                </Text>
              </View>
              {item.sources && item.sources.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5">
                  {item.sources.map((source) => (
                    <Pressable
                      key={source.n}
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: colors.job }}
                      onPress={() => openSource(source)}
                      accessibilityRole="link"
                      accessibilityLabel={`Source ${source.n}: ${source.label}, ${source.section ?? ''}`}
                    >
                      <Text className="text-xs font-sans-bold" style={{ color: colors.jobStrong }} numberOfLines={1}>
                        [{source.n}] {source.label.split(': ').pop()} · {source.section}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            isThinking ? (
              <View className="mt-1 flex-row items-center gap-2 self-start rounded-full border border-border bg-card px-3.5 py-2">
                <ActivityIndicator size="small" color={colors.accent} />
                <Text className="text-[13px] font-sans-semibold text-muted-foreground">Searching your applications…</Text>
              </View>
            ) : null
          }
        />

        {/* One rounded box with the send button inside, like a messaging app */}
        <View className="px-4 pb-4 pt-2">
          <View className="flex-row items-center gap-2 rounded-[26px] border border-border bg-card py-1.5 pl-4 pr-1.5">
          <TextInput
            className="max-h-32 flex-1 py-2.5 text-[15px] font-sans-medium text-primary"
            // One line when empty (the browser makes a two-row box otherwise), and no browser focus ring
            numberOfLines={1}
            style={Platform.OS === 'web' ? ({ outlineStyle: 'none', resize: 'none' } as object) : undefined}
            value={draft}
            onChangeText={setDraft}
            placeholder={scoped ? 'Ask about this application' : 'Ask about your applications'}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Pressable
            className={clsx('size-11 items-center justify-center rounded-full', (!draft.trim() || isThinking) && 'opacity-30')}
            style={brand()}
            onPress={() => send(draft)}
            disabled={!draft.trim() || isThinking}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !draft.trim() || isThinking, busy: isThinking }}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Ask
