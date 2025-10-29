import { Nav } from 'react-bootstrap';
import { 
  FaExchangeAlt, 
  FaFileVideo, 
  FaClosedCaptioning, 
  FaLanguage,
  FaLayerGroup,
  FaClipboardList
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
  ];

  return (
    <div className="sidebar bg-light h-100 border-end">
      <div className="sidebar-logo">
        <img src={logoImage} alt="VideoTool" />
        <span className="logo-text">VideoTool</span>
      </div>
      <Nav className="flex-column p-3">
        {menuItems.map((item, index) => (
          <div key={item.id}>
            {item.divider && <hr className="my-2" style={{ borderColor: '#dee2e6' }} />}
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

