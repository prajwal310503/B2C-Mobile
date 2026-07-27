import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';

import TabBar from './TabBar';
import { colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CartScreen from '../screens/CartScreen';
import AccountScreen from '../screens/AccountScreen';

import ProductScreen from '../screens/ProductScreen';
import CategoryScreen from '../screens/CategoryScreen';
import SearchScreen from '../screens/SearchScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AddressesScreen from '../screens/AddressesScreen';
import SupportScreen from '../screens/SupportScreen';
import ReferScreen from '../screens/ReferScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BlogScreen from '../screens/BlogScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import StoresScreen from '../screens/StoresScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';
import StaticPageScreen from '../screens/StaticPageScreen';
import BecomeSellerScreen from '../screens/BecomeSellerScreen';
import VendorRegisterScreen from '../screens/VendorRegisterScreen';
import WriteReviewScreen from '../screens/WriteReviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.cream, primary: colors.primary },
};

const linking = {
  prefixes: [Linking.createURL('/'), 'luxuryjewellery://', 'https://royalbutterfly.in'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: '',
          Shop: 'shop',
          Wishlist: 'wishlist',
          Cart: 'cart',
          Account: 'account',
        },
      },
      Product: 'products/:slug',
      Category: 'collections/:slug',
      Search: 'search',
      Checkout: 'checkout',
      Orders: 'orders',
      OrderDetail: 'orders/:id',
      ResetPassword: 'reset-password/:token',
      VerifyEmail: 'verify-email/:token',
      Register: 'register',
      Login: 'login',
      Blog: 'blog',
      BlogDetail: 'blog/:slug',
      Stores: 'stores',
      StoreDetail: 'stores/:slug',
      BecomeSeller: 'become-a-seller',
      Refer: 'refer-and-earn',
    },
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.cream } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Shop' }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Refer" component={ReferScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Blog" component={BlogScreen} />
        <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
        <Stack.Screen name="Stores" component={StoresScreen} />
        <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
        <Stack.Screen name="StaticPage" component={StaticPageScreen} />
        <Stack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
        <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />
        <Stack.Screen
          name="WriteReview"
          component={WriteReviewScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
