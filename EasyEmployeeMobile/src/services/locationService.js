import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {getEmployeeOfficeLocations} from '../api/employeeApi';
import {LOCATION_OPTIONS, OFFICE_LOCATION} from '../config/env';

const toRadians = value => (value * Math.PI) / 180;

export const distanceInMeters = (from, to = OFFICE_LOCATION) => {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
};

export const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'Easy Employee uses your location to verify office attendance.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const requestBackgroundLocationPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 29) {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    {
      title: 'Background location permission',
      message:
        'Background location is only needed for future attendance reminders. Attendance check-in works with foreground permission.',
      buttonPositive: 'Allow',
      buttonNegative: 'Skip',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(position.coords),
      error => reject(error),
      LOCATION_OPTIONS,
    );
  });

export const getActiveOfficeLocation = async () => {
  try {
    const response = await getEmployeeOfficeLocations();
    const locations = response?.data || [];
    return locations.find(item => item.status === 'active') || locations[0] || OFFICE_LOCATION;
  } catch (error) {
    return OFFICE_LOCATION;
  }
};

export const verifyOfficeLocation = async workType => {
  const officeLocation = await getActiveOfficeLocation();
  if (String(workType).toLowerCase() !== 'onsite') {
    return {
      allowed: true,
      distanceMeters: 0,
      officeLocation,
      message: 'Location check skipped for non-onsite employee.',
    };
  }

  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    if (isDev) {
      return {
        allowed: true,
        distanceMeters: 0,
        accuracy: officeLocation.radiusMeters || 100,
        latitude: officeLocation.latitude,
        longitude: officeLocation.longitude,
        officeLocation,
        message: 'Development mode location fallback used.',
      };
    }
    Alert.alert(
      'Location required',
      'Please allow precise location access to mark onsite attendance.',
      [{text: 'Open settings', onPress: () => Linking.openSettings()}, {text: 'OK'}],
    );
    return {allowed: false, distanceMeters: null, message: 'Location permission denied.'};
  }

  const coords = await getCurrentLocation();
  const distanceMeters = distanceInMeters({
    latitude: coords.latitude,
    longitude: coords.longitude,
  }, officeLocation);
  const radiusMeters = Number(officeLocation.radiusMeters || OFFICE_LOCATION.radiusMeters || 100);
  const allowed = distanceMeters <= radiusMeters;

  return {
    allowed,
    distanceMeters,
    accuracy: coords.accuracy,
    latitude: coords.latitude,
    longitude: coords.longitude,
    officeLocation,
    message: allowed
      ? `You are within ${Math.round(radiusMeters)}m office radius.`
      : `You are ${Math.round(distanceMeters)}m from office. Move within ${Math.round(radiusMeters)}m to check in.`,
  };
};
