import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Mail, Phone} from 'lucide-react-native';
import {getCompanySettings} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const InfoScreen = ({route}) => {
  const {title = 'Information', body = '', kind = ''} = route.params || {};
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (kind !== 'settings') {
      return;
    }
    const load = async () => {
      try {
        const response = await getCompanySettings();
        setSettings(response?.data || null);
      } catch (err) {
        setSettings(null);
      }
    };
    load();
  }, [kind]);

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {kind === 'settings' ? (
          <View style={styles.help}>
            <View style={styles.row}>
              <Mail color={colors.primary} size={18} />
              <Text style={styles.value}>{settings?.supportEmail || 'Help email not added yet'}</Text>
            </View>
            <View style={styles.row}>
              <Phone color={colors.info} size={18} />
              <Text style={styles.value}>{settings?.supportPhone || 'Help number not added yet'}</Text>
            </View>
          </View>
        ) : null}
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
  help: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  value: {
    color: colors.text,
    flex: 1,
    fontWeight: '800',
  },
});
