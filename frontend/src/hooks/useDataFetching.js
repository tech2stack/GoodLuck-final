// src/hooks/useDataFetching.js

import { useState, useEffect } from 'react';
import api from '../utils/api'; // Hamari update ki hui API file import karein

// Yeh custom hook data fetching logic ko handle karega
const useDataFetching = (url, initialData = []) => {
    // Data, loading state aur error state ko manage karne ke liye useState hooks
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect hook component ke mount hone par ya url change hone par data fetch karega
    useEffect(() => {
        // Ek async function banate hain jise hum useEffect ke andar call karenge
        const fetchData = async () => {
            setLoading(true); // Data fetch shuru hone par loading ko true set karein
            setError(null);   // Koi bhi pichla error clear karein

            try {
                // Hamari custom api.get() method ko call karein
                // Yeh automatically caching ko handle karega
                const response = await api.get(url);
                setData(response.data); // Sahi response data ko state mein store karein
            } catch (err) {
                setError(err); // Error hone par error state ko update karein
                console.error("Data fetching mein error:", err);
            } finally {
                setLoading(false); // Fetching poora hone par loading ko false set karein
            }
        };

        // Agar URL available hai, toh fetching shuru karein
        if (url) {
            fetchData();
        }

    }, [url]); // `url` dependency array mein hai, isliye url change hone par hook re-run hoga

    // Hook se data, loading aur error states ko return karein
    return { data, loading, error };
};

export default useDataFetching;
