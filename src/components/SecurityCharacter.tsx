import { motion } from "framer-motion";

interface SecurityCharacterProps {
    isPasswordFocused: boolean;
}

export const SecurityCharacter = ({ isPasswordFocused }: SecurityCharacterProps) => (
    <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto mb-4"
    >
        {/* Face */}
        <motion.circle cx="60" cy="60" r="40" fill="#FFD7B5" />

        {/* Eyes */}
        <motion.g>
            {/* Left Eye */}
            <motion.path
                d="M45 55 Q47 52, 50 55"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                animate={isPasswordFocused ? {
                    d: "M43 55 Q47 55, 51 55"
                } : {
                    d: "M45 55 Q47 52, 50 55"
                }}
            />

            {/* Right Eye */}
            <motion.path
                d="M70 55 Q72 52, 75 55"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                animate={isPasswordFocused ? {
                    d: "M68 55 Q72 55, 76 55"
                } : {
                    d: "M70 55 Q72 52, 75 55"
                }}
            />
        </motion.g>

        {/* Hands */}
        <motion.g
            animate={isPasswordFocused ? {
                y: -15,
                opacity: 1
            } : {
                y: 0,
                opacity: 0
            }}
        >
            <circle cx="35" cy="75" r="8" fill="#FFD7B5" />
            <circle cx="85" cy="75" r="8" fill="#FFD7B5" />
        </motion.g>

        {/* Smile */}
        <motion.path
            d="M50 70 Q60 75, 70 70"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
            animate={isPasswordFocused ? {
                d: "M50 70 Q60 65, 70 70"
            } : {
                d: "M50 70 Q60 75, 70 70"
            }}
        />
    </motion.svg>
);
