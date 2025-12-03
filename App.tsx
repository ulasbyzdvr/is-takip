import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import AddCompanyScreen from './screens/AddCompanyScreen';
import AddWorkScreen from './screens/AddWorkScreen';
import CompanyWorksScreen from './screens/CompanyWorksScreen';

export type RootStackParamList = {
  Home: undefined;
  AddCompany: undefined;
  AddWork: undefined;
  CompanyWorks: { companyId: string; companyName: string };
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
            name="CompanyWorks"
            component={CompanyWorksScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#333',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

