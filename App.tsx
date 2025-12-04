import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import AddCompanyScreen from './screens/AddCompanyScreen';
import EditCompanyScreen from './screens/EditCompanyScreen';
import AddWorkScreen from './screens/AddWorkScreen';
import EditWorkScreen from './screens/EditWorkScreen';
import CompanyWorksScreen from './screens/CompanyWorksScreen';
import PaymentScreen from './screens/PaymentScreen';
import SettingsScreen from './screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  AddCompany: undefined;
  EditCompany: { companyId: string; companyName: string };
  AddWork: { companyId: string; companyName: string };
  EditWork: { workId: string };
  CompanyWorks: { companyId: string; companyName: string };
  Payment: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f5f5f5' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="AddCompany"
            component={AddCompanyScreen}
            options={{
              headerShown: true,
              title: 'Yeni Firma',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
          <Stack.Screen
            name="EditCompany"
            component={EditCompanyScreen}
            options={{
              headerShown: true,
              title: 'Firma Düzenle',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
          <Stack.Screen
            name="AddWork"
            component={AddWorkScreen}
            options={{
              headerShown: true,
              title: 'Yeni İş',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
          <Stack.Screen
            name="EditWork"
            component={EditWorkScreen}
            options={{
              headerShown: true,
              title: 'İş Düzenle',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
          <Stack.Screen
            name="CompanyWorks"
            component={CompanyWorksScreen}
            options={{
              headerShown: true,
              title: 'Firma İşlerim',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{
              headerShown: true,
              title: 'Tahsilat Yap',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Ayarlar',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

