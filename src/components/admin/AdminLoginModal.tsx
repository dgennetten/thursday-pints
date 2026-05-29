import { useState, useRef, useEffect, FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { requestOtp, verifyOtp } from '../../services/authService';

interface Props {
  onClose: () => void;
  onLoginSuccess: (role: string) => void;
  forPhotos?: boolean;
}

type Step = 'email' | 'code' | 'notMember';

export default function AdminLoginModal({ onClose, onLoginSuccess, forPhotos }: Props) {
  const { login } = useAuth();
  const [step, setStep]           = useState<Step>('email');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [remember, setRemember]   = useState(true);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [adminList, setAdminList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus() }, [step]);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await requestOtp(email.trim());
      if (result.notMember) {
        setAdminList(result.admins ?? []);
        setStep('notMember');
      } else {
        setStep('code');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await verifyOtp(email.trim(), code.trim(), remember);
      login(result.id, result.email, result.role, result.token, remember, result.expiresAt);
      onLoginSuccess(result.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sign In</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                {forPhotos
                  ? 'Sign in with your member email to view photos. We\'ll send a one-time code.'
                  : 'Enter your email — we\'ll send a one-time code.'}
              </p>
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  ref={inputRef}
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to <strong>{email}</strong>. Expires in 10 minutes.
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                If it doesn't arrive, check your <strong>Spam</strong> or <strong>Junk</strong> folder.
              </p>
              <div>
                <label htmlFor="auth-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Login code
                </label>
                <input
                  ref={inputRef}
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Remember this device</span>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}

          {step === 'notMember' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                <strong>{email}</strong> is not a TP member. Please contact one of the TP admins to be added to TP membership (necessary for viewing photos). Provide your email and birth month and day:
              </p>
              {adminList.length > 0 && (
                <ul className="text-sm text-blue-700 space-y-1 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                  {adminList.map(a => (
                    <li key={a}>
                      <a href={`mailto:${a}`} className="hover:underline">{a}</a>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Try a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
