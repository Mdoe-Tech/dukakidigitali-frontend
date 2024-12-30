'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from "@/components/custom/LoadingSpinner";
import {getCookie} from "cookies-next";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const checkToken = () => {
            const token = getCookie('accessToken');

            if (token) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        };

        checkToken();
    }, [router]);

    return <LoadingSpinner />
}
