import useSWR from 'swr';
import { api } from '../services/api';

const fetcher = (url) => {
    // Determine which API method to call based on the key
    if (url === '/products') return api.getProducts();
    if (url === '/caterings') return api.getCaterings();
    if (url.startsWith('/settings/')) {
        const key = url.split('/')[2];
        return api.getSetting(key);
    }
    throw new Error('Unknown API endpoint');
};

export const useProducts = () => {
    const { data, error, mutate, isLoading } = useSWR('/products', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
    });

    return {
        products: data || [],
        isLoading,
        isError: error,
        mutate
    };
};

export const useCaterings = () => {
    const { data, error, mutate, isLoading } = useSWR('/caterings', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
    });

    return {
        caterings: data || [],
        isLoading,
        isError: error,
        mutate
    };
};

export const useSetting = (key) => {
    const { data, error, mutate, isLoading } = useSWR(`/settings/${key}`, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
    });

    return {
        setting: data || { value: '' },
        isLoading,
        isError: error,
        mutate
    };
};
