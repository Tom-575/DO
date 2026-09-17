import type { ReactNode } from 'react';

interface NavBarProps {
  left: ReactNode;
  title: string;
  right: ReactNode;
}

export default function NavBar({ left, title, right }: NavBarProps) {
  return <header className="nav-bar">{left}<span className="nav-title">{title}</span>{right}</header>;
}
