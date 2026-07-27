import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_URL: 'http://192.168.10.4:8085/api',  // ← IP LAN của máy (ipconfig getifaddr en0) + port BE trong application.yml
  },
  prod: {
    API_URL: 'https://api.hourlink.vn/api',
  },
};

const getEnvVars = () => {
  if (__DEV__) return ENV.dev;
  return ENV.prod;
};

export default getEnvVars();
