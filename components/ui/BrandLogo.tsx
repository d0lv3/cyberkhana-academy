import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'mark' | 'text' | 'collapsed';
  className?: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
}

const logoMap: Record<NonNullable<BrandLogoProps['variant']>, string> = {
  full: '/assets/brand/cyberkhana-academy.png',
  text: '/assets/brand/cyberkhana-text-logo.png',
  mark: '/assets/brand/cyberkhana-favicon.png',
  collapsed: '/assets/brand/cyberkhana-logo-afterToggle.png',
};

const defaultAlt: Record<NonNullable<BrandLogoProps['variant']>, string> = {
  full: 'CyberKhana Academy',
  text: 'CyberKhana',
  mark: 'CyberKhana',
  collapsed: 'CyberKhana',
};

const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
  alt,
  loading = 'lazy',
}) => {
  return (
    <img
      src={logoMap[variant]}
      alt={alt ?? defaultAlt[variant]}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
};

export default BrandLogo;
