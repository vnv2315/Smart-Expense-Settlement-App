import { useEffect, useMemo, useState } from 'react';

import request from './api.js';

const SESSION_KEY = 'smart-expense-session';

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
};

const formatMoney = (amountInPaise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amountInPaise / 100);

const AuthForm = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/signup';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const session = await request(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Smart Expense Settlement</p>
        <h1>Settle shared expenses simply.</h1>
        <p className="muted">Sign in to view your groups and settlement plans.</p>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <button className="text-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
};

const App = () => {
  const [session, setSession] = useState(readSession);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [settlement, setSettlement] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedGroup = groups.find((group) => group._id === selectedGroupId);
  const memberNames = useMemo(
    () =>
      new Map(
        (selectedGroup?.members || []).map((member) => [member._id, member.name]),
      ),
    [selectedGroup],
  );

  const loadGroups = async (token) => {
    const { groups: fetchedGroups } = await request('/groups', { token });
    setGroups(fetchedGroups);
    setSelectedGroupId((currentId) => currentId || fetchedGroups[0]?._id || '');
  };

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    setIsLoading(true);
    loadGroups(session.token)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token || !selectedGroupId) {
      setSettlement(null);
      return;
    }

    setIsLoading(true);
    request(`/groups/${selectedGroupId}/settlement`, { token: session.token })
      .then(setSettlement)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [selectedGroupId, session?.token]);

  const handleAuthenticated = (newSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const { group } = await request('/groups', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ name: groupName }),
      });

      setGroupName('');
      await loadGroups(session.token);
      setSelectedGroupId(group._id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setGroups([]);
    setSelectedGroupId('');
    setSettlement(null);
  };

  if (!session?.token) {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Smart Expense Settlement</p>
          <h1>Welcome, {session.user.name}</h1>
        </div>
        <button className="secondary-button" onClick={handleLogout}>Log out</button>
      </header>

      <div className="dashboard">
        <aside className="sidebar">
          <h2>Your groups</h2>
          <form className="create-group" onSubmit={handleCreateGroup}>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="New group name"
              required
            />
            <button type="submit">Create</button>
          </form>
          <div className="group-list">
            {groups.map((group) => (
              <button
                className={group._id === selectedGroupId ? 'group-button selected' : 'group-button'}
                key={group._id}
                onClick={() => setSelectedGroupId(group._id)}
              >
                {group.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="content">
          {error && <p className="error">{error}</p>}
          {isLoading && <p className="muted">Loading…</p>}
          {!isLoading && !selectedGroup && (
            <section className="empty-state">
              <h2>Create your first group</h2>
              <p>Use the form on the left to begin tracking a shared expense.</p>
            </section>
          )}
          {selectedGroup && settlement && (
            <>
              <section className="group-header">
                <div>
                  <p className="eyebrow">Selected group</p>
                  <h2>{selectedGroup.name}</h2>
                </div>
                <p className="muted">{selectedGroup.members.length} members</p>
              </section>

              <section className="card">
                <h3>Members</h3>
                <div className="member-list">
                  {selectedGroup.members.map((member) => (
                    <span className="member-chip" key={member._id}>{member.name}</span>
                  ))}
                </div>
              </section>

              <section className="balance-grid">
                {settlement.balances.map((balance) => (
                  <article className="card balance-card" key={balance.user}>
                    <p className="muted">{memberNames.get(balance.user) || balance.user}</p>
                    <strong className={balance.balanceInPaise >= 0 ? 'credit' : 'debt'}>
                      {balance.balanceInPaise >= 0 ? '+' : '−'}
                      {formatMoney(Math.abs(balance.balanceInPaise))}
                    </strong>
                  </article>
                ))}
              </section>

              <section className="card">
                <h3>Settlement plan</h3>
                {settlement.transactions.length === 0 ? (
                  <p className="muted">Everyone is settled up.</p>
                ) : (
                  <ul className="transaction-list">
                    {settlement.transactions.map((transaction, index) => (
                      <li key={`${transaction.from}-${transaction.to}-${index}`}>
                        <strong>{memberNames.get(transaction.from) || transaction.from}</strong>
                        <span> pays </span>
                        <strong>{memberNames.get(transaction.to) || transaction.to}</strong>
                        <span> {formatMoney(transaction.amountInPaise)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
