import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveEmployeeProfile } from '../../services/userProfile';

interface ProfileSettingsProps {
  open?: boolean;
}

export function ProfileSettings({ open = true }: ProfileSettingsProps) {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.fullName);
    setPosition(user.position);
    setSaved(false);
    setError('');
  }, [open, user]);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);

    try {
      await saveEmployeeProfile(user.uid, { fullName, position });
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-settings">
      <section className="profile-settings__section">
        <h3 className="profile-settings__title">Личные данные</h3>
        <p className="profile-settings__hint">
          ФИО и должность используются в блоке подписи при экспорте сметы в PDF.
        </p>

        <form className="profile-settings__form" onSubmit={handleSubmit}>
          <label className="profile-settings__field">
            <span>ФИО</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSaved(false);
              }}
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
            />
          </label>

          <label className="profile-settings__field">
            <span>Должность</span>
            <input
              type="text"
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setSaved(false);
              }}
              placeholder="Руководитель проектов"
              autoComplete="organization-title"
            />
          </label>

          {error && <p className="profile-settings__error">{error}</p>}

          <div className="profile-settings__toolbar">
            {saved && <span className="profile-settings__status">Сохранено</span>}
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить профиль'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
