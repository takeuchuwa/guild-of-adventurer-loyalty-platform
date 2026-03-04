import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BE_HOST || 'http://localhost:8787/'
});
