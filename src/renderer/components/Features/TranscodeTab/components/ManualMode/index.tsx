import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTools, FaCog, FaImage, FaMagic, FaVolumeUp } from 'react-icons/fa';
import { BasicTab } from './BasicTab';
import { VideoTab } from './VideoTab';
import { FiltersTab } from './FiltersTab';
import { AudioTab } from './AudioTab';
import { AdvancedTab } from './AdvancedTab';
import styles from './ManualMode.module.scss';

interface ManualModeProps {
  config: any;
  videoInfo: any;
  onConfigChange: (config: any) => void;
}

export const ManualMode = ({ config, videoInfo, onConfigChange }: ManualModeProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');

  // 调试：打印接收到的配置
  console.log('🎨 ManualMode 接收到的配置:', config);

  const handleFieldChange = (field: string, value: any) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className={styles.container}>
      {/* Tab导航 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'basic' ? styles.active : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          <FaCog />
          <span>{t('transcode.basicParams')}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'video' ? styles.active : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <FaImage />
          <span>{t('transcode.videoParams')}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'filters' ? styles.active : ''}`}
          onClick={() => setActiveTab('filters')}
        >
          <FaMagic />
          <span>{t('transcode.filters')}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'audio' ? styles.active : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <FaVolumeUp />
          <span>{t('transcode.audioParams')}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'advanced' ? styles.active : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          <FaTools />
          <span>{t('transcode.advanced')}</span>
        </button>
      </div>

      {/* Tab内容 */}
      <div className={styles.tabContent}>
        {activeTab === 'basic' && (
          <BasicTab config={config} onChange={handleFieldChange} />
        )}
        {activeTab === 'video' && (
          <VideoTab config={config} onChange={handleFieldChange} />
        )}
        {activeTab === 'filters' && (
          <FiltersTab config={config} onChange={handleFieldChange} />
        )}
        {activeTab === 'audio' && (
          <AudioTab config={config} onChange={handleFieldChange} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab config={config} videoInfo={videoInfo} onChange={handleFieldChange} />
        )}
      </div>
    </div>
  );
};

