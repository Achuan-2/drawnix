import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import classNames from 'classnames';
import { ATTACHED_ELEMENT_CLASS_NAME } from '@plait/core';

export const SaveTimeIndicator = () => {
  const { t } = useI18n();
  const [lastSaveTime, setLastSaveTime] = useState<string>('');
  const [isAutoSave, setIsAutoSave] = useState<boolean>(false);

  useEffect(() => {
    const handleSaveTimeUpdate = (event: CustomEvent) => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setLastSaveTime(`${hours}:${minutes}:${seconds}`);
      // 从事件中获取保存类型
      setIsAutoSave(event.detail?.isAutoSave || false);
    };

    window.addEventListener('drawnix-saved' as any, handleSaveTimeUpdate);
    return () => {
      window.removeEventListener('drawnix-saved' as any, handleSaveTimeUpdate);
    };
  }, []);

  if (!lastSaveTime) {
    return null;
  }

  return (
    <div
      className={classNames('   ', ATTACHED_ELEMENT_CLASS_NAME)}
      style={{
        position: 'absolute',
        bottom: '36px',
        left: '36px',
        padding: '4px 12px',
        fontSize: '12px',
        color: 'var(--color-text-3)',
        backgroundColor: 'var(--color-bg-1)',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        zIndex: 100,
        border: '1px solid var(--color-border-2)',
      }}
      title={isAutoSave ? t('general.autoSaved') : t('general.lastSaved')}
    >
      {isAutoSave ? t('general.autoSave') : t('general.saved')}: {lastSaveTime}
    </div>
  );
};
