import "@/global.css"
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import {styled} from 'nativewind';
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/lib/auth-context";
import { useApplications } from "@/lib/applications-store";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import {
  CLOSED_STAGES,
  formatTimeDistance,
  getDueSoon,
  getGreeting,
  getWeekSummary,
  needsFollowUp,
  sortApplications,
} from "@/lib/applications";
import { getReminderNotifications } from "@/lib/notifications";
import LineBadge from "@/components/LineBadge";
import LineTrack from "@/components/LineTrack";
import RemindersSheet from "@/components/RemindersSheet";
import HeaderButton from "@/components/HeaderButton";
import { useLine } from "@/lib/lines";
import { hot, pale, tintedCard, wash } from "@/lib/surfaces";

const SafeAreaView = styled(RNSafeAreaView);

type Departure = { id: string; date: Dayjs; title: string; detail: string; status: string; urgent: boolean };

// What leaves this week: follow-ups that are due, deadlines and interviews in the next 7 days
const getDepartures = (applications: Application[], now: Dayjs): Departure[] => {
  const weekEnd = now.add(7, "day");
  const list: Departure[] = [];

  applications.forEach((a) => {
    if (a.type === "professor" && (a.stage === "sent" || a.stage === "follow_up_due") && needsFollowUp(a, now)) {
      list.push({ id: a.id, date: now, title: a.title, detail: "Follow up", status: "Now", urgent: true });
    }
    if (a.type === "job" && a.stage === "interview" && a.interviewAt) {
      const at = dayjs(a.interviewAt);
      if (at.isAfter(now) && at.isBefore(weekEnd)) {
        list.push({ id: a.id, date: at, title: a.title, detail: `Interview · ${a.interviewMode ?? a.organization}`, status: at.format("h:mm A"), urgent: false });
      }
    }
  });
  getDueSoon(applications, now).forEach((a) => {
    const deadline = dayjs(a.deadline);
    list.push({
      id: a.id,
      date: deadline,
      title: a.title,
      detail: a.organization,
      status: formatTimeDistance(a.deadline as string, now),
      urgent: deadline.diff(now, "day") < 3,
    });
  });

  return list.sort((x, y) => x.date.valueOf() - y.date.valueOf()).slice(0, 4);
};

// One thing due this week: a calendar-style date tile in the application's colour, its name, and how soon
const WeekRow = ({ item, now, onPress }: { item: Departure; now: Dayjs; onPress: () => void }) => {
  const line = useLine(item.id);
  const today = item.date.isSame(now, "day");
  return (
    <Pressable className="flex-row items-center gap-3 rounded-[18px] bg-card p-2.5" onPress={onPress} accessibilityRole="button">
      <View className="size-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: pale(line.color) }}>
        <Text className="text-[10px] font-sans-extrabold" style={{ color: line.color }}>{today ? "TODAY" : item.date.format("MMM").toUpperCase()}</Text>
        <Text className="text-lg font-sans-extrabold text-primary" style={{ lineHeight: 20 }}>{item.date.format("D")}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-sans-bold text-primary" numberOfLines={1}>{item.title}</Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <LineBadge id={item.id} size={18} />
          <Text className="flex-1 text-xs font-sans-medium text-muted-foreground" numberOfLines={1}>{item.detail}</Text>
        </View>
      </View>
      <View className="rounded-full px-3 py-1.5" style={item.urgent ? hot() : { backgroundColor: colors.muted }}>
        <Text className="text-xs font-sans-bold" style={{ color: item.urgent ? "#FFFFFF" : colors.primary }}>{item.status}</Text>
      </View>
    </Pressable>
  );
};

// An application with its route, on a card washed with a little of its own colour
const ApplicationRow = ({ item, onPress }: { item: Application; onPress: () => void }) => {
  const line = useLine(item.id);
  return (
    <Pressable
      className="rounded-[20px] border border-border p-3.5"
      style={tintedCard(line.color)}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View className="flex-row items-center gap-3">
        <LineBadge id={item.id} />
        <View className="min-w-0 flex-1">
          <Text className="app-card-title" numberOfLines={1}>{item.title}</Text>
          <Text className="app-card-org" numberOfLines={1}>{item.organization}</Text>
        </View>
      </View>
      <View className="mt-3.5">
        <LineTrack application={item} />
      </View>
    </Pressable>
  );
};

