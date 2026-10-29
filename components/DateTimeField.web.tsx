import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs, { type Dayjs } from "dayjs";
import { colors } from "@/constants/theme";
import { brand } from "@/lib/surfaces";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
  withTime?: boolean;
};

// The native date pickers don't exist in a browser, and the browser's own popups can't be styled,
// so the web gets its own calendar and time list in the app's font and colours

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const ROW = 44;

const Field = ({
  text,
  icon,
  onPress,
  accessibilityLabel,
}: {
  text: string;
  icon: "calendar-outline" | "time-outline";
  onPress: () => void;
  accessibilityLabel: string;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    className="h-[52px] flex-row items-center justify-between rounded-2xl border border-border bg-card px-3.5"
  >
    <Text
      className="text-base font-sans-semibold text-primary"
      numberOfLines={1}
    >
      {text}
    </Text>
    <Ionicons name={icon} size={19} color={colors.mutedForeground} />
  </Pressable>
);

const Sheet = ({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <Modal
    transparent
    animationType="fade"
    visible={visible}
    onRequestClose={onClose}
  >
    <Pressable
      className="flex-1 items-center justify-center bg-black/40 px-6"
      onPress={onClose}
    >
      {/* Taps inside the card stay inside it */}
      <Pressable
        className="w-full max-w-[340px] gap-3 rounded-[24px] border border-border bg-card p-4"
        onPress={() => {}}
      >
        {children}
      </Pressable>
    </Pressable>
  </Modal>
);

const Calendar = ({
  value,
  onPick,
  onClose,
}: {
  value: Dayjs;
  onPick: (day: Dayjs) => void;
  onClose: () => void;
}) => {
  const [month, setMonth] = useState(value.startOf("month"));
  const today = dayjs();
  const start = month.startOf("week");
  const days = Array.from({ length: 42 }, (_, i) => start.add(i, "day"));

  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="ml-1 text-lg font-sans-bold text-primary">
          {month.format("MMMM YYYY")}
        </Text>
        <View className="flex-row gap-1.5">
          {(["chevron-back", "chevron-forward"] as const).map((icon, i) => (
            <Pressable
              key={icon}
              onPress={() => setMonth(month.add(i ? 1 : -1, "month"))}
              accessibilityRole="button"
              accessibilityLabel={i ? "Next month" : "Previous month"}
              className="size-9 items-center justify-center rounded-full bg-muted"
            >
              <Ionicons name={icon} size={17} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-xs font-sans-semibold text-muted-foreground"
          >
            {d}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((d) => {
          const selected = d.isSame(value, "day");
          const isToday = d.isSame(today, "day");
          const inMonth = d.month() === month.month();
          return (
            <Pressable
              key={d.valueOf()}
              onPress={() => onPick(d)}
              accessibilityRole="button"
              accessibilityLabel={d.format("dddd, MMMM D, YYYY")}
              accessibilityState={{ selected }}
              style={{ width: `${100 / 7}%`, height: ROW }}
              className="items-center justify-center"
            >
              <View
                style={[
                  {
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  selected
                    ? brand()
                    : isToday
                      ? { borderWidth: 1.5, borderColor: colors.accent }
                      : null,
                ]}
              >
                <Text
                  className="text-[15px] font-sans-semibold"
                  style={{
                    color: selected
                      ? "#FFFFFF"
                      : inMonth
                        ? colors.primary
                        : colors.mutedForeground,
                    opacity: inMonth || selected ? 1 : 0.5,
                  }}
                >
                  {d.date()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-[14px] border border-border"
        >
          <Text className="text-sm font-sans-bold text-primary">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => onPick(today)}
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-[14px] bg-muted"
        >
          <Text className="text-sm font-sans-bold text-primary">Today</Text>
        </Pressable>
      </View>
    </>
  );
};

const Column = <T extends string | number>({
  items,
  selected,
  format,
  onPick,
  label,
}: {
  items: T[];
  selected: T;
  format: (item: T) => string;
  onPick: (item: T) => void;
  label: string;
}) => {
  const list = useRef<ScrollView>(null);
  return (
    <ScrollView
      ref={list}
      style={{ height: ROW * 5, flex: 1 }}
      // Opens with the chosen value in the middle of the column
      onLayout={() =>
        list.current?.scrollTo({
          y: Math.max(0, items.indexOf(selected) * ROW - ROW * 2),
          animated: false,
        })
      }
      showsVerticalScrollIndicator={false}
      accessibilityLabel={label}
    >
      {items.map((item) => {
        const on = item === selected;
        return (
          <Pressable
            key={String(item)}
            onPress={() => onPick(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[
              {
                height: ROW - 4,
                marginVertical: 2,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              },
              on ? brand() : null,
            ]}
          >
            <Text
              className="text-base font-sans-semibold"
              style={{ color: on ? "#FFFFFF" : colors.primary }}
            >
              {format(item)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const TimePicker = ({
  value,
  onDone,
  onClose,
}: {
  value: Dayjs;
  onDone: (time: Dayjs) => void;
  onClose: () => void;
}) => {
  const [hour, setHour] = useState(value.hour() % 12 || 12);
  const [minute, setMinute] = useState(value.minute());
  const [pm, setPm] = useState(value.hour() >= 12);
  const pad = (n: number) => String(n).padStart(2, "0");

  const done = () =>
    onDone(
      value
        .hour((hour % 12) + (pm ? 12 : 0))
        .minute(minute)
        .second(0)
        .millisecond(0),
    );

  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="ml-1 text-lg font-sans-bold text-primary">Time</Text>
        <Text className="mr-1 text-lg font-sans-bold text-primary">{`${hour}:${pad(minute)} ${pm ? "PM" : "AM"}`}</Text>
      </View>

      <View className="flex-row gap-2">
        <Column
          items={HOURS}
          selected={hour}
          format={String}
          onPick={setHour}
          label="Hour"
        />
        <Column
          items={MINUTES}
          selected={minute}
          format={pad}
          onPick={setMinute}
          label="Minute"
        />
        <View className="flex-1 gap-1">
          {[false, true].map((isPm) => {
            const on = pm === isPm;
            return (
              <Pressable
                key={String(isPm)}
                onPress={() => setPm(isPm)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  {
                    height: ROW - 4,
                    marginVertical: 2,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  on ? brand() : { backgroundColor: colors.muted },
                ]}
              >
                <Text
                  className="text-base font-sans-semibold"
                  style={{ color: on ? "#FFFFFF" : colors.primary }}
                >
                  {isPm ? "PM" : "AM"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-[14px] border border-border"
        >
          <Text className="text-sm font-sans-bold text-primary">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={done}
          accessibilityRole="button"
          style={brand()}
          className="h-11 flex-1 items-center justify-center rounded-[14px]"
        >
          <Text className="text-sm font-sans-bold text-white">Done</Text>
        </Pressable>
      </View>
    </>
  );
};

const DateTimeField = ({ value, onChange, label, withTime = true }: Props) => {
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const day = dayjs(value);
  const close = () => setOpen(null);

  return (
    <View className="flex-row gap-2.5">
      <View className="flex-1">
        <Field
          text={day.format("MMM D, YYYY")}
          icon="calendar-outline"
          onPress={() => setOpen("date")}
          accessibilityLabel={`${label} date, ${day.format("MMMM D, YYYY")}`}
        />
      </View>
      {withTime && (
        <View className="w-36">
          <Field
            text={day.format("h:mm A")}
            icon="time-outline"
            onPress={() => setOpen("time")}
            accessibilityLabel={`${label} time, ${day.format("h:mm A")}`}
          />
        </View>
      )}

      <Sheet visible={open !== null} onClose={close}>
        {open === "date" && (
          <Calendar
            value={day}
            onClose={close}
            onPick={(d) => {
              onChange(
                day.year(d.year()).month(d.month()).date(d.date()).toDate(),
              );
              close();
            }}
          />
        )}
        {open === "time" && (
          <TimePicker
            value={day}
            onClose={close}
            onDone={(t) => {
              onChange(t.toDate());
              close();
            }}
          />
        )}
      </Sheet>
    </View>
  );
};

export default DateTimeField;
