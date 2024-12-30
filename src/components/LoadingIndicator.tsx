'use client'

import React from 'react';
import { usePathname } from 'next/navigation';

const LoadingIndicator = () => {
    const pathname = usePathname();
    const [loading, setLoading] = React.useState(false);
    const [prevPathname, setPrevPathname] = React.useState(pathname);

    React.useEffect(() => {
        if (pathname !== prevPathname) {
            setLoading(true);
            setPrevPathname(pathname);

            // Simulate a delay to show the loading indicator
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [pathname, prevPathname]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-primary z-50">
            <div className="h-full w-1/3 bg-primary-foreground animate-loading"></div>
        </div>
    );
};

export default LoadingIndicator;