export default function App() {
  const { user } = useAuth();
  const { applications } = useApplications();
  const router = useRouter();
  const now = dayjs();
  const summary = getWeekSummary(applications, now);
  const departures = getDepartures(applications, now);
  const openApplication = (id: string) => router.push({ pathname: "/application/[id]", params: { id } });
  const [showReminders, setShowReminders] = useState(false);
  const hasReminders = getReminderNotifications(applications).length > 0;

  // Email sign-ups have no display name, so fall back to the part before the @
  const firstName = (user?.displayName || user?.email?.split("@")[0] || "there").split(" ")[0];

  const nextInterview = applications
    .filter((a): a is JobApplication => a.type === "job" && a.stage === "interview" && !!a.interviewAt && dayjs(a.interviewAt).isAfter(now))
    .sort((a, b) => dayjs(a.interviewAt).valueOf() - dayjs(b.interviewAt).valueOf())[0];
  const nextStop = nextInterview
    ? `Interview, ${dayjs(nextInterview.interviewAt).format("MMM D")}`
    : departures[0]?.title;

  const lines = sortApplications(applications.filter((a) => !CLOSED_STAGES.includes(a.stage)), now).slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-5 pt-5 pb-30" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Text className="text-sm font-sans-medium text-muted-foreground">{getGreeting(now)} {firstName}</Text>
            <Text className="mt-0.5 text-[22px] font-sans-extrabold text-primary" style={{ letterSpacing: -0.3 }}>
              {nextStop ? <>Next up <Text className="font-sans-regular text-muted-foreground">·</Text> <Text style={{ color: colors.accent }}>{nextStop}</Text></> : "Nothing coming up"}
            </Text>
          </View>
          <HeaderButton kind="sparkle" onPress={() => router.push("/ask")} accessibilityLabel="Ask NextStep">
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          </HeaderButton>
          <HeaderButton kind="bell" showDot={hasReminders} onPress={() => setShowReminders(true)} accessibilityLabel="Reminders">
            <Image source={icons.bell} className="size-5" tintColor={colors.primary} />
          </HeaderButton>
          <HeaderButton kind="plus" dark onPress={() => router.push("/application/new")} accessibilityLabel="Add application">
            <Image source={icons.plus} className="size-5" tintColor="#FFFFFF" />
          </HeaderButton>
        </View>

        {/* This week: the Dribbble shot's soft blue, lilac and pink wash, with white cards on it */}
        <View
          className="mt-5 gap-2 rounded-[26px] p-3"
          style={wash()}
        >
          <View className="flex-row items-center justify-between px-1.5 pb-1 pt-0.5">
            <Text className="text-base font-sans-extrabold text-primary">This week</Text>
            <View className="rounded-full bg-card/80 px-3 py-1">
              <Text className="text-xs font-sans-bold text-primary">{now.format("ddd, MMM D")}</Text>
            </View>
          </View>
          {departures.length > 0 ? (
            departures.map((item, index) => (
              <WeekRow key={`${item.id}-${index}`} item={item} now={now} onPress={() => openApplication(item.id)} />
            ))
          ) : (
            <View className="rounded-[18px] bg-card p-4">
              <Text className="text-sm font-sans-medium text-muted-foreground">Nothing due this week</Text>
            </View>
          )}
        </View>

        <View className="list-head">
          <Text className="list-title">Your applications</Text>
          <Text className="home-section-meta">{summary.dueThisWeek} due this week</Text>
        </View>
        <View className="gap-2.5">
          {lines.length > 0 ? (
            lines.map((item) => <ApplicationRow key={item.id} item={item} onPress={() => openApplication(item.id)} />)
          ) : (
            <Text className="home-empty-state">Add your first application with the + button</Text>
          )}
        </View>

        {applications.length > lines.length && (
          <Pressable className="see-all-button" onPress={() => router.push("/applications")} accessibilityRole="button">
            <Text className="see-all-text">See all {applications.length} applications</Text>
          </Pressable>
        )}
      </ScrollView>
      <RemindersSheet visible={showReminders} onClose={() => setShowReminders(false)} />
    </SafeAreaView>
  );
}
