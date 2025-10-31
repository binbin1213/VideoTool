import { useState, useEffect } from 'react';
import { Button, Alert, ProgressBar, Modal } from 'react-bootstrap';
import { FaGithub, FaEnvelope, FaSync, FaDownload, FaCheckCircle } from 'react-icons/fa';
import packageJson from '../../../../package.json';

// IPC Renderer
const ipcRenderer = (window as any).electron?.ipcRenderer;

// 更新状态类型
interface UpdateStatus {
  event: string;
  data: any;
}

function AboutTab() {
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
          setUpdateMessage('⚠️ 开发环境下自动更新功能已禁用。打包后的应用可正常使用自动更新功能。');
        } else {
          setUpdateMessage(`检查更新失败: ${result.error}`);
        }
        setTimeout(() => setUpdateMessage(''), 8000);
      }
    } catch (error: any) {
      if (error.message && error.message.includes('not packed')) {
        setUpdateMessage('⚠️ 开发环境下自动更新功能已禁用。打包后的应用可正常使用自动更新功能。');
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
    <div className="about-container" style={{ 
      padding: '10px 25px 20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      height: '100%',
      overflowY: 'auto'
    }}>
      <div className="text-center mb-3" style={{
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        cursor: 'move'
      } as React.CSSProperties}>
        <h1 className="mb-2" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700',
          fontSize: '2rem'
        }}>VideoTool</h1>
        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
          强大的跨平台视频处理工具 · 开源免费 · v{packageJson.version}
        </p>
      </div>

      {/* 软件介绍 */}
      <div className="mb-2">
        <div >
          <div className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>
            软件简介
          </div>
        </div>
        <div>
          <p className="mb-2">
            <strong style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.15rem',
              fontWeight: '700'
            }}>VideoTool</strong> 是一款强大的跨平台视频处理工具，专注于提供简单、高效的视频处理解决方案。
          </p>
          <p className="mb-0">
            支持字幕格式转换、音视频合并、字幕烧录等功能，让视频处理变得更加简单快捷。
          </p>
        </div>
      </div>

      {/* 更新检查 */}
      <div className="mb-2">
        <div >
          <div className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>软件更新</div>
        </div>
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <strong>当前版本:</strong> v{packageJson.version}
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleCheckForUpdates}
              disabled={checking || downloading}
            >
              <FaSync className={checking ? 'fa-spin' : ''} /> {checking ? '检查中...' : '检查更新'}
            </Button>
          </div>

          {/* 更新消息 */}
          {updateMessage && (
            <Alert variant={updateAvailable ? 'success' : 'info'} className="mb-3">
              {updateMessage}
            </Alert>
          )}

          {/* 下载进度 */}
          {downloading && (
            <div>
              <div className="d-flex justify-content-between mb-2">
                <small>下载进度</small>
                <small>
                  {downloadProgress}%
                  {downloadInfo && (
                    <span className="ms-2 text-muted">
                      ({formatBytes(downloadInfo.transferred)} / {formatBytes(downloadInfo.total)})
                    </span>
                  )}
                </small>
              </div>
              <ProgressBar now={downloadProgress} animated striped />
            </div>
          )}

          {/* 下载完成，等待安装 */}
          {downloadProgress === 100 && !downloading && (
            <div className="text-center mt-3">
              <Button variant="success" onClick={handleQuitAndInstall}>
                <FaCheckCircle /> 重启并安装更新
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 更新提示模态框 */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🎉 发现新版本</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>v{updateInfo?.version}</h5>
          {updateInfo?.releaseNotes && (
            <div className="mt-3">
              <strong>更新内容:</strong>
              <div 
                className="mt-2" 
                style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}
                dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            稍后更新
          </Button>
          <Button variant="primary" onClick={handleDownloadUpdate}>
            <FaDownload /> 立即下载
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 主要功能 */}
      <div className="mb-2">
        <div >
          <div className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>主要功能</div>
        </div>
        <div>
          <ul className="mb-0" style={{ lineHeight: '1.6' }}>
            <li><strong>字幕格式转换</strong>：支持 SRT 转 ASS，智能清理HTML标签，格式化标点符号</li>
            <li><strong>音视频合并</strong>：将音频和视频文件快速合并，支持硬件加速</li>
            <li><strong>字幕烧录</strong>：将字幕永久嵌入视频文件</li>
            <li><strong>批量处理</strong>：一次处理多个文件，提高工作效率（开发中）</li>
            <li><strong>视频转码</strong>：支持多种视频格式转换（开发中）</li>
          </ul>
        </div>
      </div>

      {/* 技术特性 */}
      <div className="mb-2">
        <div >
          <div className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>技术特性</div>
        </div>
        <div>
          <ul className="mb-0" style={{ lineHeight: '1.6' }}>
            <li>基于 Electron + React + TypeScript 开发</li>
            <li>跨平台支持：macOS、Windows、Linux</li>
            <li>硬件加速：支持 VideoToolbox、NVENC、QSV</li>
            <li>现代化 UI 设计，简洁易用</li>
            <li>基于 FFmpeg，强大稳定</li>
          </ul>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="mb-2">
        <div >
          <div className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>
            开源协议
          </div>
        </div>
        <div>
          <p className="mb-2">
            <strong>开源免费</strong> - MIT License
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
            本软件采用 MIT 开源协议，完全免费使用。您可以自由使用、修改和分发本软件。
          </p>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="mb-2">
        <div >
          <div className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>联系方式</div>
        </div>
        <div>
          <div className="d-flex align-items-center mb-3">
            <FaGithub size={20} className="me-3" style={{ color: '#333' }} />
            <div>
              <div className="fw-bold">GitHub</div>
              <a 
                href="https://github.com/binbin1213/VideoTool" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'none' }}
              >
                https://github.com/binbin1213/VideoTool
              </a>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <FaEnvelope size={20} className="me-3" style={{ color: '#667eea' }} />
            <div>
              <div className="fw-bold">电子邮件</div>
              <a 
                href="mailto:piaozhitian@gmail.com"
                style={{ color: '#667eea', textDecoration: 'none' }}
              >
                piaozhitian@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 版权声明 */}
      <div className="text-center mt-4" style={{ color: '#6c757d', fontSize: '14px' }}>
        <p className="mb-1">
          Copyright © 2025 Binbin. All rights reserved.
        </p>
        <p className="mb-0">
          Made in China
        </p>
      </div>
    </div>
  );
}

export default AboutTab;

