import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      toast.error(response.data.message || 'An unexpected error occurred.');
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const message = error.response.data.message || error.message || 'Server Error';
      toast.error(message);
    } else if (error.request) {
      toast.error('Network Error: No response from server.');
    } else {
      toast.error(error.message || 'An unknown error occurred.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
