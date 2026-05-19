import React, {useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {addAdminUser, updateAdminUser} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatApiDate} from '../../utils/date';

const roleOptions = [
  {label: 'Employee', value: 'employee'},
  {label: 'Leader', value: 'leader'},
  {label: 'Admin', value: 'admin'},
];

const workOptions = [
  {label: 'Onsite', value: 'Onsite'},
  {label: 'Remote', value: 'Remote'},
  {label: 'Hybrid', value: 'Hybrid'},
];

const makeTestingForm = () => {
const testSuffix = Date.now().toString().slice(-5);
return {
  name: 'Test Employee',
  username: `EMP${testSuffix}`,
  employeeCode: `EMP-${testSuffix}`,
  email: `test.employee${testSuffix}@example.com`,
  mobile: '9876543210',
  password: 'Test@123',
  type: 'employee',
  department: 'Engineering',
  designation: 'Software Engineer',
  workType: 'Onsite',
  date: formatApiDate(),
  address: 'Ahmedabad, Gujarat',
  panNumber: 'ABCDE1234F',
  aadhaarNumber: '123456789012',
  bankName: 'HDFC Bank',
  accountNumber: '123456789012',
  ifscCode: 'HDFC0001234',
  uan: '100200300400',
  esi: 'ESI123456789',
  emergencyContactName: 'Test Contact',
  emergencyContactPhone: '9876500000',
  emergencyContactRelation: 'Friend',
};
};

const formFromUser = user => ({
  ...makeTestingForm(),
  name: user?.name || '',
  username: user?.username || '',
  employeeCode: user?.employeeCode || '',
  email: user?.email || '',
  mobile: user?.mobile || '',
  password: '',
  type: String(user?.type || 'employee').toLowerCase(),
  department: user?.department || '',
  designation: user?.designation || '',
  workType: user?.workType || 'Onsite',
  date: user?.date || formatApiDate(),
  address: user?.address || '',
  panNumber: user?.panNumber || '',
  aadhaarNumber: user?.aadhaarNumber || '',
  bankName: user?.bankName || '',
  accountNumber: user?.accountNumber || '',
  ifscCode: user?.ifscCode || '',
  uan: user?.uan || '',
  esi: user?.esi || '',
  emergencyContactName: user?.emergencyContact?.name || '',
  emergencyContactPhone: user?.emergencyContact?.phone || '',
  emergencyContactRelation: user?.emergencyContact?.relation || '',
});

