import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Chrome as Home, Users, Plus, Award, User } from 'lucide-react-native';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Platform } from 'react-native';
import LoadingScreen from '@/components/LoadingScreen';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useFirebaseAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isChild = user?.role === 'child';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingHorizontal: 0,
        },
        tabBarActiveTintColor: user?.role === 'parent' ? '#3b82f6' : '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 10,
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color, focused }) => (
            <Home 
              size={focused ? 22 : 20} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="family"
        options={{
          title: isChild ? 'Tasks' : 'Family',
          tabBarIcon: ({ size, color, focused }) => (
            <Users 
              size={focused ? 22 : 20} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      {!isChild && (
        <Tabs.Screen
          name="add-task"
          options={{
            title: 'Add',
            tabBarIcon: ({ size, color, focused }) => (
              <Plus 
                size={focused ? 22 : 20} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ size, color, focused }) => (
            <Award 
              size={focused ? 22 : 20} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color, focused }) => (
            <User 
              size={focused ? 22 : 20} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      
      {/* Hidden tabs - accessible through other means */}
      <Tabs.Screen
        name="analytics"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      {isChild && (
        <Tabs.Screen
          name="add-task"
          options={{
            href: null, // Hide this tab for children
          }}
        />
      )}
    </Tabs>
  );
}