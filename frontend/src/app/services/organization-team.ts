import { Injectable, signal } from '@angular/core';

export type TeamRole = 'owner' | 'admin' | 'devops' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: TeamRole;
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
  lastActive: string;
}

export interface ApiAccessToken {
  id: string;
  name: string;
  tokenPrefix: string; // e.g. adh_pat_9f1e...
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  scopes: ('repo:read' | 'workflow:write' | 'deploy:trigger' | 'security:audit' | 'admin:all')[];
  creatorName: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  action: string; // e.g. "workflow.created", "deployment.rollback", "secret.masked", "member.invited"
  category: 'deployments' | 'security' | 'workflows' | 'team' | 'billing';
  targetResource: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'critical';
  details: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationTeamService {
  currentOrganizationName = signal<string>('Alpha DevOps Cloud Org');

  members = signal<TeamMember[]>([
    {
      id: 'usr_1',
      name: 'Ishaan (You)',
      email: 'ishaan@shippulse.dev',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'owner',
      status: 'active',
      joinedAt: 'Aug 15, 2025',
      lastActive: 'Just now'
    },
    {
      id: 'usr_2',
      name: 'Alex Mercer',
      email: 'alex.m@devops-corp.io',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      status: 'active',
      joinedAt: 'Jan 10, 2026',
      lastActive: '25 mins ago'
    },
    {
      id: 'usr_3',
      name: 'Elena Rostova',
      email: 'elena@cloudnative.team',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'devops',
      status: 'active',
      joinedAt: 'Mar 22, 2026',
      lastActive: '2 hours ago'
    },
    {
      id: 'usr_4',
      name: 'Marcus Vance',
      email: 'm.vance@security-auditors.org',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'viewer',
      status: 'invited',
      joinedAt: 'Aug 29, 2026',
      lastActive: 'Invitation Pending'
    }
  ]);

  apiTokens = signal<ApiAccessToken[]>([
    {
      id: 'tok_01',
      name: 'GitHub Action Runner CI Token',
      tokenPrefix: 'adh_pat_9f1e82••••••••3b9a',
      createdAt: 'Jul 14, 2026',
      lastUsedAt: '12 mins ago',
      expiresAt: 'Jul 14, 2027',
      scopes: ['repo:read', 'workflow:write', 'deploy:trigger'],
      creatorName: 'Ishaan'
    },
    {
      id: 'tok_02',
      name: 'Slack ChatOps Dispatch Bot',
      tokenPrefix: 'adh_pat_7a2b91••••••••4f2c',
      createdAt: 'Aug 02, 2026',
      lastUsedAt: '4 hours ago',
      expiresAt: 'Aug 02, 2027',
      scopes: ['deploy:trigger', 'security:audit'],
      creatorName: 'Alex Mercer'
    }
  ]);

  auditLogs = signal<AuditLogEvent[]>([
    {
      id: 'aud_1',
      timestamp: '2 mins ago',
      actor: {
        name: 'Ishaan',
        email: 'ishaan@shippulse.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      action: 'workflow.patch_applied',
      category: 'workflows',
      targetResource: 'frontend-app/.github/workflows/deploy.yml',
      ipAddress: '103.21.144.18',
      status: 'success',
      details: 'Applied 1-Click AI Patch: Injected concurrency cancellation and least-privilege token permissions.'
    },
    {
      id: 'aud_2',
      timestamp: '42 mins ago',
      actor: {
        name: 'Alex Mercer',
        email: 'alex.m@devops-corp.io',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      action: 'security.secret_masked',
      category: 'security',
      targetResource: 'api-service/.github/workflows/production.yml',
      ipAddress: '172.56.21.90',
      status: 'warning',
      details: 'Redacted plaintext AWS Access Key and bound ${{ secrets.AWS_ACCESS_KEY_ID }}.'
    },
    {
      id: 'aud_3',
      timestamp: '3 hours ago',
      actor: {
        name: 'ShipPulse Bot',
        email: 'bot@shippulse.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
      },
      action: 'deployment.auto_rollback',
      category: 'deployments',
      targetResource: 'production/payment-gateway:8f1e29c',
      ipAddress: '192.30.252.1',
      status: 'critical',
      details: 'Automated recovery: Fast-forward rollback to commit 7a4b12 due to 2 consecutive failed healthchecks.'
    },
    {
      id: 'aud_4',
      timestamp: '1 day ago',
      actor: {
        name: 'Ishaan',
        email: 'ishaan@shippulse.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      action: 'billing.plan_upgraded',
      category: 'billing',
      targetResource: 'Subscription Tier: Team Annual',
      ipAddress: '103.21.144.18',
      status: 'success',
      details: 'Upgraded organization workspace from Starter to Team Growth plan.'
    }
  ]);

  inviteMember(name: string, email: string, role: TeamRole) {
    const newMem: TeamMember = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: email.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      role,
      status: 'invited',
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      lastActive: 'Invitation Sent'
    };

    this.members.set([...this.members(), newMem]);

    // Record audit event
    this.recordAuditEvent({
      action: 'member.invited',
      category: 'team',
      targetResource: email,
      status: 'success',
      details: `Invited new team member ${name} with role ${role.toUpperCase()}.`
    });
  }

  updateMemberRole(memberId: string, newRole: TeamRole) {
    const updated = this.members().map(m => m.id === memberId ? { ...m, role: newRole } : m);
    this.members.set(updated);
  }

  removeMember(memberId: string) {
    const target = this.members().find(m => m.id === memberId);
    const updated = this.members().filter(m => m.id !== memberId);
    this.members.set(updated);

    if (target) {
      this.recordAuditEvent({
        action: 'member.removed',
        category: 'team',
        targetResource: target.email,
        status: 'warning',
        details: `Revoked organization access for ${target.name} (${target.email}).`
      });
    }
  }

  generateApiToken(name: string, scopes: ApiAccessToken['scopes']): string {
    const rawSecret = 'adh_pat_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const prefix = rawSecret.substring(0, 11) + '••••••••' + rawSecret.substring(rawSecret.length - 4);

    const tokenRecord: ApiAccessToken = {
      id: 'tok_' + Date.now().toString(36),
      name: name.trim(),
      tokenPrefix: prefix,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      expiresAt: 'Never (Revoke anytime)',
      scopes,
      creatorName: 'Ishaan'
    };

    this.apiTokens.set([tokenRecord, ...this.apiTokens()]);

    this.recordAuditEvent({
      action: 'token.generated',
      category: 'security',
      targetResource: `API Token: ${name}`,
      status: 'success',
      details: `Generated new Personal Access Token with scopes: [${scopes.join(', ')}].`
    });

    return rawSecret;
  }

  revokeToken(tokenId: string) {
    const target = this.apiTokens().find(t => t.id === tokenId);
    this.apiTokens.set(this.apiTokens().filter(t => t.id !== tokenId));

    if (target) {
      this.recordAuditEvent({
        action: 'token.revoked',
        category: 'security',
        targetResource: `API Token: ${target.name}`,
        status: 'warning',
        details: `Revoked API access token "${target.name}".`
      });
    }
  }

  recordAuditEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp' | 'actor' | 'ipAddress'>) {
    const newLog: AuditLogEvent = {
      id: 'aud_' + Date.now().toString(36),
      timestamp: 'Just now',
      actor: {
        name: 'Ishaan',
        email: 'ishaan@shippulse.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      ipAddress: '103.21.144.18',
      ...event
    };

    this.auditLogs.set([newLog, ...this.auditLogs()]);
  }
}
