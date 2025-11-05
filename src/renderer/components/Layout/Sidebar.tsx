import { useTranslation } from 'react-i18next';
import logoImage from '../../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 'subtitle-convert', label: t('sidebar.subtitle_convert') },
    { id: 'merge', label: t('sidebar.merge') },
    { id: 'transcode', label: t('sidebar.transcode') },
    { id: 'subtitle-burn', label: t('sidebar.subtitle_burn') },
    { id: 'logs', label: t('sidebar.logs'), divider: true },
    { id: 'about', label: t('sidebar.about') },
  ];

  return (
    <div className="sidebar h-100 border-end" style={{ padding: 0, margin: 0, userSelect: 'none' }}>
      <div className="sidebar-logo">
        <img src={logoImage} alt="VideoTool" />
        <span className="logo-text">VideoTool</span>
      </div>
      <nav style={{ padding: 0 }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id}>
              {item.divider && <hr className="sidebar-divider" />}
              <button
                onClick={() => onTabChange(item.id)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <span>{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;

