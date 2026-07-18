import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Mail, Phone } from 'lucide-react';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { ROLE_BADGE_VARIANTS, ROLE_SHORT_LABELS } from '@/utils/roles';
import type { User } from '@/types/api';

export default function MyTeamPage() {
  const [search, setSearch] = useState('');
  const myId = useAuthStore(s => s.user?.id);
  const myRole = useAuthStore(s => s.user?.role);

  const query = useQuery({
    queryKey: ['my-team'],
    queryFn: () => usersApi.myTeam(),
    select: r => r.data.data,
  });

  const team = useMemo(() => query.data ?? [], [query.data]);

  // A ZSM's team arrives flat but is two levels deep — their ASMs, plus each of
  // those ASMs' own reports. Rebuild that shape from managerId so a ZSM sees who
  // sits under whom. An ASM has no second level, so this collapses to a flat list.
  const groups = useMemo(() => {
    const directs = team.filter(u => u.managerId === myId);
    const directIds = new Set(directs.map(u => u.id));
    return {
      directs: directs.map(lead => ({
        lead,
        reports: team.filter(u => u.managerId === lead.id),
      })),
      // Anyone the API returned that we couldn't place under ourselves or one of
      // our directs. Shouldn't happen, but drop them in a bucket rather than
      // silently omit someone from their own manager's roster.
      unplaced: team.filter(
        u => u.managerId !== myId && !(u.managerId && directIds.has(u.managerId)),
      ),
    };
  }, [team, myId]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return team.filter(u =>
      [u.name, u.email, u.employeeCode].some(v => v?.toLowerCase().includes(q)),
    );
  }, [team, search]);

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Team</h2>
        <p className="text-sm text-slate-400">
          {team.length === 0
            ? 'No reports yet'
            : `${team.length} ${team.length === 1 ? 'person' : 'people'} reporting to you`}
        </p>
      </div>

      {team.length > 0 && (
        <Input
          placeholder="Search by name, email, code..."
          leftIcon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {team.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No one reports to you yet"
          description={
            myRole === 'ZSM'
              ? 'Once an admin assigns ASMs to you, they and their reports will appear here.'
              : 'Once an admin assigns MRs or sales people to you, they will appear here.'
          }
        />
      ) : matches ? (
        matches.length === 0 ? (
          <EmptyState icon={<Search size={40} />} title="No matches" />
        ) : (
          <div className="space-y-3">
            {matches.map(m => <MemberCard key={m.id} user={m} />)}
          </div>
        )
      ) : (
        <div className="space-y-5">
          {groups.directs.map(({ lead, reports }) => (
            <div key={lead.id} className="space-y-2">
              <MemberCard user={lead} />
              {reports.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-2">
                  {reports.map(r => <MemberCard key={r.id} user={r} compact />)}
                </div>
              )}
            </div>
          ))}

          {groups.unplaced.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Also in your team
              </h3>
              {groups.unplaced.map(u => <MemberCard key={u.id} user={u} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberCard({ user, compact = false }: { user: User; compact?: boolean }) {
  const role = user.role.name;

  return (
    <Card padding={compact ? 'sm' : undefined}>
      <div className="flex items-start gap-3">
        <Avatar
          name={user.name}
          src={user.profilePhoto}
          className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl text-sm flex-shrink-0`}
          fallbackClassName={user.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{user.name}</span>
            <Badge variant={ROLE_BADGE_VARIANTS[role]}>{ROLE_SHORT_LABELS[role]}</Badge>
            {!user.isActive && <Badge variant="danger">Inactive</Badge>}
          </div>
          <div className="text-sm text-slate-500 truncate">{user.email}</div>
          {user.employeeCode && (
            <div className="text-xs text-slate-400 mt-0.5">{user.employeeCode}</div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {user.phone && (
            <a
              href={`tel:${user.phone}`}
              aria-label={`Call ${user.name}`}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Phone size={15} />
            </a>
          )}
          <a
            href={`mailto:${user.email}`}
            aria-label={`Email ${user.name}`}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Mail size={15} />
          </a>
        </div>
      </div>
    </Card>
  );
}
