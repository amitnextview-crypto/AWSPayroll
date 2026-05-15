import React from 'react';
import {StatusBar} from 'react-native';
import {Provider, useSelector} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './navigation/AppNavigator';
import {store} from './store/store';
import {getThemeColors} from './theme/colors';

const AppShell = () => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <AppShell />
  </Provider>
);

export default App;
