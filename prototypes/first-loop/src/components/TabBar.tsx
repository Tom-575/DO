import { ClockCounterClockwise, House, Plus } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';

export default function TabBar() {
  const { tab } = useAppState();
  const dispatch = useDispatch();
  return <nav className="tab-bar">
    <button className={tab === 'today' ? 'selected' : ''} aria-label="今天" onClick={() => dispatch({ type: 'setTab', tab: 'today' })}><House size={24} weight={tab === 'today' ? 'fill' : 'regular'} /></button>
    <button className="tab-create" aria-label="新增记录" onClick={() => dispatch({ type: 'setScreen', screen: 'record' })}><Plus size={22} weight="bold" /></button>
    <button className={tab === 'memories' ? 'selected' : ''} aria-label="回忆" onClick={() => dispatch({ type: 'setTab', tab: 'memories' })}><ClockCounterClockwise size={25} weight={tab === 'memories' ? 'fill' : 'regular'} /></button>
  </nav>;
}
