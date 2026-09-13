import { CaretRight } from '@phosphor-icons/react';

interface PreviousRowProps {
  text: string;
  onClick: () => void;
  className?: string;
}

export default function PreviousRow({ text, onClick, className }: PreviousRowProps) {
  return <button className={className ? `previous-row ${className}` : 'previous-row'} onClick={onClick}><span>{text}</span><CaretRight size={19} /></button>;
}
