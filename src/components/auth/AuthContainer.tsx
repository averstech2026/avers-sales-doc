import { FormEvent, useState } from 'react';
import { CornerFrame } from '../ui/CornerFrame';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../services/auth';
import { firebaseConfig } from '../../firebase';

export function AuthContainer() {
  const { firebaseReady, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="auth-container" className="auth-container">
      <div className="auth-container__backdrop" aria-hidden="true" />
      <CornerFrame className="auth-card">
        <div className="auth-card__brand">
          <h1>Генератор смет</h1>
          <p className="auth-card__subtitle">ООО «Аверс Технолоджи»</p>
        </div>

        {!firebaseReady ? (
          <div className="auth-card__setup">
            <p className="auth-card__setup-text">
              Для входа настройте Firebase: создайте файл <code>.env</code> в корне проекта и
              укажите ключи из консоли Firebase.
            </p>
            {firebaseConfig.projectId && (
              <p className="auth-card__setup-meta muted">
                Проект: <code>{firebaseConfig.projectId}</code>
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="auth-card__hint">
              Войдите с учётной записью, выданной администратором.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-form__field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@avers-tech.ru"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="auth-form__field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error && <p className="auth-form__error">{error}</p>}

              <button type="submit" className="btn btn--primary auth-form__submit" disabled={submitting}>
                {submitting ? 'Подождите…' : 'Войти'}
              </button>
            </form>
          </>
        )}
      </CornerFrame>
    </div>
  );
}
