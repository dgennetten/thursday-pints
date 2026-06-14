import { useState, useRef, useEffect, FormEvent } from 'react';
import { X, Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { requestOtp, verifyOtp, requestMembership, AdminContact } from '../../services/authService';

interface Props {
  onClose: () => void;
  onLoginSuccess: (role: string) => void;
  forPhotos?: boolean;
}

type Step = 'email' | 'code' | 'notMember' | 'requestSent';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function adminDisplayName(admin: AdminContact): string {
  const name = [admin.first_name, admin.last_name].filter(Boolean).join(' ').trim();
  return name || admin.email;
}

export default function AdminLoginModal({ onClose, onLoginSuccess, forPhotos }: Props) {
  const { login } = useAuth();
  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [code, setCode]               = useState('');
  const [remember, setRemember]       = useState(true);
  const [loading, setLoading]         = useState(false);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [error, setError]             = useState('');
  const [adminList, setAdminList]     = useState<AdminContact[]>([]);
  const [birthMonth, setBirthMonth]   = useState<number | ''>('');
  const [birthDay, setBirthDay]       = useState<number | ''>('');
  const [sentToAdmin, setSentToAdmin] = useState('');
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

  async function handleMembershipRequest(admin: AdminContact) {
    setError('');
    setRequestingId(admin.id);
    try {
      const result = await requestMembership(
        email.trim(),
        admin.id,
        birthMonth !== '' ? birthMonth : undefined,
        birthDay !== '' ? birthDay : undefined,
      );
      setSentToAdmin(result.adminName ?? adminDisplayName(admin));
      setStep('requestSent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send request');
    } finally {
      setRequestingId(null);
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
                {loading ? 'Sending…' : 'Register / Send Code'}
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
                <strong>{email}</strong> is not a TP member yet. Request membership from your favorite admin — we'll email them for you.
              </p>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Birthday (optional — helps admins add you)
                </p>
                <div className="flex gap-2">
                  <select
                    value={birthMonth}
                    onChange={e => setBirthMonth(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Birth month"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((label, i) => (
                      <option key={label} value={i + 1}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={birthDay}
                    onChange={e => setBirthDay(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Day"
                    aria-label="Birth day"
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {adminList.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Choose an admin</p>
                  {adminList.map(admin => (
                    <button
                      key={admin.id}
                      type="button"
                      disabled={requestingId !== null}
                      onClick={() => handleMembershipRequest(admin)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {requestingId === admin.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <UserPlus className="w-4 h-4" />}
                      Request from {adminDisplayName(admin)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No admins are listed right now. Please try again later.
                </p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setBirthMonth(''); setBirthDay(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Try a different email
              </button>
            </div>
          )}

          {step === 'requestSent' && (
            <div className="space-y-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
              <p className="text-sm text-gray-700">
                Request sent to <strong>{sentToAdmin}</strong>. They'll add you when ready — you'll get a sign-in code once you're a member.
              </p>
              <p className="text-xs text-gray-500">
                A confirmation was sent to <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
