import { CaretRight } from '@phosphor-icons/react';

interface PreviousRowProps {
  text: string;
  onClick: () => void;
  className?: string;
  /** 回收的待定 DO:弱化显示,不引入新的状态色 */
  muted?: boolean;
}

export default function PreviousRow({ text, onClick, className, muted }: PreviousRowProps) {
  const classes = ['previous-row', muted ? 'recycled' : '', className ?? ''].filter(Boolean).join(' ');
  return <button className={classes} onClick={onClick}><span>{text}</span><CaretRight size={19} /></button>;
}
