import { View, Text, Pressable, ScrollView } from 'react-native'
import {styled} from 'nativewind';
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { signOut } from "firebase/auth";
import clsx from 'clsx';
import dayjs from 'dayjs';
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useApplications } from '@/lib/applications-store';
import { FOLLOW_UP_DAYS, getInitials, getProfileStats } from '@/lib/applications';
import { getLines } from '@/lib/lines';
import { DEMO_MODE } from '@/lib/demo';
import { pale, tile as tileGradient, wash } from '@/lib/surfaces';
import { colors } from '@/constants/theme';
import { useAppearance, type AppearancePreference } from '@/lib/appearance';

const SafeAreaView = styled(RNSafeAreaView);
const StyledImage = styled(Image);

const PROVIDER_LABELS: Record<string, string> = {
  'google.com': 'Google',
  password: 'email and password',
};

const Profile = () => {
  const router = useRouter();
  const { user, demoSignOut } = useAuth();
  const { applications, resetDemo } = useApplications();
  const { preference, setPreference } = useAppearance();
  const stats = getProfileStats(applications);
  const lines = getLines(applications);

  const email = user?.email ?? '';
  // Email sign-ups have no display name, so fall back to the part before the @
  const name = user?.displayName || email.split('@')[0] || 'You';
  const providerId = user?.providerData[0]?.providerId ?? 'password';

  type IconName = keyof typeof Ionicons.glyphMap;

  const statTiles: { value: string; label: string; tint: string; color: string; icon: IconName }[] = [
    { value: String(stats.jobsApplied), label: 'Jobs applied', tint: colors.job, color: colors.jobStrong, icon: 'briefcase-outline' },
    { value: String(stats.interviews), label: 'Interviews', tint: colors.university, color: colors.universityStrong, icon: 'chatbubbles-outline' },
    { value: `${stats.professorsReplied}/${stats.professorsEmailed}`, label: 'Prof replies', tint: colors.professor, color: colors.professorStrong, icon: 'mail-open-outline' },
  ];

  // Each setting with an icon that says what it's about
  const settings: { title: string; detail: string; pill: string; color: string; icon: IconName }[] = [
    { title: 'Deadline alert', detail: 'When a deadline passes', pill: 'Always', color: colors.jobStrong, icon: 'alarm-outline' },
    { title: 'Follow-up nudge', detail: 'When a professor has not replied', pill: `${FOLLOW_UP_DAYS} days`, color: colors.universityStrong, icon: 'paper-plane-outline' },
    { title: 'Account', detail: `Signed in with ${PROVIDER_LABELS[providerId] ?? providerId}`, pill: DEMO_MODE ? 'Demo' : 'Firebase', color: colors.professorStrong, icon: 'person-circle-outline' },
  ];

  const handleSignOut = async () => {
    if (DEMO_MODE) demoSignOut?.();
    else await signOut(auth);
    router.replace('/sign-in');
  }

  const memberSince = user?.metadata?.creationTime ? dayjs(user.metadata.creationTime).format('YYYY') : dayjs().format('YYYY');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-5 pt-5 pb-30" showsVerticalScrollIndicator={false}>
        <Text className="apps-title">My profile</Text>

        {/* Who you are: a big avatar on the wash, with how long you've been here and how much you track */}
        <View className="mt-4 items-center rounded-[28px] px-5 pb-5 pt-6" style={wash()}>
          <View className="size-20 items-center justify-center overflow-hidden rounded-full bg-primary" style={{ borderWidth: 4, borderColor: colors.card }}>
            {user?.photoURL ? (
              <StyledImage source={{ uri: user.photoURL }} className="size-full" contentFit="cover" accessibilityLabel="Profile photo" />
            ) : (
              <Text className="text-2xl font-sans-extrabold text-on-primary">{getInitials(name)}</Text>
            )}
          </View>
          <Text className="mt-3 text-xl font-sans-extrabold text-primary" numberOfLines={1}>{name}</Text>
          {!!email && <Text className="text-sm font-sans-medium text-muted-foreground" numberOfLines={1}>{email}</Text>}
          <View className="mt-4 flex-row flex-wrap justify-center gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-1.5">
              <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
              <Text className="text-xs font-sans-bold text-primary">Member since {memberSince}</Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-full bg-card px-3 py-1.5" accessibilityLabel={`${applications.length} applications`}>
              <View className="flex-row">
                {Object.values(lines).slice(0, 5).map((line, i) => (
                  <View key={line.code} className="size-3 rounded-full" style={{ backgroundColor: line.color, marginLeft: i ? -4 : 0, borderWidth: 1.5, borderColor: colors.card }} />
                ))}
              </View>
              <Text className="text-xs font-sans-bold text-primary">{applications.length} applications</Text>
            </View>
          </View>
        </View>

        {/* The numbers, each with its own icon and tint */}
        <View className="mt-4 flex-row gap-2.5">
          {statTiles.map((tile, index) => (
            <View key={tile.label} className="flex-1 gap-3 rounded-[22px] p-3.5" style={tileGradient(index)}>
              <View className="size-9 items-center justify-center rounded-full bg-card">
                <Ionicons name={tile.icon} size={17} color={tile.color} />
              </View>
              <View>
                <Text className="text-2xl font-sans-extrabold text-primary">{tile.value}</Text>
                <Text className="text-xs font-sans-semibold text-muted-foreground">{tile.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="mb-2 ml-1 mt-6 text-xs font-sans-bold uppercase tracking-[1px] text-muted-foreground">Settings</Text>
        <View className="overflow-hidden rounded-[22px] border border-border bg-card">
          {settings.map((row, index) => (
            <View key={row.title} className={clsx('min-h-16 flex-row items-center gap-3 px-4 py-3', index < settings.length - 1 && 'border-b border-border')}>
              <View className="size-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: pale(row.color) }}>
                <Ionicons name={row.icon} size={19} color={row.color} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-sans-bold text-primary">{row.title}</Text>
                <Text className="text-xs font-sans-medium text-muted-foreground">{row.detail}</Text>
              </View>
              <View className="rounded-full bg-muted px-2.5 py-1">
                <Text className="text-xs font-sans-bold text-primary">{row.pill}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </View>
          ))}
        </View>

        {/* Light, dark, or follow the phone */}
        <Text className="mb-2 ml-1 mt-6 text-xs font-sans-bold uppercase tracking-[1px] text-muted-foreground">Appearance</Text>
        <View className="flex-row gap-1 rounded-[18px] border border-border bg-card p-1" accessibilityRole="radiogroup">
          {([
            { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
            { value: 'light', label: 'Light', icon: 'sunny-outline' },
            { value: 'dark', label: 'Dark', icon: 'moon-outline' },
          ] as { value: AppearancePreference; label: string; icon: IconName }[]).map((option) => {
            const isActive = preference === option.value
            return (
              <Pressable
                key={option.value}
                className={clsx('h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-[14px]', isActive && 'bg-primary')}
                onPress={() => setPreference(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons name={option.icon} size={16} color={isActive ? colors.onPrimary : colors.mutedForeground} />
                <Text className={clsx('text-sm font-sans-bold', isActive ? 'text-on-primary' : 'text-muted-foreground')}>{option.label}</Text>
              </Pressable>
            )
          })}
        </View>

        <Pressable
          className="mt-5 h-13 flex-row items-center justify-center gap-2 rounded-[18px]"
          style={{ backgroundColor: `${colors.destructive}14` }}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={19} color={colors.destructive} />
          <Text className="text-base font-sans-bold" style={{ color: colors.destructive }}>Sign out</Text>
        </Pressable>

        {DEMO_MODE && (
          <Pressable className="mt-2.5 h-11 items-center justify-center" onPress={resetDemo} accessibilityRole="button">
            <Text className="text-sm font-sans-semibold text-muted-foreground">Reset demo data</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Profile
