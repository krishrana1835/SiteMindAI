import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../utils/axiosInterceptor';

export const useIndexSite = () => {
  return useMutation({
    mutationFn: async ({ url }) => {
      const response = await api.post('/index', { url });
      return response.data;
    },
  });
};

export const useRemoveSite = () => {
    return useMutation({
        mutationFn: async ({ url }) => {
            const response = await api.delete('/index', { data: { url } });
            return response.data;
        },
    });
};

export const useGetSites = (options = {}) => {
    return useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const response = await api.get('/sites');
            return response.data;
        },
        ...options,
    });
};
