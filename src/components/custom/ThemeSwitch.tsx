'use client'

import { IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from "@/components/custom/Button"

export default function ThemeSwitch() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme, resolvedTheme } = useTheme()

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <Button
            size='sm'
            variant='ghost'
            className='rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
            {resolvedTheme === 'dark' ? <IconMoon size={14}/> : <IconSun size={14}/>}
        </Button>
    )
}
