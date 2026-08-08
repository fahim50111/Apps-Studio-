import { Link } from 'react-router-dom';

type Props = {
  size?: number;
  showText?: boolean;
  className?: string;
};

export default function LogoMark({ size = 32, showText = true, className = '' }: Props) {
  return (
    <Link to="/" className={`logo-mark ${className}`} aria-label="Apps Studio Home">
      <img
        src="/logo.png"
        alt="Apps Studio"
        width={size}
        height={size}
        className="logo-img"
        style={{ width: size, height: size }}
      />
      {showText && <span className="logo-text">Apps Studio</span>}
    </Link>
  );
}
