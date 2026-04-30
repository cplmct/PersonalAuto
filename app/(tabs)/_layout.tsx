import { Tabs } from 'expo-router';
import { LayoutDashboard, Car, ScrollText, Settings } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[iconStyles.wrap, focused && iconStyles.wrapActive]}>
      <Icon size={20} color={color} strokeWidth={focused ? 2 : 1.75} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  wrapActive: {
    backgroundColor: Colors.accentLight,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Car} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ScrollText} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
    letterSpacing: 0.1,
    marginTop: -2,
  },
  tabItem: {
    gap: 2,
  },
});
