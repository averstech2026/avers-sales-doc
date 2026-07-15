import { getUserInitials, resolveAuthorName } from '../../services/auth';
import { getRoleLabel } from '../../constants/accessControl';
import { useAuth } from '../../context/AuthContext';

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SidebarUserProps {
  collapsed: boolean;
  onOpenProfile: () => void;
}

export function SidebarUser({ collapsed, onOpenProfile }: SidebarUserProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const displayName = resolveAuthorName(user);
  const initials = getUserInitials(displayName);
  const subtitle = user.position.trim() || getRoleLabel(user.role);

  return (
    <div className="sidebar-user" title={collapsed ? displayName : undefined}>
      <button
        type="button"
        className="sidebar-user__main"
        onClick={onOpenProfile}
        title="Профиль сотрудника"
        aria-label="Открыть профиль сотрудника"
      >
        <div className="sidebar-user__avatar" aria-hidden="true">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="sidebar-user__avatar-img" />
          ) : (
            <span className="sidebar-user__avatar-initials">{initials}</span>
          )}
        </div>
        <div className="sidebar-user__info">
          <span className="sidebar-user__name">{displayName}</span>
          <span className="sidebar-user__role">{subtitle}</span>
          <span className="sidebar-user__email">{user.email}</span>
        </div>
      </button>
      <button
        type="button"
        className="sidebar-user__profile"
        onClick={onOpenProfile}
        aria-label="Настройки профиля"
        title="Профиль"
      >
        <ProfileIcon />
      </button>
      <button
        type="button"
        className="sidebar-user__logout"
        onClick={() => logout()}
        aria-label="Выйти"
        title="Выйти"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}
