'use client'

import {useState, useEffect} from "react";
import {useRouter} from 'next/navigation';
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {CardContent, CardHeader, CardTitle, CardDescription, CardFooter} from "@/components/ui/card";
import {Form, FormField, FormItem, FormLabel, FormControl, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
import {Loader2, Store, Sparkles, ShoppingBag, BarChart3, Zap, Timer} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {Checkbox} from "@/components/ui/checkbox";
import {setCookie} from 'cookies-next';
import axiosInstance from "@/lib/axiosInstance";
import { SecurityCharacter } from "@/components/SecurityCharacter";

const FloatingSparkle = ({delay = 0}) => (
    <motion.div
        initial={{opacity: 0, scale: 0}}
        animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [-20, -40],
        }}
        transition={{
            duration: 2,
            delay,
            repeat: Infinity,
            repeatDelay: 3
        }}
    >
        <Sparkles className="w-4 h-4 text-primary-foreground/80"/>
    </motion.div>
);

const FeatureIcon = ({icon: Icon, title, description}: any) => (
    <motion.div
        className="flex items-start space-x-3 text-primary-foreground/90"
        initial={{opacity: 0, x: -20}}
        animate={{opacity: 1, x: 0}}
        whileHover={{scale: 1.03, x: 5}}
        transition={{duration: 0.2}}
    >
        <div className="p-2 bg-primary-foreground/10 rounded-lg shrink-0">
            <Icon className="w-5 h-5"/>
        </div>
        <div className="space-y-1">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-primary-foreground/70 leading-tight">{description}</p>
        </div>
    </motion.div>
);

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function getRandomPosition() {
    const positions = [
        "-top-20 left-1/4",
        "-top-16 left-1/3",
        "-top-24 left-2/3",
    ];
    return positions[Math.floor(Math.random() * positions.length)];
}

