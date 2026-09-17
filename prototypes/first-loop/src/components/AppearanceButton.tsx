import { UserCircle } from '@phosphor-icons/react';
import { captureExpandOrigin } from '../lib/screen-origin';
import { useDispatch } from '../store/store';

/**
 * 头像按钮（今天页右上角），打开「我的」设置页——这是它唯一的入口。
 * 同时是外观页的动效原点:先量下自己的矩形,页面从这个圆展开到整屏。
 */
export default function AppearanceButton() {
  const dispatch = useDispatch();
  return <button
    aria-label="外观设置"
    onClick={(event) => {
      captureExpandOrigin(event.currentTarget, 'circle');
      dispatch({ type: 'setScreen', screen: 'appearance' });
    }}
  >
    <UserCircle size={32} weight="light" />
  </button>;
}
