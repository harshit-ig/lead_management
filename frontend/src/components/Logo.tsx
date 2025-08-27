import React from 'react';
import logo from '../assets/favicon.png';

const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <img
    src={logo}
    alt="EdTech Logo"
    width={size}
    height={size}
    style={{ borderRadius: 8 }}
  />
);

export default Logo;