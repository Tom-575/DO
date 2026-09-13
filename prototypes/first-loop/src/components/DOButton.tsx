import { CaretRight } from '@phosphor-icons/react';

interface DOButtonProps {
  onClick: () => void;
}

export default function DOButton({ onClick }: DOButtonProps) {
  return <button className="do-button" onClick={onClick}><span>DO</span><small>写下一个念头</small><CaretRight size={22} weight="bold" /></button>;
}
