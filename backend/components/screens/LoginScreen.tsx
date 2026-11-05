'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Agent } from '../Agent';
import { Icon } from '../Icon';
import { Lockup } from '../Lockup';
import { useParentSession } from '../state/useParentSession';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_EMAIL = 'anna@example.com';
const DEMO_PASSWORD = 'maja-and-leo';
const PARENT_HOME = '/parent';

export function LoginScreen() {
  const router = useRouter();
  const session = useParentSession();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  function enter(parentEmail: string): void {
    session.login(parentEmail);
    router.push(PARENT_HOME);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Type your email, like anna@example.com.');
      return;
    }

    if (password === '') {
      setError('Type your password.');
      return;
    }

    setError(null);
    enter(trimmedEmail);
  }

  function togglePassword(): void {
    setShowPassword((previous) => !previous);
  }

  function openHelp(): void {
    setShowHelp(true);
  }

  const passwordType = showPassword ? 'text' : 'password';
  const passwordIcon = showPassword ? 'eyeOff' : 'eye';
  const passwordToggleLabel = showPassword ? 'Hide password' : 'Show password';

  return (
    <div className="split">
      <section className="brandside" aria-label="EduBotGames">
        <div className="brand-inner">
          <Lockup href="/login" tone="on-teal" size="lg" />
          <h1>Parents pick the topic. Kids pick the game.</h1>
          <div className="crew">
            <Agent agent="robo" size="s220" motion="bob" alt="Robo, the team lead" />
            <Agent agent="prof" size="s120" motion="bob" alt="Prof" />
            <Agent agent="lens" size="s120" motion="bob" alt="Lens" />
          </div>
          <p className="pill">AI that teaches, not cheats.</p>
        </div>
      </section>
      <main className="formside">
        <form className="formcard" onSubmit={handleSubmit} noValidate>
          <h2 className="h-par">Log in</h2>
          <p className="p-par">Set a goal for your kids and see what they learned.</p>
          <p className="demo-note">
            <Icon name="users" />
            Demo account: Anna with Maja and Leo
          </p>
          <div className="fld">
            <label htmlFor="login-email">Email</label>
            <div className="in">
              <Icon name="mail" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="anna@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
          <div className="fld">
            <label htmlFor="login-password">Password</label>
            <div className="in">
              <Icon name="lock" />
              <input
                id="login-password"
                type={passwordType}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="act"
                type="button"
                aria-label={passwordToggleLabel}
                aria-pressed={showPassword}
                onClick={togglePassword}
              >
                <Icon name={passwordIcon} />
              </button>
            </div>
          </div>
          {error !== null && (
            <p className="notice bad" role="alert">
              {error}
            </p>
          )}
          <button className="link" type="button" onClick={openHelp}>
            Forgot password?
          </button>
          {showHelp && (
            <p className="notice" role="status">
              Accounts are not open yet. Any email and password logs you in as Anna.
            </p>
          )}
          <button className="cta teal" type="submit">
            Log in
          </button>
          <Link className="kidlink" href="/join">
            <img src="/brand/agents/robo-head.svg" alt="" width={44} height={44} />
            <span>Kid? Join with a code</span>
            <Icon name="arrow" />
          </Link>
          <p className="small-c">
            New here?{' '}
            <button className="link" type="button" onClick={openHelp}>
              Create an account
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
