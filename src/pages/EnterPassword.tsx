import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

import { PrimaryButton } from '../components/ui/Button';
import { verifyPassword } from '../api/auth';

export const EnterPassword = () => {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const email =
    searchParams.get('email') ||
    sessionStorage.getItem('authEmail') ||
    '';

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberDevice, setRememberDevice] =
    useState(false);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  // =========================================
  // PASSWORD LOCKOUT
  // =========================================

  const [failedAttempts, setFailedAttempts] =
    useState(() => {
      const stored =
        sessionStorage.getItem(
          `failedPasswordAttempts:${email}`
        );

      return stored
        ? Number(stored)
        : 0;
    });

  const [isLocked, setIsLocked] =
    useState(() => {
      return (
        sessionStorage.getItem(
          `passwordLocked:${email}`
        ) === 'true'
      );
    });

  /*
   * If the user directly opens /login
   * without an email, send them back
   * to the registration page.
   */
  useEffect(() => {
    if (!email) {
      navigate('/register', {
        replace: true,
      });
    }
  }, [email, navigate]);

  const handleSignIn = async () => {
    setError('');

    // Check whether this account is already locked
    if (isLocked) {
      navigate('/locked');
      return;
    }

    if (!email) {
      setError(
        'Email is missing. Please start again.'
      );
      return;
    }

    if (!password) {
      setError(
        'Password is required.'
      );
      return;
    }

    try {
      setLoading(true);

      const isValid =
        await verifyPassword(
          email,
          password
        );

      // =========================================
      // INCORRECT PASSWORD
      // =========================================

      if (!isValid) {
        const newFailedAttempts =
          failedAttempts + 1;

        setFailedAttempts(
          newFailedAttempts
        );

        sessionStorage.setItem(
          `failedPasswordAttempts:${email}`,
          newFailedAttempts.toString()
        );

        // Lock after 5 incorrect attempts
        if (newFailedAttempts >= 5) {
          setIsLocked(true);

          sessionStorage.setItem(
            `passwordLocked:${email}`,
            'true'
          );

          navigate('/locked');
          return;
        }

        const remaining =
          5 - newFailedAttempts;

        setError(
          `Incorrect password. ${remaining} attempt${
            remaining === 1 ? '' : 's'
          } remaining.`
        );

        return;
      }

      // =========================================
      // SUCCESSFUL LOGIN
      // =========================================

      // Clear failed attempts after successful login
      sessionStorage.removeItem(
        `failedPasswordAttempts:${email}`
      );

      sessionStorage.removeItem(
        `passwordLocked:${email}`
      );

      setFailedAttempts(0);
      setIsLocked(false);

      sessionStorage.setItem(
        'authEmail',
        email
      );

      if (rememberDevice) {
        localStorage.setItem(
          'rememberDevice',
          'true'
        );
      }

      navigate('/2fa');

    } catch (error) {
      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const displayName =
    email
      ? email.split('@')[0]
      : '';

  return (
    <div className="flex flex-col gap-6">

      <Link
        to="/register"
        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 w-fit"
      >
        &lt; Back
      </Link>

      <div>
        <p className="text-xs font-semibold tracking-wider text-slate-400 mb-2">
          STEP 2 OF 3 · PASSWORD
        </p>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Enter your password
        </h2>

        <p className="text-slate-500">
          Signing in to{' '}
          <strong>
            {email
              ? email.split('@')[1]
              : 'your account'}
          </strong>
          .
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between bg-slate-50">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-semibold">
            {displayName
              ? displayName
                  .substring(0, 2)
                  .toUpperCase()
              : 'U'}
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {email || 'No email selected'}
            </p>

            <p className="text-sm text-slate-500">
              Not you? Use a different account
            </p>
          </div>

        </div>

        <Link
          to="/register"
          className="text-indigo-600 font-semibold hover:underline"
        >
          Switch
        </Link>

      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex gap-3 text-red-700 text-sm">

          <AlertCircle
            size={18}
            className="mt-0.5 flex-shrink-0"
          />

          <div>
            <p className="font-semibold">
              Sign in failed
            </p>

            <p className="text-red-600">
              {error}
            </p>
          </div>

        </div>
      )}

      <div>

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>

        <div className="relative">

          <input
            type={
              showPassword
                ? 'text'
                : 'password'
            }
            value={password}
            onChange={(event) => {
              setPassword(
                event.target.value
              );

              setError('');
            }}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !isLocked
              ) {
                handleSignIn();
              }
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading || isLocked}
            className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-lg bg-slate-50 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            disabled={isLocked}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>

        </div>

      </div>

      <div className="flex items-center justify-between">

        <label className="flex items-center gap-2 text-sm text-slate-600">

          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(event) =>
              setRememberDevice(
                event.target.checked
              )
            }
            className="w-4 h-4"
          />

          Remember this device for 30 days

        </label>

        <Link
          to="/forgot-password"
          className="text-indigo-600 font-semibold hover:underline text-sm"
        >
          Forgot password?
        </Link>

      </div>

      <PrimaryButton
        onClick={handleSignIn}
        disabled={loading || isLocked}
      >
        {isLocked
          ? 'Account locked'
          : loading
            ? 'Signing in...'
            : 'Sign in'}
      </PrimaryButton>

      <div className="text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
        Protected by enterprise password policy ·
        5 attempts before lockout
      </div>

    </div>
  );
};