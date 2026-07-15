import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { PersonalizationSettings } from '../settings/PersonalizationSettings';
import { ProfileSettings } from '../settings/ProfileSettings';
import { AVERS_LOGO_ICON } from '../../utils/clientLogo';
import { useAuth } from '../../context/AuthContext';
import { getCopyrightYear, getVersionLabel, APP_VERSION } from '../../constants/version';
import { SidebarUser } from './SidebarUser';

const SIDEBAR_COLLAPSED_KEY = 'avers-sidebar-collapsed';

const navItems = [
  { to: '/', label: 'Главная', icon: '⌂' },
  { to: '/estimate', label: 'Новая смета', icon: '+' },
];

const comingSoon = [
  { label: 'Мои контрагенты', icon: '🏢' },
  { label: 'Шаблоны договоров', icon: '📄' },
];

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function Sidebar() {
  const { isSuperadmin } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <>
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar__head">
          <div className="sidebar__brand">
            <img src={AVERS_LOGO_ICON} alt="" className="sidebar__brand-icon" aria-hidden="true" />
            <span className="sidebar__brand-name">Аверс Технолоджи</span>
          </div>
          <button
            type="button"
            className="sidebar__toggle"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            aria-expanded={!collapsed}
          >
            <span className="sidebar__toggle-icon" aria-hidden="true">
              {collapsed ? '›' : '‹'}
            </span>
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__nav-group">
            <div className="sidebar__nav-group-label">Главное</div>
            <div className="sidebar__nav-items">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  <span className="sidebar__link-label">{item.label}</span>
                </NavLink>
              ))}
              {isSuperadmin && (
                <button
                  type="button"
                  className="sidebar__link personalization-section"
                  onClick={() => setShowSettings(true)}
                  title={collapsed ? 'Персонализация' : undefined}
                >
                  <span className="sidebar__link-icon">⚙</span>
                  <span className="sidebar__link-label">Персонализация</span>
                </button>
              )}
            </div>
          </div>

          <div className="sidebar__nav-group sidebar__nav-group--spaced">
            <div className="sidebar__nav-group-label">Скоро</div>
            <div className="sidebar__nav-items">
              {comingSoon.map((item) => (
                <div
                  key={item.label}
                  className="sidebar__link sidebar__link--disabled"
                  title={collapsed ? `${item.label} (скоро)` : 'В разработке'}
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  <span className="sidebar__link-label">
                    {item.label}
                    <span className="sidebar__badge">Soon</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <SidebarUser collapsed={collapsed} onOpenProfile={() => setShowProfile(true)} />

        <div className="sidebar__footer">
          <span className="sidebar__footer-text">
            © {getCopyrightYear()} ООО «Аверс Технолоджи»
          </span>
          <span className="sidebar__footer-version" title={getVersionLabel()}>
            {collapsed ? `v${APP_VERSION}` : getVersionLabel()}
          </span>
        </div>
      </aside>

      {isSuperadmin && (
        <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Персонализация" wide>
          <PersonalizationSettings open={showSettings} />
        </Modal>
      )}

      <Modal open={showProfile} onClose={() => setShowProfile(false)} title="Профиль сотрудника" wide>
        <ProfileSettings open={showProfile} />
      </Modal>
    </>
  );
}
