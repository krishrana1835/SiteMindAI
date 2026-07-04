import axiosInstance from './axiosInterceptor';

axiosInstance.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axiosInstance.defaults.headers['Content-Type'] = 'application/json';

const api = axiosInstance;

export default api;
