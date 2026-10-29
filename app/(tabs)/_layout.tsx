import { tabs } from '@/constants/data'
import { Redirect, Tabs } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import MeniscusTabBar from '@/components/MeniscusTabBar'

// Each tab's icon by route name, for the custom tab bar
const ICONS = Object.fromEntries(tabs.map((tab) => [tab.name, tab.icon]))

const TabLayout = () => {
  const { user, initializing } = useAuth();

  if (initializing) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <MeniscusTabBar {...props} icons={ICONS} />}
    >
        {tabs.map((tab)=>(
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
    </Tabs>
  )
}

export default TabLayout
