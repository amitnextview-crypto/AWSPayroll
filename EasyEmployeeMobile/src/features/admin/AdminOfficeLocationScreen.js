import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, MapPin, Plus, Save, Trash2, X} from 'lucide-react-native';
import {
  addOfficeLocation,
  deleteOfficeLocation,
  getOfficeLocations,
  updateOfficeLocation,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const defaultForm = {
  officeName: 'Amit Web Solution Company',
  latitude: '23.036245',
  longitude: '72.513106',
  radiusMeters: '100',
};

const idOf = item => item?._id || item?.id || '';
const cleanNumber = value => value.replace(/[^0-9.-]/g, '');

export const AdminOfficeLocationScreen = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getOfficeLocations();
      const locations = response?.data || [];
      setItems(locations);
      if (!editingId && locations[0]) {
        const active = locations.find(item => item.status === 'active') || locations[0];
        setForm({
          officeName: active.officeName || defaultForm.officeName,
          latitude: String(active.latitude ?? defaultForm.latitude),
          longitude: String(active.longitude ?? defaultForm.longitude),
          radiusMeters: String(active.radiusMeters ?? defaultForm.radiusMeters),
        });
        setEditingId(idOf(active));
      }
    } catch (err) {
      setToast(err.message || 'Office location could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key, value) => setForm(current => ({...current, [key]: value}));

  const reset = () => {
    setEditingId('');
    setForm(defaultForm);
  };

  const edit = item => {
    setEditingId(idOf(item));
    setForm({
      officeName: item.officeName || '',
      latitude: String(item.latitude ?? ''),
      longitude: String(item.longitude ?? ''),
      radiusMeters: String(item.radiusMeters ?? '100'),
    });
  };

  const payload = () => ({
    officeName: form.officeName.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    radiusMeters: Number(form.radiusMeters || 100),
    status: 'active',
  });

  const save = async () => {
    const data = payload();
    if (!data.officeName) {
      setToast('Office name is required.');
      return;
    }
    if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
      setToast('Valid latitude and longitude are required.');
      return;
    }
    if (!Number.isFinite(data.radiusMeters) || data.radiusMeters <= 0) {
      setToast('Allowed radius must be greater than 0.');
      return;
    }
    setLoading(true);
    try {
      if (editingId) await updateOfficeLocation(editingId, data);
      else await addOfficeLocation(data);
      await load();
      setToast(editingId ? 'Office location updated.' : 'Office location saved.');
    } catch (err) {
      setToast(err.message || 'Office location could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  const remove = item => {
    const id = idOf(item);
    if (!id) return;
    Alert.alert('Delete office location', `Delete ${item.officeName || 'this office location'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteOfficeLocation(id);
            if (editingId === id) reset();
            await load();
            setToast('Office location deleted.');
          } catch (err) {
            setToast(err.message || 'Office location could not be deleted.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('saved') || toast.includes('updated') || toast.includes('deleted') ? 'success' : 'error'} onHide={() => setToast('')} />

      <Card>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <MapPin color={colors.primary} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>Office Location</Text>
            <Text style={styles.meta}>Used for employee check-in and checkout radius verification.</Text>
          </View>
        </View>

        <AppTextInput label="Office Name" value={form.officeName} onChangeText={value => set('officeName', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Office Latitude" keyboardType="numeric" value={form.latitude} onChangeText={value => set('latitude', cleanNumber(value))} style={styles.flex} />
          <AppTextInput label="Office Longitude" keyboardType="numeric" value={form.longitude} onChangeText={value => set('longitude', cleanNumber(value))} style={styles.flex} />
        </View>
        <AppTextInput label="Allowed Radius (meters)" keyboardType="numeric" value={form.radiusMeters} onChangeText={value => set('radiusMeters', value.replace(/[^0-9]/g, ''))} />
        <View style={styles.actions}>
          <AppButton icon={editingId ? Save : Plus} title={editingId ? 'Update Location' : 'Save Location'} loading={loading} onPress={save} />
          {editingId ? <AppButton icon={X} title="New" variant="muted" onPress={reset} /> : null}
        </View>
      </Card>

      {items.map(item => (
        <Card key={idOf(item)}>
          <View style={styles.heading}>
            <Text style={styles.name}>{item.officeName || '-'}</Text>
            <StatusPill value={item.status || '-'} />
          </View>
          <Text style={styles.meta}>Latitude: {item.latitude}</Text>
          <Text style={styles.meta}>Longitude: {item.longitude}</Text>
          <Text style={styles.meta}>Allowed Radius: {item.radiusMeters || 100} meters</Text>
          <View style={styles.actions}>
            <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => edit(item)} />
            <AppButton icon={Trash2} title="Delete" variant="danger" onPress={() => remove(item)} />
          </View>
        </Card>
      ))}

      {!loading && !items.length ? <Text style={styles.empty}>No office location found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900'},
  name: {color: colors.text, flex: 1, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  header: {alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg},
  heading: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between'},
  iconBox: {alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 48, justifyContent: 'center', width: 48},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
