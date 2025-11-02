import { useTranslation } from 'react-i18next';
import styles from './SceneSelector.module.scss';

interface SceneSelectorProps {
  selectedScene: string;
  onSelectScene: (scene: string) => void;
  disabled?: boolean;
}

const SCENES = [
  { id: 'mobile', name: 'scene.mobile', desc: 'scene.mobileDesc' },
  { id: 'web', name: 'scene.web', desc: 'scene.webDesc' },
  { id: 'archive', name: 'scene.archive', desc: 'scene.archiveDesc' },
  { id: 'compress', name: 'scene.compress', desc: 'scene.compressDesc' },
  { id: 'fast', name: 'scene.fast', desc: 'scene.fastDesc' },
  { id: 'custom', name: 'scene.custom', desc: 'scene.customDesc' },
];

export const SceneSelector = ({ selectedScene, onSelectScene, disabled }: SceneSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t('transcode.selectScene')}</div>
      <div className={styles.grid}>
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            className={`${styles.sceneCard} ${selectedScene === scene.id ? styles.active : ''}`}
            onClick={() => onSelectScene(scene.id)}
            disabled={disabled}
          >
            <div className={styles.name}>{t(`transcode.${scene.name}`)}</div>
            <div className={styles.desc}>{t(`transcode.${scene.desc}`)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

