/* eslint-env jest */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import ToastHost from '../src/components/ui/ToastHost';
import { TOKEN_KEY } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

/** Every route the app can navigate to, so navigate() never throws in a focused test. */
const STUB_ROUTES = [
  'Tabs',
  'Product',
  'Category',
  'Search',
  'Checkout',
  'OrderSuccess',
  'Orders',
  'OrderDetail',
  'Addresses',
  'Support',
  'Refer',
  'Profile',
  'Blog',
  'BlogDetail',
  'Stores',
  'StoreDetail',
  'StaticPage',
  'BecomeSeller',
  'VendorRegister',
  'WriteReview',
  'Login',
  'Register',
  'ForgotPassword',
];

function Stub({ route }) {
  return (
    <View>
      <Text>{`stub:${route.name}`}</Text>
    </View>
  );
}

/**
 * Renders one screen inside a real navigation container. `navigation.navigate`
 * lands on a stub screen that prints `stub:<RouteName>`, which lets a test
 * assert where a tap actually took the user.
 */
export async function renderScreen(Component, { params = {}, name = 'Target' } = {}) {
  // RNTL v14's render is async — callers must await this helper so `screen` binds.
  return await render(
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={name} component={Component} initialParams={params} />
          {STUB_ROUTES.filter((r) => r !== name).map((r) => (
            <Stack.Screen key={r} name={r} component={Stub} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
      <ToastHost />
    </SafeAreaProvider>
  );
}

/** Renders the whole app exactly as App.js wires it, for cross-screen flows. */
export async function renderApp() {
  const RootNavigator = require('../src/navigation').default;
  return await render(
    <SafeAreaProvider>
      <RootNavigator />
      <ToastHost />
    </SafeAreaProvider>
  );
}

export async function signIn() {
  await AsyncStorage.setItem(TOKEN_KEY, 'test-jwt-token');
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
