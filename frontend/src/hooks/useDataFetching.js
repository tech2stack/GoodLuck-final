// src/hooks/useDataFetching.js

import { useState, useEffect } from 'react';
import api from '../utils/api'; // Hamari update ki hui API file import karein

// Yeh custom hook data fetching logic ko handle karega
const useDataFetching = (url, initialData = []) => {
    // Data, loading state aur error state ko manage karne ke liye useState hooks
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ek function jo data ko fetch karta hai aur states ko manage karta hai
    const fetchData = async () => {
        setLoading(true); // Data fetch shuru hone par loading ko true set karein
        setError(null);   // Koi bhi pichla error clear karein

        try {
            // Hamari custom api.get() method ko call karein
            // Yeh automatically caching ko handle karega
            const response = await api.get(url);

            // FIX: Yahan par API response ke nested data ko sahi se extract karein
            // Agar response mein 'data' aur uske andar 'zones' ya 'classes' property hai, toh use karein.
            // Warna, poora data use karein.
            const extractedData = response.data.data.zones || response.data.data.classes || response.data;
            
            // Ab sahi extracted data ko state mein store karein
            setData(extractedData);
        } catch (err) {
            setError(err); // Error hone par error state ko update karein
            console.error("Data fetching mein error:", err);
        } finally {
            setLoading(false); // Fetching poora hone par loading ko false set karein
        }
    };

    // useEffect hook component ke mount hone par ya url change hone par data fetch karega
    useEffect(() => {
        // Agar URL available hai, toh fetching shuru karein
        if (url) {
            fetchData();
        }
    }, [url]); // `url` dependency array mein hai, isliye url change hone par hook re-run hoga

    // Hook se data, loading, error aur refetch states ko return karein
    return { data, loading, error, refetch: fetchData };
};

export default useDataFetching;
