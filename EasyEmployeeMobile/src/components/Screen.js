import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, View} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const Screen = ({children, scroll = true, refreshControl}) => {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} refreshControl={refreshControl}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
});
