import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaGithub, FaEnvelope, FaSync, FaDownload, FaCheckCircle, FaMoon, FaSun, FaDesktop, FaLanguage } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../store';
import packageJson from '../../../../package.json';
import styles from './AboutTab.module.scss';
import buttonStyles from '../../styles/components/Button.module.scss';

// IPC Renderer
const ipcRenderer = (window as any).electron?.ipcRenderer;

// 更新状态类型
interface UpdateStatus {
  event: string;
  data: any;
}

function AboutTab() {
  const { t, i18n } = useTranslation();
  const { theme, effectiveTheme, setTheme } = useTheme();
  
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadInfo, setDownloadInfo] = useState<{ transferred: number; total: number } | null>(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // 格式化文件大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  useEffect(() => {
    // 监听更新状态
    if (!ipcRenderer) return;

    const handleUpdateStatus = (_: any, status: UpdateStatus) => {
      console.log('更新状态:', status);

      switch (status.event) {
        case 'checking-for-update':
          setChecking(true);
          setUpdateMessage('正在检查更新...');
          break;

        case 'update-available':
          setChecking(false);
          setUpdateAvailable(true);
          setUpdateInfo(status.data);
          setUpdateMessage(`发现新版本 v${status.data.version}`);
          setShowUpdateModal(true);
          break;

        case 'update-not-available':
          setChecking(false);
          setUpdateMessage('当前已是最新版本');
          setTimeout(() => setUpdateMessage(''), 3000);
          break;

        case 'download-progress':
          setDownloading(true);
          setDownloadProgress(Math.round(status.data.percent));
          setDownloadInfo({
            transferred: status.data.transferred,
            total: status.data.total,
          });
          break;

        case 'update-downloaded':
          setDownloading(false);
          setDownloadProgress(100);
          setUpdateMessage('更新下载完成，重启应用即可安装');
          break;

        case 'update-error':
          setChecking(false);
          setDownloading(false);
          setUpdateMessage(`检查更新失败: ${status.data.message}`);
          setTimeout(() => setUpdateMessage(''), 5000);
          break;
      }
    };

    ipcRenderer.on('update-status', handleUpdateStatus);

    return () => {
      ipcRenderer.removeListener('update-status', handleUpdateStatus);
    };
  }, []);

  // 检查更新
  const handleCheckForUpdates = async () => {
    if (!ipcRenderer) {
      alert('IPC 通信未就绪');
      return;
    }

    setChecking(true);
    setUpdateMessage('正在检查更新...');

    try {
      const result = await ipcRenderer.invoke('check-for-updates');
      if (!result.success) {
        // 检查是否是开发环境错误
        if (result.error && result.error.includes('not packed')) {
          setUpdateMessage('开发环境下自动更新功能已禁用。打包后的应用可正常使用自动更新功能。');
        } else {
          setUpdateMessage(`检查更新失败: ${result.error}`);
        }
        setTimeout(() => setUpdateMessage(''), 8000);
      }
    } catch (error: any) {
      if (error.message && error.message.includes('not packed')) {
        setUpdateMessage('开发环境下自动更新功能已禁用。打包后的应用可正常使用自动更新功能。');
      } else {
        setUpdateMessage(`检查更新失败: ${error.message}`);
      }
      setTimeout(() => setUpdateMessage(''), 8000);
    } finally {
      setChecking(false);
    }
  };

  // 下载更新
  const handleDownloadUpdate = async () => {
    if (!ipcRenderer) return;

    setShowUpdateModal(false);
    setDownloading(true);
    setUpdateMessage('正在下载更新...');

    try {
      await ipcRenderer.invoke('download-update');
    } catch (error: any) {
      setDownloading(false);
      setUpdateMessage(`下载失败: ${error.message}`);
      setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  // 退出并安装
  const handleQuitAndInstall = async () => {
    if (!ipcRenderer) return;

    try {
      await ipcRenderer.invoke('quit-and-install');
    } catch (error: any) {
      setUpdateMessage(`安装失败: ${error.message}`);
    }
  };

  return (
    <div className={styles.aboutContainer}>
      {/* 标题区域 */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t('about.title')}</h1>
        <p className={styles.subtitle}>
          {t('about.subtitle', { version: packageJson.version })}
        </p>
      </div>

      {/* 偏好设置 */}
      <div className={styles.preferencesSection}>
        <h4 className={styles.preferencesSectionTitle}>
          {t('preferences.title')}
        </h4>
        
        {/* 主题切换 */}
        <div className={styles.preferenceItem}>
          <div className={styles.preferenceItemHeader}>
            <div className={styles.preferenceLabel}>
              <FaMoon style={{ color: 'var(--vt-color-brand-primary)' }} />
              <span>{t('preferences.theme')}</span>
            </div>
            <span className={styles.preferenceStatus}>
              {t('preferences.current')}: {effectiveTheme === 'light' ? t('preferences.theme_light') : t('preferences.theme_dark')}
            </span>
          </div>
          <div className={styles.segmentedControl}>
            <button
              className={`${styles.segmentButton} ${theme === 'light' ? styles.segmentButtonActive : ''}`}
              onClick={() => setTheme('light')}
            >
              <FaSun />
              <span>{t('preferences.theme_light')}</span>
            </button>
            <button
              className={`${styles.segmentButton} ${theme === 'dark' ? styles.segmentButtonActive : ''}`}
              onClick={() => setTheme('dark')}
            >
              <FaMoon />
              <span>{t('preferences.theme_dark')}</span>
            </button>
            <button
              className={`${styles.segmentButton} ${theme === 'system' ? styles.segmentButtonActive : ''}`}
              onClick={() => setTheme('system')}
            >
              <FaDesktop />
              <span>{t('preferences.theme_system')}</span>
            </button>
          </div>
        </div>

        {/* 语言切换 */}
        <div className={styles.preferenceItem}>
          <div className={styles.preferenceLabel}>
            <FaLanguage style={{ color: 'var(--vt-color-brand-primary)' }} />
            <span>{t('preferences.language')}</span>
          </div>
          <select 
            className={styles.select}
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
          <small className={styles.preferenceHint}>
            {t('preferences.language_hint')}
          </small>
        </div>
      </div>

      {/* 软件介绍 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('about.introduction')}</h3>
        <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
          <span className={styles.title} style={{ display: 'inline', fontSize: '18px', marginBottom: 0 }}>{t('about.title')}</span> {t('about.introText1')}
        </p>
        <p style={{ marginBottom: 0, lineHeight: '1.6', color: 'var(--vt-color-text-secondary)' }}>
          {t('about.introText2')}
        </p>
      </div>

      {/* 更新检查 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('about.updateSection')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
            <strong>{t('about.currentVersion')}:</strong> v{packageJson.version}
            </div>
          <button 
            className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonSmall}`}
              onClick={handleCheckForUpdates}
              disabled={checking || downloading}
            >
            <FaSync className={checking ? 'fa-spin' : ''} />
            <span>{checking ? t('about.checking') : t('about.checkUpdate')}</span>
          </button>
          </div>

          {/* 更新消息 */}
          {updateMessage && (
          <div className={`${styles.alert} ${updateAvailable ? styles.alertSuccess : styles.alertInfo}`}>
            <div>{updateMessage}</div>
          </div>
          )}

          {/* 下载进度 */}
          {downloading && (
            <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <small>{t('about.downloadProgress')}</small>
              <small className={styles.progressText}>
                  {downloadProgress}%
                  {downloadInfo && (
                  <span style={{ marginLeft: '8px', color: 'var(--vt-color-text-secondary)' }}>
                      ({formatBytes(downloadInfo.transferred)} / {formatBytes(downloadInfo.total)})
                    </span>
                  )}
                </small>
              </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            </div>
          )}

          {/* 下载完成，等待安装 */}
          {downloadProgress === 100 && !downloading && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonSmall}`}
              onClick={handleQuitAndInstall}
            >
              <FaCheckCircle />
              <span>{t('about.quitAndInstall')}</span>
            </button>
            </div>
          )}
      </div>

      {/* 更新提示模态框 */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('about.updateAvailable')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>v{updateInfo?.version}</h5>
          {updateInfo?.releaseNotes && (
            <div className="mt-3">
              <strong>{t('about.updateNotes')}:</strong>
              <div 
                className="mt-2" 
                style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  padding: '10px',
                  backgroundColor: 'var(--vt-color-surface)',
                  borderRadius: '4px',
                  border: '1px solid var(--vt-color-border)'
                }}
                dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button 
            className={`${buttonStyles.buttonSecondary} ${buttonStyles.buttonSmall}`}
            onClick={() => setShowUpdateModal(false)}
          >
            {t('about.laterUpdate')}
          </button>
          <button 
            className={`${buttonStyles.buttonPrimary} ${buttonStyles.buttonSmall}`}
            onClick={handleDownloadUpdate}
          >
            <FaDownload />
            <span>{t('about.downloadNow')}</span>
          </button>
        </Modal.Footer>
      </Modal>

      {/* 主要功能 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('about.features')}</h3>
        <ul style={{ lineHeight: '1.6', color: 'var(--vt-color-text-primary)', margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>{t('about.feature1')}</li>
          <li style={{ marginBottom: '8px' }}>{t('about.feature2')}</li>
          <li style={{ marginBottom: '8px' }}>{t('about.feature3')}</li>
          <li style={{ marginBottom: '8px' }}>{t('about.feature4')}</li>
          <li style={{ marginBottom: 0 }}>{t('about.feature5')}</li>
          </ul>
      </div>

      {/* 技术特性 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('about.technicalFeatures')}</h3>
        <ul style={{ lineHeight: '1.6', color: 'var(--vt-color-text-primary)', margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>{t('about.tech1')}</li>
          <li style={{ marginBottom: '8px' }}>{t('about.tech2')}</li>
          <li style={{ marginBottom: '8px' }}>{t('about.tech3')}</li>
          <li style={{ marginBottom: '8px' }}>{t('about.tech4')}</li>
          <li style={{ marginBottom: 0 }}>{t('about.tech5')}</li>
          </ul>
      </div>

      {/* 版权信息 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('about.license')}</h3>
        <p style={{ marginBottom: '12px', fontWeight: 500 }}>
          <strong>{t('about.licenseTitle')}</strong>
          </p>
        <p style={{ marginBottom: 0, color: 'var(--vt-color-text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
          {t('about.licenseText')}
          </p>
      </div>

      {/* 联系方式 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('about.contact')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaGithub size={20} style={{ color: 'var(--vt-color-text-primary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('about.github')}</div>
              <a 
                href="https://github.com/binbin1213/VideoTool" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--vt-color-brand-primary)', 
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                https://github.com/binbin1213/VideoTool
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaEnvelope size={20} style={{ color: 'var(--vt-color-brand-primary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('about.email')}</div>
              <a 
                href="mailto:piaozhitian@gmail.com"
                style={{ 
                  color: 'var(--vt-color-brand-primary)', 
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                piaozhitian@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 版权声明 */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '32px', 
        color: 'var(--vt-color-text-secondary)', 
        fontSize: '14px' 
      }}>
        <p style={{ marginBottom: '4px' }}>
          {t('about.copyright')}
        </p>
        <p style={{ marginBottom: 0 }}>
          {t('about.madeIn')}
        </p>
      </div>
    </div>
  );
}

export default AboutTab;

