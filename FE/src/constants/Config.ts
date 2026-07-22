import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_URL: 'http://192.168.10.4:8080/api',  // ← Đã tự động thay IP theo máy của bạn
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
