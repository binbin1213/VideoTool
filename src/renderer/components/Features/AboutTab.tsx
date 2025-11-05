import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { FaGithub, FaEnvelope, FaSync } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../store';
import packageJson from '../../../../package.json';
import logoImage from '../../assets/logo.png';
import styles from './AboutTab.module.scss';
import buttonStyles from '../../styles/components/Button.module.scss';

// IPC Renderer
const ipcRenderer = (window as any).electron?.ipcRenderer;

function AboutTab() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  const [checking, setChecking] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);


  // 检查更新
  const handleCheckForUpdates = async () => {
    if (!ipcRenderer) {
      alert('IPC 通信未就绪');
      return;
    }

    setChecking(true);

    try {
      const result = await ipcRenderer.invoke('check-for-updates');
      if (!result.success) {
        if (result.error && result.error.includes('not packed')) {
          alert('开发环境下自动更新功能已禁用。打包后的应用可正常使用自动更新功能。');
        } else {
          alert(`检查更新失败: ${result.error}`);
        }
      } else {
        alert('当前已是最新版本');
      }
    } catch (error: any) {
      if (error.message && error.message.includes('not packed')) {
        alert('开发环境下自动更新功能已禁用。打包后的应用可正常使用自动更新功能。');
      } else {
        alert(`检查更新失败: ${error.message}`);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('about.title')}</h1>
        <p className={styles.pageSubtitle}>{t('about.subtitle', { version: packageJson.version })}</p>
      </div>

      {/* 卡片网格 */}
      <div className={styles.cardGrid}>
        {/* 应用信息卡片 */}
        <div className={styles.card} onClick={() => setShowLicenseModal(true)}>
          <div className={styles.logoCard}>
            <img src={logoImage} alt="VideoTool Logo" className={styles.logoImage} />
            <div className={styles.logoInfo}>
              <h3 className={styles.logoTitle}>{t('about.title')}</h3>
              <p className={styles.logoVersion}>v{packageJson.version}</p>
            </div>
          </div>
          <div className={styles.cardBadge}>{t('about.licenseTitle')}</div>
        </div>

        {/* 核心功能卡片 */}
        <div className={styles.card} onClick={() => setShowFeaturesModal(true)}>
          <h3 className={styles.cardTitle}>{t('about.features')}</h3>
          <p className={styles.cardDescription}>
            {t('about.feature1Title')}、{t('about.feature2Title')}、{t('about.feature3Title')}、{t('about.feature4Title')}
          </p>
          <div className={styles.cardBadge}>查看详情</div>
        </div>

        {/* 技术特性卡片 */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t('about.technicalFeatures')}</h3>
          <div className={styles.techList}>
            <div className={styles.techItem}>
              <strong>{t('about.tech1Title')}</strong>
              <span>{t('about.tech1')}</span>
            </div>
            <div className={styles.techItem}>
              <strong>{t('about.tech2Title')}</strong>
              <span>{t('about.tech2')}</span>
            </div>
            <div className={styles.techItem}>
              <strong>{t('about.tech3Title')}</strong>
              <span>{t('about.tech3')}</span>
            </div>
          </div>
        </div>

        {/* 偏好设置卡片 */}
        <div className={`${styles.card} ${styles.cardSettings}`}>
          <h3 className={styles.cardTitle}>{t('preferences.title')}</h3>
          <div className={styles.settingsContent}>
            {/* 主题切换 */}
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>{t('preferences.theme')}</span>
              <div className={styles.themeButtons}>
                <button
                  className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme('light'); }}
                  title={t('preferences.theme_light')}
                >
                  ☀️
                </button>
                <button
                  className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme('dark'); }}
                  title={t('preferences.theme_dark')}
                >
                  🌙
                </button>
                <button
                  className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme('system'); }}
                  title={t('preferences.theme_system')}
                >
                  💻
                </button>
              </div>
            </div>
            {/* 语言切换 */}
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>{t('preferences.language')}</span>
              <select 
                className={styles.langSelect}
                value={i18n.language}
                onChange={(e) => { e.stopPropagation(); i18n.changeLanguage(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            {/* 检查更新 */}
            <button 
              className={styles.updateBtn}
              onClick={(e) => { e.stopPropagation(); handleCheckForUpdates(); }}
              disabled={checking}
            >
              <FaSync className={checking ? 'fa-spin' : ''} />
              <span>{checking ? t('about.checking') : t('about.checkUpdate')}</span>
            </button>
          </div>
        </div>
      </div>


      {/* 底部 */}
      <div className={styles.footer}>
        <span>{t('about.copyright')}</span>
        <span>·</span>
              <button 
          onClick={() => setShowLicenseModal(true)}
          className={styles.footerLink}
              >
          {t('about.licenseTitle')}
              </button>
      </div>

      {/* 功能详情模态框 */}
      <Modal show={showFeaturesModal} onHide={() => setShowFeaturesModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t('about.features')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} style={{ 
                padding: '16px',
                backgroundColor: 'var(--vt-color-surface-elev1)',
                borderRadius: '8px',
                border: '1px solid var(--vt-color-border)'
              }}>
                <h5 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--vt-color-text-primary)'
                }}>
                  {t(`about.feature${num}Title`)}
                </h5>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--vt-color-text-secondary)'
                }}>
                  {t(`about.feature${num}`)}
                </p>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => window.electron.shell.openExternal('https://github.com/binbin1213/VideoTool')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--vt-color-text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              <FaGithub />
              <span>GitHub</span>
            </button>
            <button
              onClick={() => window.electron.shell.openExternal('mailto:piaozhitian@gmail.com')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--vt-color-text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              <FaEnvelope />
              <span>{t('about.email')}</span>
            </button>
          </div>
          <button 
            className={buttonStyles.buttonSecondary}
            onClick={() => setShowFeaturesModal(false)}
          >
            {t('common.close') || '关闭'}
          </button>
        </Modal.Footer>
      </Modal>


      {/* 开源协议模态框 */}
      <Modal show={showLicenseModal} onHide={() => setShowLicenseModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('about.license')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>{t('about.licenseTitle')}</h5>
          <p style={{ marginTop: '16px', lineHeight: '1.6' }}>
            {t('about.licenseText')}
          </p>
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: 'var(--vt-color-surface)',
            borderRadius: '4px',
            border: '1px solid var(--vt-color-border)',
            fontSize: '12px',
            lineHeight: '1.5',
            fontFamily: 'monospace'
          }}>
            <p>MIT License</p>
            <p style={{ marginTop: '8px' }}>Copyright (c) 2025 Binbin</p>
            <p style={{ marginTop: '8px' }}>
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the "Software"), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, and to permit persons to whom the Software is
              furnished to do so, subject to the following conditions:
            </p>
            <p style={{ marginTop: '8px' }}>
              The above copyright notice and this permission notice shall be included in all
              copies or substantial portions of the Software.
            </p>
            <p style={{ marginTop: '8px' }}>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
              AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
              LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
              SOFTWARE.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button 
            className={buttonStyles.buttonSecondary}
            onClick={() => setShowLicenseModal(false)}
          >
            {t('common.close') || '关闭'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AboutTab;
