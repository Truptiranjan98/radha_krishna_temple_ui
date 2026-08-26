import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Spinner, EmptyState, RoleBadge, ConfirmDialog, useToast } from '../components/Bits';

const FILTERS = [
  { key: '', label: 'Everyone' },
  { key: 'PRIEST', label: 'Priests' },
  { key: 'DEVOTEE', label: 'Devotees' },
];

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.listUsers(filter || undefined));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, message) => {
    try {
      await fn();
      toast(message);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const confirmRemove = async () => {
    const target = removing;
    setRemoving(null);
    await act(() => api.deleteUser(target.id), `${target.name} removed`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Temple administration</p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Manage people</h1>
      <p className="mt-2 text-sm text-muted">
        Change a role, disable an account, or remove someone and all their photos.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`btn shrink-0 !py-2 !text-xs ${
              filter === f.key ? 'btn-primary' : 'btn-quiet'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && !users ? (
        <Spinner label="Loading people" />
      ) : !users?.length ? (
        <EmptyState title="Nobody here yet" body="Accounts will appear as people register." />
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {users.map((u) => {
            const isSelf = u.id === user?.id;
            const isAdminRow = u.role === 'ADMIN';
            return (
              <li key={u.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night-900 font-bold text-white">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{u.name}</span>
                      <RoleBadge role={u.role} />
                      {!u.enabled && (
                        <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.68rem] font-bold text-muted">
                          Disabled
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-[0.68rem] font-bold text-muted">You</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">{u.email}</p>
                  </div>
                </div>

                {/* Admins can't be edited or removed through the API —
                    AdminService guards it, so we don't offer the controls. */}
                {!isAdminRow && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="btn btn-quiet !py-2 !text-xs"
                      onClick={() =>
                        act(
                          () => api.setUserEnabled(u.id, !u.enabled),
                          u.enabled ? `${u.name} disabled` : `${u.name} enabled`,
                        )
                      }
                    >
                      {u.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-quiet !py-2 !text-xs"
                      onClick={() =>
                        act(
                          () =>
                            api.setUserRole(
                              u.id,
                              u.role === 'DEVOTEE' ? 'PRIEST' : 'DEVOTEE',
                            ),
                          `${u.name} is now a ${
                            u.role === 'DEVOTEE' ? 'priest' : 'devotee'
                          }`,
                        )
                      }
                    >
                      Make {u.role === 'DEVOTEE' ? 'priest' : 'devotee'}
                    </button>
                    <button
                      className="btn !py-2 !text-xs bg-rose-temple/10 text-rose-temple"
                      onClick={() => setRemoving(u)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing?.name}?`}
        body="Their account and every photo they uploaded are deleted. This can't be undone."
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
