import { Card, Button, Form, Alert } from 'react-bootstrap';
import { FaFolderOpen, FaPlay, FaStop } from 'react-icons/fa';
import { useState } from 'react';

function BatchTab() {
  const [files, setFiles] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 className="mb-4">📦 批量处理</h2>

      {/* 开发中提示 */}
      <Alert variant="info" className="mb-4">
        <Alert.Heading>🚧 功能开发中</Alert.Heading>
        <p className="mb-0">
          批量处理功能正在开发中，敬请期待！
        </p>
      </Alert>

      {/* 文件选择 */}
      <Card className="mb-3">
        <Card.Header>
          <strong>1. 选择文件</strong>
        </Card.Header>
        <Card.Body>
          <Button variant="outline-primary" disabled>
            <FaFolderOpen className="me-2" />
            选择多个文件
          </Button>
          {files.length > 0 && (
            <div className="mt-3">
              <strong>已选择 {files.length} 个文件</strong>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 处理选项 */}
      <Card className="mb-3">
        <Card.Header>
          <strong>2. 处理选项</strong>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>处理类型</Form.Label>
            <Form.Select disabled>
              <option>视频转码</option>
              <option>字幕烧录</option>
              <option>格式转换</option>
              <option>音视频合并</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>输出目录</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control 
                type="text" 
                placeholder="选择输出目录..." 
                disabled
                readOnly
              />
              <Button variant="outline-secondary" disabled>
                <FaFolderOpen />
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* 处理控制 */}
      <Card className="mb-3">
        <Card.Header>
          <strong>3. 开始处理</strong>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2">
            <Button 
              variant="success" 
              disabled={processing || files.length === 0}
            >
              <FaPlay className="me-2" />
              开始批量处理
            </Button>
            <Button 
              variant="danger" 
              disabled={!processing}
            >
              <FaStop className="me-2" />
              停止处理
            </Button>
          </div>

          {processing && (
            <div className="mt-3">
              <div className="progress">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated" 
                  role="progressbar" 
                  style={{ width: '0%' }}
                />
              </div>
              <small className="text-muted mt-2 d-block">
                正在处理: 0 / {files.length}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 计划功能 */}
      <Card>
        <Card.Header>
          <strong>💡 计划功能</strong>
        </Card.Header>
        <Card.Body>
          <ul className="mb-0">
            <li>批量视频转码（统一格式、分辨率、码率）</li>
            <li>批量字幕烧录（支持多个视频使用同名字幕）</li>
            <li>批量格式转换（快速转换多个文件）</li>
            <li>批量重命名（规则化文件命名）</li>
            <li>并行处理（多个文件同时处理，提升效率）</li>
            <li>任务队列管理（暂停、恢复、重试）</li>
            <li>处理记录和日志</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
}

export default BatchTab;

