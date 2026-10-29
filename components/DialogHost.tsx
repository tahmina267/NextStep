import { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, Text, View } from 'react-native'
import { registerDialogHost, type DialogRequest } from '@/lib/dialog'

// The web dialog behind showMessage / confirmAction / openLink in lib/dialog (phones use Alert)
const DialogHost = () => {
  const [request, setRequest] = useState<DialogRequest | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => registerDialogHost((next) => {
    setCopied(false)
    setRequest(next)
  }), [])

  if (Platform.OS !== 'web' || !request) return null

  const close = (confirmed: boolean) => {
    request.onAnswer?.(confirmed)
    setRequest(null)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request.link ?? '')
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const isWebLink = !!request.link && /^https?:\/\//.test(request.link)

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close(false)}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-[360px] gap-3 rounded-[20px] border border-border bg-card p-5" accessibilityRole="alert">
          <Text className="text-lg font-sans-bold text-primary">{request.title}</Text>
          {request.message ? <Text className="text-sm font-sans-medium text-muted-foreground">{request.message}</Text> : null}
          {request.link ? (
            <View className="gap-2 rounded-xl bg-muted p-3">
              {isWebLink ? (
                <Text
                  // react-native-web turns href into a real link, which the browser always lets open
                  {...({ href: request.link, hrefAttrs: { target: '_blank', rel: 'noopener' } } as object)}
                  className="text-sm font-sans-bold text-urgent underline"
                  selectable
                >
                  {request.link}
                </Text>
              ) : (
                <Text className="text-sm font-sans-bold text-primary" selectable>{request.link}</Text>
              )}
              <Pressable onPress={copy} accessibilityRole="button">
                <Text className="text-xs font-sans-bold text-muted-foreground">{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
            </View>
          ) : null}
          <View className="mt-1 flex-row gap-2.5">
            {request.onAnswer && (
              <Pressable className="h-11 flex-1 items-center justify-center rounded-[14px] border border-border" onPress={() => close(false)} accessibilityRole="button">
                <Text className="text-sm font-sans-bold text-primary">Cancel</Text>
              </Pressable>
            )}
            <Pressable
              className={request.destructive ? 'h-11 flex-1 items-center justify-center rounded-[14px] bg-destructive' : 'h-11 flex-1 items-center justify-center rounded-[14px] bg-primary'}
              onPress={() => close(true)}
              accessibilityRole="button"
            >
              <Text className={request.destructive ? 'text-sm font-sans-bold text-white' : 'text-sm font-sans-bold text-on-primary'}>{request.confirmLabel ?? 'OK'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default DialogHost
