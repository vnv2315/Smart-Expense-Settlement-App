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

const convertRupeesToPaise = (amount) => {
  const match = amount.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error('Enter an amount with no more than two decimal places');
  }

  const rupees = Number(match[1]);
  const paise = Number((match[2] || '').padEnd(2, '0') || 0);
  const amountInPaise = rupees * 100 + paise;

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 1) {
    throw new Error('Amount must be at least ₹0.01');
  }

  return amountInPaise;
};

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

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

  const switchMode = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'signup' : 'login'));
    setError('');
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Smart Expense Settlement</p>
        <h1>Settle shared expenses simply.</h1>
        <p className="muted">Sign in to manage groups, expenses, and settlement plans.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Name
              <input
                autoComplete="name"
                maxLength="100"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="message error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <button className="text-button" type="button" onClick={switchMode}>
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
  const [newMemberId, setNewMemberId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const selectedGroup = groups.find((group) => group._id === selectedGroupId);
  const memberNames = useMemo(
    () => new Map((selectedGroup?.members || []).map((member) => [member._id, member.name])),
    [selectedGroup],
  );

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const replaceGroup = (updatedGroup) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) => (group._id === updatedGroup._id ? updatedGroup : group)),
    );
  };

  const loadGroups = async (token) => {
    const { groups: fetchedGroups } = await request('/groups', { token });
    setGroups(fetchedGroups);
    setSelectedGroupId((currentId) => {
      const currentGroupStillExists = fetchedGroups.some((group) => group._id === currentId);
      return currentGroupStillExists ? currentId : fetchedGroups[0]?._id || '';
    });
  };

  const refreshSettlement = async (groupId = selectedGroupId) => {
    if (!groupId) {
      setSettlement(null);
      return;
    }

    const nextSettlement = await request(`/groups/${groupId}/settlement`, {
      token: session.token,
    });
    setSettlement(nextSettlement);
  };

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    setIsLoadingGroups(true);
    loadGroups(session.token)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoadingGroups(false));
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token || !selectedGroupId) {
      setSettlement(null);
      return undefined;
    }

    let requestIsCurrent = true;
    setSettlement(null);
    setIsLoadingSettlement(true);
    setError('');

    request(`/groups/${selectedGroupId}/settlement`, { token: session.token })
      .then((nextSettlement) => {
        if (requestIsCurrent) {
          setSettlement(nextSettlement);
        }
      })
      .catch((requestError) => {
        if (requestIsCurrent) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (requestIsCurrent) {
          setIsLoadingSettlement(false);
        }
      });

    return () => {
      requestIsCurrent = false;
    };
  }, [selectedGroupId, session?.token]);

  useEffect(() => {
    if (!selectedGroup) {
      setPaidBy('');
      return;
    }

    const payerIsStillAMember = selectedGroup.members.some((member) => member._id === paidBy);

    if (!payerIsStillAMember) {
      const signedInMember = selectedGroup.members.find((member) => member._id === session.user.id);
      setPaidBy(signedInMember?._id || selectedGroup.members[0]?._id || '');
    }
  }, [paidBy, selectedGroup, session?.user.id]);

  const handleAuthenticated = (newSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    clearMessages();
    setPendingAction('create-group');

    try {
      const { group } = await request('/groups', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ name: groupName }),
      });

      setGroups((currentGroups) => [...currentGroups, group]);
      setSelectedGroupId(group._id);
      setGroupName('');
      setSuccess(`Created “${group.name}”`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    clearMessages();
    setPendingAction('add-member');

    try {
      const { group } = await request(`/groups/${selectedGroupId}/members`, {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ userId: newMemberId.trim() }),
      });

      replaceGroup(group);
      setNewMemberId('');
      setSuccess('Member added to the group');
      await refreshSettlement(group._id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleRemoveMember = async (member) => {
    const shouldRemove = window.confirm(`Remove ${member.name} from this group?`);

    if (!shouldRemove) {
      return;
    }

    clearMessages();
    setPendingAction(`remove-${member._id}`);

    try {
      const { group } = await request(`/groups/${selectedGroupId}/members/${member._id}`, {
        method: 'DELETE',
        token: session.token,
      });

      replaceGroup(group);
      setSuccess(`${member.name} was removed`);
      await refreshSettlement(group._id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();
    clearMessages();
    setPendingAction('add-expense');

    try {
      const amountInPaise = convertRupeesToPaise(amount);
      await request(`/groups/${selectedGroupId}/expenses`, {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ description, amountInPaise, paidBy }),
      });

      setDescription('');
      setAmount('');
      setSuccess('Expense added and split equally');
      await refreshSettlement();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
    }
  };

  const handleSettleTransaction = async (settlementId) => {
    clearMessages();
    setPendingAction(`settle-${settlementId}`);

    try {
      await request(
        `/groups/${selectedGroupId}/settlements/${settlementId}/settle`,
        {
          method: 'PATCH',
          token: session.token,
        },
      );

      await refreshSettlement();
      setSuccess('Payment marked as settled');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingAction('');
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
          <p className="topbar-copy">Manage shared spending and settle balances in one place.</p>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>Log out</button>
      </header>

      <div className="dashboard">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <div>
              <p className="section-label">Workspace</p>
              <h2>Your groups</h2>
            </div>
            <span className="count-badge">{groups.length}</span>
          </div>

          <form className="create-group" onSubmit={handleCreateGroup}>
            <label className="sr-only" htmlFor="group-name">New group name</label>
            <input
              id="group-name"
              maxLength="100"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="New group name"
              required
            />
            <button type="submit" disabled={pendingAction === 'create-group'}>
              {pendingAction === 'create-group' ? 'Creating…' : 'Create group'}
            </button>
          </form>

          <nav className="group-list" aria-label="Expense groups">
            {groups.map((group) => (
              <button
                className={group._id === selectedGroupId ? 'group-button selected' : 'group-button'}
                key={group._id}
                type="button"
                onClick={() => {
                  clearMessages();
                  setSelectedGroupId(group._id);
                }}
              >
                <span>{group.name}</span>
                <small>{group.members.length} {group.members.length === 1 ? 'member' : 'members'}</small>
              </button>
            ))}
          </nav>

          <div className="user-id-box">
            <span>Your user ID</span>
            <code>{session.user.id}</code>
            <small>Share this ID when someone adds you to a group.</small>
          </div>
        </aside>

        <section className="content">
          {error && <p className="message error" role="alert">{error}</p>}
          {success && <p className="message success" role="status">{success}</p>}

          {isLoadingGroups && <section className="empty-state"><p>Loading your groups…</p></section>}

          {!isLoadingGroups && !selectedGroup && (
            <section className="empty-state">
              <span className="empty-icon">₹</span>
              <h2>Create your first group</h2>
              <p>Start with a trip, flat, or event, then add members and shared expenses.</p>
            </section>
          )}

          {selectedGroup && (
            <>
              <section className="group-overview">
                <div>
                  <p className="eyebrow">Selected group</p>
                  <h2>{selectedGroup.name}</h2>
                  <p className="muted">Add members and expenses below. Balances update automatically.</p>
                </div>
                <div className="group-stat">
                  <strong>{selectedGroup.members.length}</strong>
                  <span>{selectedGroup.members.length === 1 ? 'member' : 'members'}</span>
                </div>
              </section>

              <div className="management-grid">
                <section className="panel action-panel">
                  <div className="panel-heading">
                    <span className="panel-icon">+</span>
                    <div>
                      <h3>Add a member</h3>
                      <p>Add an existing account using its user ID.</p>
                    </div>
                  </div>
                  <form className="stacked-form" onSubmit={handleAddMember}>
                    <label htmlFor="member-id">User ID</label>
                    <input
                      id="member-id"
                      value={newMemberId}
                      onChange={(event) => setNewMemberId(event.target.value)}
                      placeholder="Paste a 24-character user ID"
                      required
                    />
                    <button type="submit" disabled={pendingAction === 'add-member'}>
                      {pendingAction === 'add-member' ? 'Adding…' : 'Add member'}
                    </button>
                  </form>
                </section>

                <section className="panel action-panel">
                  <div className="panel-heading">
                    <span className="panel-icon">₹</span>
                    <div>
                      <h3>Add an expense</h3>
                      <p>The amount is split equally among current members.</p>
                    </div>
                  </div>
                  <form className="expense-form" onSubmit={handleAddExpense}>
                    <label className="wide-field" htmlFor="expense-description">
                      Description
                      <input
                        id="expense-description"
                        maxLength="200"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Dinner, hotel, fuel…"
                        required
                      />
                    </label>
                    <label htmlFor="expense-amount">
                      Amount (₹)
                      <input
                        id="expense-amount"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="100.00"
                        required
                      />
                    </label>
                    <label htmlFor="paid-by">
                      Paid by
                      <select
                        id="paid-by"
                        value={paidBy}
                        onChange={(event) => setPaidBy(event.target.value)}
                        required
                      >
                        {selectedGroup.members.map((member) => (
                          <option key={member._id} value={member._id}>{member.name}</option>
                        ))}
                      </select>
                    </label>
                    <button className="wide-field" type="submit" disabled={pendingAction === 'add-expense'}>
                      {pendingAction === 'add-expense' ? 'Adding expense…' : 'Add and split expense'}
                    </button>
                  </form>
                </section>
              </div>

              <section className="panel members-panel">
                <div className="section-heading">
                  <div>
                    <p className="section-label">People</p>
                    <h3>Group members</h3>
                  </div>
                  <span className="count-badge">{selectedGroup.members.length}</span>
                </div>
                <div className="member-list">
                  {selectedGroup.members.map((member) => (
                    <article className="member-row" key={member._id}>
                      <span className="avatar" aria-hidden="true">{getInitials(member.name)}</span>
                      <div className="member-details">
                        <strong>{member.name}</strong>
                        <span>{member.email}</span>
                        <code>{member._id}</code>
                      </div>
                      {member._id === session.user.id ? (
                        <span className="you-badge">You</span>
                      ) : (
                        <button
                          className="danger-button"
                          type="button"
                          disabled={pendingAction === `remove-${member._id}`}
                          onClick={() => handleRemoveMember(member)}
                        >
                          {pendingAction === `remove-${member._id}` ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <div className="insights-grid">
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-label">Current position</p>
                      <h3>Net balances</h3>
                    </div>
                  </div>
                  {isLoadingSettlement && <p className="muted">Updating balances…</p>}
                  {!isLoadingSettlement && settlement && (
                    <div className="balance-grid">
                      {settlement.balances.map((balance) => (
                        <article className="balance-card" key={balance.user}>
                          <span className="avatar small" aria-hidden="true">
                            {getInitials(memberNames.get(balance.user) || '?')}
                          </span>
                          <div>
                            <p>{memberNames.get(balance.user) || balance.user}</p>
                            <strong className={balance.balanceInPaise >= 0 ? 'credit' : 'debt'}>
                              {balance.balanceInPaise >= 0 ? '+' : '−'}
                              {formatMoney(Math.abs(balance.balanceInPaise))}
                            </strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-label">Suggested transfers</p>
                      <h3>Settlement plan</h3>
                    </div>
                  </div>
                  {isLoadingSettlement && <p className="muted">Calculating settlement…</p>}
                  {!isLoadingSettlement && settlement?.settlements.length === 0 && (
                    <div className="settled-state">
                      <span>✓</span>
                      <div>
                        <strong>Everyone is settled up</strong>
                        <p>No payments are currently required.</p>
                      </div>
                    </div>
                  )}
                  {!isLoadingSettlement && settlement?.settlements.length > 0 && (
                    <ol className="transaction-list">
                      {settlement.settlements.map((transaction, index) => (
                        <li key={transaction._id}>
                          <span className="transaction-number">{index + 1}</span>
                          <div className="transaction-copy">
                            <p>
                              <strong>{memberNames.get(transaction.fromUser) || transaction.fromUser}</strong>
                              {' pays '}
                              <strong>{memberNames.get(transaction.toUser) || transaction.toUser}</strong>
                            </p>
                            <strong className="transaction-amount">
                              {formatMoney(transaction.amountInPaise)}
                            </strong>
                          </div>
                          {(transaction.fromUser === session.user.id ||
                            transaction.toUser === session.user.id) && (
                            <button
                              className="settle-button"
                              type="button"
                              disabled={pendingAction === `settle-${transaction._id}`}
                              onClick={() => handleSettleTransaction(transaction._id)}
                            >
                              {pendingAction === `settle-${transaction._id}`
                                ? 'Settling…'
                                : 'Mark settled'}
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
