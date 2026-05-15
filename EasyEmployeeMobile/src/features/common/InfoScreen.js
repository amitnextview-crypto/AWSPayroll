import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const InfoScreen = ({route}) => {
  const {title = 'Information', body = ''} = route.params || {};
  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
