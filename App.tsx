import "react-native-get-random-values";
import React, { useEffect, useState, createContext, useContext } from "react";
import { TouchableOpacity, Platform } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import AddReminderScreen from "./src/screens/AddReminderScreen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import CustomColors from "./src/constants/Colors";
import { requestPermissions } from "./src/utils/notifications";
import { CardStyleInterpolators } from "@react-navigation/stack";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export type RootStackParamList = {
  Home: undefined;
  AddReminder: { reminderId?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...CustomColors.light,
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...CustomColors.dark,
  },
};

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigationTheme = theme === "dark" ? MyDarkTheme : MyLightTheme;

  useEffect(() => {
    requestPermissions();
    if (Platform.OS === "android") {
      // Set navigation bar color to match page background
      (async () => {
        try {
          const NavigationBar = await import("expo-navigation-bar");
          if (NavigationBar && NavigationBar.setBackgroundColorAsync) {
            await NavigationBar.setBackgroundColorAsync(
              navigationTheme.colors.background
            );
            await NavigationBar.setButtonStyleAsync(
              theme === "dark" ? "light" : "dark"
            );
          }
        } catch (e) {
          // Silently ignore if module is not available
        }
      })();
    }
  }, [theme]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: navigationTheme.colors.primary,
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            // ✅ Animation-ka smooth-ka
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            transitionSpec: {
              open: {
                animation: "timing",
                config: {
                  duration: 300, // speed of opening transition
                },
              },
              close: {
                animation: "timing",
                config: {
                  duration: 300, // speed of closing transition
                },
              },
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddReminder"
            component={AddReminderScreen}
            options={{ title: "Add Reminder" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function AppWrapper() {
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <App />
    </ThemeContext.Provider>
  );
}
