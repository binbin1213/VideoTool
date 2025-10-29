import { Nav } from 'react-bootstrap';
import { 
  FaExchangeAlt, 
  FaFileVideo, 
  FaClosedCaptioning, 
  FaLanguage,
  FaLayerGroup,
  FaClipboardList,
  FaInfoCircle
} from 'react-icons/fa';
import logoImage from '../../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: 'subtitle-convert', icon: FaLanguage, label: '字幕转换' },
    { id: 'merge', icon: FaExchangeAlt, label: '音视频合并' },
    { id: 'transcode', icon: FaFileVideo, label: '视频转码' },
    { id: 'subtitle-burn', icon: FaClosedCaptioning, label: '字幕烧录' },
    { id: 'batch', icon: FaLayerGroup, label: '批量处理' },
    { id: 'logs', icon: FaClipboardList, label: '日志查看', divider: true },
    { id: 'about', icon: FaInfoCircle, label: '关于' },
  ];

  return (
    <div className="sidebar h-100 border-end" style={{ padding: 0, margin: 0 }}>
      <div className="sidebar-logo">
        <img src={logoImage} alt="VideoTool" />
        <span className="logo-text">VideoTool</span>
      </div>
      <Nav className="flex-column" style={{ padding: 0 }}>
        {menuItems.map((item, index) => (
          <div key={item.id}>
            {item.divider && <hr className="my-2" style={{ borderColor: '#dee2e6', margin: '8px 0' }} />}
            <Nav.Link
              onClick={() => onTabChange(item.id)}
              className={`sidebar-item d-flex align-items-center ${
                activeTab === item.id ? 'active' : ''
              }`}
            >
              <item.icon className="me-2" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="badge bg-danger ms-auto">{item.badge}</span>
              )}
            </Nav.Link>
          </div>
        ))}
      </Nav>
    </div>
  );
}

export default Sidebar;

