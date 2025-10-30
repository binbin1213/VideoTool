import { Card } from 'react-bootstrap';
import { FaGithub, FaEnvelope } from 'react-icons/fa';
import packageJson from '../../../../package.json';

function AboutTab() {
  return (
    <div className="about-container" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-5">
        <h1 className="mb-2" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700',
          fontSize: '2.5rem'
        }}>VideoTool</h1>
        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
          强大的跨平台视频处理工具 · 开源免费 · v{packageJson.version}
        </p>
      </div>

      {/* 软件介绍 */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            软件简介
          </h5>
        </Card.Header>
        <Card.Body>
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
        </Card.Body>
      </Card>

      {/* 主要功能 */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <h5 className="mb-0">主要功能</h5>
        </Card.Header>
        <Card.Body>
          <ul className="mb-0" style={{ lineHeight: '1.8' }}>
            <li><strong>字幕格式转换</strong>：支持 SRT 转 ASS，智能清理HTML标签，格式化标点符号</li>
            <li><strong>音视频合并</strong>：将音频和视频文件快速合并，支持硬件加速</li>
            <li><strong>字幕烧录</strong>：将字幕永久嵌入视频文件</li>
            <li><strong>批量处理</strong>：一次处理多个文件，提高工作效率（开发中）</li>
            <li><strong>视频转码</strong>：支持多种视频格式转换（开发中）</li>
          </ul>
        </Card.Body>
      </Card>

      {/* 技术特性 */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <h5 className="mb-0">技术特性</h5>
        </Card.Header>
        <Card.Body>
          <ul className="mb-0" style={{ lineHeight: '1.8' }}>
            <li>基于 Electron + React + TypeScript 开发</li>
            <li>跨平台支持：macOS、Windows、Linux</li>
            <li>硬件加速：支持 VideoToolbox、NVENC、QSV</li>
            <li>现代化 UI 设计，简洁易用</li>
            <li>基于 FFmpeg，强大稳定</li>
          </ul>
        </Card.Body>
      </Card>

      {/* 版权信息 */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            开源协议
          </h5>
        </Card.Header>
        <Card.Body>
          <p className="mb-2">
            <strong>开源免费</strong> - MIT License
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
            本软件采用 MIT 开源协议，完全免费使用。您可以自由使用、修改和分发本软件。
          </p>
        </Card.Body>
      </Card>

      {/* 联系方式 */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <h5 className="mb-0">联系方式</h5>
        </Card.Header>
        <Card.Body>
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
        </Card.Body>
      </Card>

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

