import { useTranslation } from 'react-i18next';
import basicStyles from '../ManualMode/BasicTab.module.scss';

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

  const currentScene = SCENES.find((s) => s.id === selectedScene);

  return (
    <div className={basicStyles.field}>
      <label className={basicStyles.label}>{t('transcode.selectScene')}</label>
      <select
        className={basicStyles.select}
        value={selectedScene}
        onChange={(e) => onSelectScene(e.target.value)}
        disabled={disabled}
      >
        {SCENES.map((scene) => (
          <option key={scene.id} value={scene.id}>
            {t(`transcode.${scene.name}`)} - {t(`transcode.${scene.desc}`)}
          </option>
        ))}
      </select>
      <div className={basicStyles.hint} style={{ marginTop: '4px' }}>
        {currentScene && t(`transcode.${currentScene.desc}`)}
      </div>
    </div>
  );
};

