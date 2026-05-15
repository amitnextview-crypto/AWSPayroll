import React from 'react';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './navigation/AppNavigator';
import {store} from './store/store';
import {colors} from './theme/colors';

const App = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaProvider>
  </Provider>
);

export default App;
