import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BE_HOST || 'https://192.168.50.108:8787/'
});
