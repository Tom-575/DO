import { ClockCounterClockwise, House } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';

export default function TabBar() {
  const { tab } = useAppState();
  const dispatch = useDispatch();
  return <nav className="tab-bar">
    <button className={tab === 'today' ? 'selected' : ''} onClick={() => dispatch({ type: 'setTab', tab: 'today' })}><House size={23} weight={tab === 'today' ? 'fill' : 'regular'} /><span>今天</span></button>
    <button className={tab === 'memories' ? 'selected' : ''} onClick={() => dispatch({ type: 'setTab', tab: 'memories' })}><ClockCounterClockwise size={24} weight={tab === 'memories' ? 'fill' : 'regular'} /><span>回忆</span></button>
  </nav>;
}
