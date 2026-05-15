import * as Keychain from 'react-native-keychain';

const SERVICE = 'easy-employee-auth';

export const tokenStorage = {
  async save(tokens) {
    await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async load() {
    const credentials = await Keychain.getGenericPassword({service: SERVICE});
    if (!credentials) {
      return null;
    }
    try {
      return JSON.parse(credentials.password);
    } catch {
      await this.clear();
      return null;
    }
  },

  async clear() {
    await Keychain.resetGenericPassword({service: SERVICE});
  },
};
