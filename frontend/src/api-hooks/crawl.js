import { useMutation } from '@tanstack/react-query';
import api from '../utils/axiosInterceptor';

export const useCrawl = () => {
  return useMutation({
    mutationFn: async ({ url }) => {
      const response = await api.post('/crawl', { url });
      return response.data;
    },
  });
};