export default function LoginPage(): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [rememberMe, setRememberMe] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const router = useRouter();
    const {toast} = useToast();

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRedirecting && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (isRedirecting && countdown === 0) {
            router.replace('/dashboard');
        }
        return () => clearTimeout(timer);
    }, [isRedirecting, countdown, router]);

    async function onSubmit(values: LoginFormData) {
        setIsSubmitting(true);

        try {
            const response = await axiosInstance.post('/auth/authenticate', {
                email: values.email,
                password: values.password,
                rememberMe
            });

            const {data} = response.data;

            if (data.accessToken) {
                setCookie('accessToken', data.accessToken, {
                    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                if (data.refreshToken) {
                    setCookie('refreshToken', data.refreshToken, {
                        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
                        path: '/',
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict'
                    });
                }

                toast({
                    title: "Success! Welcome back! 🎉",
                    description: "Preparing your dashboard...",
                    duration: 3000,
                });

                const searchParams = new URLSearchParams(window.location.search);
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
                setIsRedirecting(true);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "An unexpected error occurred";
            toast({
                title: "Login Failed",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            });
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-background p-4 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"/>
                <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 animate-pulse"/>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/3 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"/>
            </div>

            <div className="relative w-full max-w-6xl aspect-[2/1] perspective-1000">
                <AnimatePresence>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`absolute ${getRandomPosition()}`}>
                            <FloatingSparkle delay={i * 0.5}/>
                        </div>
                    ))}
                </AnimatePresence>

                <div className="w-full h-full relative preserve-3d">
                    <motion.div
                        className="absolute w-1/2 h-full bg-gradient-to-br from-primary to-primary-foreground/20 text-primary-foreground rounded-l-xl p-8 flex flex-col justify-center items-start shadow-2xl"
                        initial={{rotateY: 0, opacity: 0}}
                        animate={{rotateY: isOpen ? 0 : -10, opacity: 1}}
                        transition={{duration: 1.2, type: "spring", bounce: 0.4}}
                    >
                        <motion.div
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 0.5, duration: 0.8}}
                            className="w-full"
                        >
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    className="p-4 bg-primary-foreground/10 rounded-full"
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <Store className="w-12 h-12"/>
                                </motion.div>
                            </div>

                            <motion.div className="text-center mb-6"
                                        initial={{y: 20, opacity: 0}}
                                        animate={{y: 0, opacity: 1}}
                                        transition={{delay: 0.7}}
                            >
                                <h1 className="text-3xl font-bold mb-2">
                                    Transform Your Business
                                </h1>
                                <p className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-primary-foreground/80">
                                    With Next-Generation POS Solutions
                                </p>
                            </motion.div>

                            <div className="space-y-4 mt-8">
                                <FeatureIcon
                                    icon={Zap}
                                    title="Lightning-Fast Operations"
                                    description="Process transactions in milliseconds"
                                />
                                <FeatureIcon
                                    icon={ShoppingBag}
                                    title="Smart Inventory Control"
                                    description="AI-powered stock predictions"
                                />
                                <FeatureIcon
                                    icon={BarChart3}
                                    title="Advanced Analytics"
                                    description="Real-time business insights"
                                />
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="absolute left-1/2 w-1/2 h-full bg-background/95 backdrop-blur-sm rounded-r-xl p-8 shadow-2xl"
                        initial={{rotateY: 90, opacity: 0}}
                        animate={{rotateY: isOpen ? 0 : 90, opacity: 1}}
                        transition={{duration: 1.2, type: "spring", bounce: 0.4}}
                    >
                        <div className="h-full flex flex-col justify-center">
                            <motion.div
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 1, duration: 0.8}}
                            >
                                <CardHeader className="space-y-3">
                                    <SecurityCharacter isPasswordFocused={isPasswordFocused} />
                                    <motion.div
                                        initial={{scale: 0.9}}
                                        animate={{scale: 1}}
                                        transition={{delay: 1.2, type: "spring", bounce: 0.5}}
                                    >
                                        <CardTitle className="text-3xl font-bold text-center text-primary">
                                            Welcome Back
                                        </CardTitle>
                                        <CardDescription className="text-center text-base">
                                            Access your dashboard to unlock powerful business insights
                                        </CardDescription>
                                    </motion.div>
                                </CardHeader>

                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel className="text-primary/90">Email</FormLabel>
                                                        <FormControl>
                                                            <motion.div
                                                                whileHover={{scale: 1.01}}
                                                                whileTap={{scale: 0.99}}
                                                            >
                                                                <Input
                                                                    {...field}
                                                                    type="email"
                                                                    placeholder="Enter your email"
                                                                    className="h-11 bg-background/50 backdrop-blur-sm border-primary/20"
                                                                />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel className="text-primary/90">Password</FormLabel>
                                                        <FormControl>
                                                            <motion.div
                                                                whileHover={{scale: 1.01}}
                                                                whileTap={{scale: 0.99}}
                                                            >
                                                                <Input
                                                                    {...field}
                                                                    type="password"
                                                                    placeholder="Enter your password"
                                                                    className="h-11 bg-background/50 backdrop-blur-sm border-primary/20"
                                                                    onFocus={() => setIsPasswordFocused(true)}
                                                                    onBlur={() => setIsPasswordFocused(false)}
                                                                />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="remember-me"
                                                    checked={rememberMe}
                                                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                                    className="border-primary/20"
                                                />
                                                <label
                                                    htmlFor="remember-me"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Remember me
                                                </label>
                                            </div>

                                            <motion.div
                                                whileHover={{scale: 1.02}}
                                                whileTap={{scale: 0.98}}
                                            >
                                                <Button
                                                    type="submit"
                                                    className="w-full h-11 bg-primary hover:bg-primary/90"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="flex items-center space-x-2">
                                                            <Loader2 className="w-4 h-4 animate-spin"/>
                                                            <span>Signing in...</span>
                                                        </div>
                                                    ) : isRedirecting ? (
                                                        <div className="flex items-center space-x-2">
                                                            <Timer className="w-4 h-4"/>
                                                            <span>Redirecting in {countdown}...</span>
                                                        </div>
                                                    ) : (
                                                        "Sign In"
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </form>
                                    </Form>
                                </CardContent>

                                <CardFooter className="flex justify-center">
                                    <p className="text-sm text-muted-foreground">
                                        Don't have an account?{" "}
                                        <motion.a
                                            href="/register"
                                            className="text-primary hover:underline"
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
                                        >
                                            Sign up
                                        </motion.a>
                                    </p>
                                </CardFooter>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
