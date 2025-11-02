import { Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { 
  FaExchangeAlt, 
  FaFileVideo, 
  FaClosedCaptioning, 
  FaLanguage,
  // FaLayerGroup, // ✨ BatchTab 已隐藏，不需要此图标
  FaClipboardList,
  FaInfoCircle
} from 'react-icons/fa';
import logoImage from '../../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 'subtitle-convert', icon: FaLanguage, label: t('sidebar.subtitle_convert') },
    { id: 'merge', icon: FaExchangeAlt, label: t('sidebar.merge') },
    { id: 'transcode', icon: FaFileVideo, label: t('sidebar.transcode') },
    { id: 'subtitle-burn', icon: FaClosedCaptioning, label: t('sidebar.subtitle_burn') },
    // { id: 'batch', icon: FaLayerGroup, label: t('sidebar.batch') }, // ✨ 初期暂不开发，已隐藏
    { id: 'logs', icon: FaClipboardList, label: t('sidebar.logs'), divider: true },
    { id: 'about', icon: FaInfoCircle, label: t('sidebar.about') },
  ];

  return (
    <div className="sidebar h-100 border-end" style={{ padding: 0, margin: 0, userSelect: 'none' }}>
      <div className="sidebar-logo">
        <img src={logoImage} alt="VideoTool" />
        <span className="logo-text">VideoTool</span>
      </div>
      <Nav className="flex-column" style={{ padding: 0 }}>
        {menuItems.map((item) => (
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
            </Nav.Link>
          </div>
        ))}
      </Nav>
    </div>
  );
}

export default Sidebar;

