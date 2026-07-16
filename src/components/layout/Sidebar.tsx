import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { PersonalizationSettings } from '../settings/PersonalizationSettings';
import { ProfileSettings } from '../settings/ProfileSettings';
import { AVERS_LOGO_ICON } from '../../utils/clientLogo';
import { useAuth } from '../../context/AuthContext';
import { getCopyrightYear, getVersionLabel, APP_VERSION } from '../../constants/version';
import { SidebarUser } from './SidebarUser';

const SIDEBAR_COLLAPSED_KEY = 'avers-sidebar-collapsed';

function EstimatesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="sidebar__link-icon-svg"
      aria-hidden="true"
    >
      <path
        d="M9 12H15M9 16H13M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlidesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="sidebar__link-icon-svg"
      aria-hidden="true"
    >
      <path
        d="M4 6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V17.5C20 18.3284 19.3284 19 18.5 19H5.5C4.67157 19 4 18.3284 4 17.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 9.5H16M8 12.5H14M8 15.5H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Сметы и КП', icon: <EstimatesIcon /> },
  { to: '/companies', label: 'Контрагенты', icon: '🏢' },
  { to: '/products', label: 'Продукты и услуги', icon: '💿' },
  { to: '/slides', label: 'Слайды КП', icon: <SlidesIcon /> },
];

const comingSoon = [
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
