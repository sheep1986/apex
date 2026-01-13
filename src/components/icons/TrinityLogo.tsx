
import React from 'react';

interface TrinityLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
}

export const TrinityLogo = ({ className = "w-6 h-6", ...props }: TrinityLogoProps) => (
    <img 
        src="/trinity-symbol.png" 
        alt="Trinity AI Logo" 
        className={`${className} object-contain transition-all duration-300`}
        style={{ filter: 'brightness(0) invert(1)' }}
        {...props} 
    />
);