export const AdminAddUserScreen = ({route, navigation}) => {
  const editingUser = route.params?.user;
  const isEdit = Boolean(editingUser?.id || editingUser?._id);
  const [form, setForm] = useState(isEdit ? formFromUser(editingUser) : makeTestingForm());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const set = (key, value) => setForm(current => ({...current, [key]: value}));

  const errors = useMemo(() => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.username.trim()) next.username = 'Employee ID is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Valid email is required.';
    if (!/^\d{10,13}$/.test(form.mobile)) next.mobile = 'Valid phone is required.';
    if ((!isEdit || form.password) && form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (!form.department.trim()) next.department = 'Department is required.';
    if (!form.designation.trim()) next.designation = 'Designation is required.';
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.toUpperCase())) next.panNumber = 'PAN format is invalid.';
    if (form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber)) next.aadhaarNumber = 'Aadhaar must be 12 digits.';
    return next;
  }, [form, isEdit]);

  useEffect(() => {
    setForm(isEdit ? formFromUser(editingUser) : makeTestingForm());
    setShowErrors(false);
  }, [editingUser, isEdit]);

  const submit = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length) {
      setToast(Object.values(errors)[0]);
      return;
    }
    setLoading(true);
    setToast('');
    try {
      const payload = {...form, panNumber: form.panNumber.toUpperCase()};
      if (isEdit && !payload.password) delete payload.password;
      const response = isEdit
        ? await updateAdminUser(editingUser.id || editingUser._id, payload)
        : await addAdminUser(payload);
      Alert.alert('Employee', response?.message || (isEdit ? 'Employee updated.' : 'Employee created.'));
      if (isEdit) navigation?.goBack();
      else setForm(makeTestingForm());
      setShowErrors(false);
    } catch (err) {
      setToast(err.message || 'User could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ToastBanner message={toast} onHide={() => setToast('')} />
      <Card>
        <Text style={styles.title}>{isEdit ? 'Edit Employee' : 'Add Employee'}</Text>
        <Text style={styles.section}>Account</Text>
        <AppTextInput label="Full Name" error={showErrors ? errors.name : undefined} value={form.name} onChangeText={value => set('name', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Employee ID" error={showErrors ? errors.username : undefined} value={form.username} onChangeText={value => set('username', value)} style={styles.flex} />
          <AppTextInput label="Employee Code" value={form.employeeCode} onChangeText={value => set('employeeCode', value)} style={styles.flex} />
        </View>
        <AppTextInput label="Email" autoCapitalize="none" keyboardType="email-address" error={showErrors ? errors.email : undefined} value={form.email} onChangeText={value => set('email', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Phone" keyboardType="phone-pad" error={showErrors ? errors.mobile : undefined} value={form.mobile} onChangeText={value => set('mobile', value)} style={styles.flex} />
          <AppTextInput label={isEdit ? 'New Password (optional)' : 'Password'} secureTextEntry error={showErrors ? errors.password : undefined} value={form.password} onChangeText={value => set('password', value)} style={styles.flex} />
        </View>
        <View style={styles.chipGroup}>
          <FilterChips items={roleOptions} value={form.type} onChange={value => set('type', value)} />
        </View>

        <Text style={styles.section}>Job Details</Text>
        <View style={styles.twoCol}>
          <AppTextInput label="Department" error={showErrors ? errors.department : undefined} value={form.department} onChangeText={value => set('department', value)} style={styles.flex} />
          <AppTextInput label="Designation" error={showErrors ? errors.designation : undefined} value={form.designation} onChangeText={value => set('designation', value)} style={styles.flex} />
        </View>
        <AppTextInput label="Joining Date YYYY-MM-DD" value={form.date} onChangeText={value => set('date', value)} />
        <View style={styles.chipGroup}>
          <FilterChips items={workOptions} value={form.workType} onChange={value => set('workType', value)} />
        </View>
        <AppTextInput label="Address" multiline value={form.address} onChangeText={value => set('address', value)} />

        <Text style={styles.section}>Bank and Compliance</Text>
        <View style={styles.twoCol}>
          <AppTextInput label="PAN" autoCapitalize="characters" error={showErrors ? errors.panNumber : undefined} value={form.panNumber} onChangeText={value => set('panNumber', value)} style={styles.flex} />
          <AppTextInput label="Aadhaar" keyboardType="numeric" error={showErrors ? errors.aadhaarNumber : undefined} value={form.aadhaarNumber} onChangeText={value => set('aadhaarNumber', value)} style={styles.flex} />
        </View>
        <AppTextInput label="Bank Name" value={form.bankName} onChangeText={value => set('bankName', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Account Number" keyboardType="numeric" value={form.accountNumber} onChangeText={value => set('accountNumber', value)} style={styles.flex} />
          <AppTextInput label="IFSC Code" autoCapitalize="characters" value={form.ifscCode} onChangeText={value => set('ifscCode', value)} style={styles.flex} />
        </View>
        <View style={styles.twoCol}>
          <AppTextInput label="UAN" value={form.uan} onChangeText={value => set('uan', value)} style={styles.flex} />
          <AppTextInput label="ESI" value={form.esi} onChangeText={value => set('esi', value)} style={styles.flex} />
        </View>

        <Text style={styles.section}>Emergency Contact</Text>
        <AppTextInput label="Contact Name" value={form.emergencyContactName} onChangeText={value => set('emergencyContactName', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Contact Phone" keyboardType="phone-pad" value={form.emergencyContactPhone} onChangeText={value => set('emergencyContactPhone', value)} style={styles.flex} />
          <AppTextInput label="Relation" value={form.emergencyContactRelation} onChangeText={value => set('emergencyContactRelation', value)} style={styles.flex} />
        </View>

        <View style={styles.submitWrap}>
          <AppButton loading={loading} onPress={submit} title={isEdit ? 'Update Employee' : 'Create Employee'} />
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  section: {color: colors.primary, fontSize: 14, fontWeight: '900', marginTop: spacing.lg},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  chipGroup: {marginTop: spacing.sm, marginBottom: spacing.sm},
  submitWrap: {marginTop: spacing.md},
});
