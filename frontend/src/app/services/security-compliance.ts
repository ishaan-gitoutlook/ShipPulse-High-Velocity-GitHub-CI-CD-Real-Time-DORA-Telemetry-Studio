import { Injectable } from '@angular/core';

export interface SlsaRuleCheck {
  id: string;
  name: string;
  level: 'SLSA Level 1' | 'SLSA Level 2' | 'SLSA Level 3' | 'OpenSSF Scorecard';
  passed: boolean;
  score: number; // 0 to 10
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  recommendation: string;
  autoFixAvailable: boolean;
}

export interface LeakedSecretFinding {
  id: string;
  type: string;
  lineNumber: number;
  matchSnippet: string;
  maskedSnippet: string;
  suggestedSecretKey: string;
  severity: 'critical' | 'high';
}

export interface SecurityAuditReport {
  overallScore: number; // 0 to 100
  slsaLevelAchieved: 'None' | 'Level 1' | 'Level 2' | 'Level 3';
  passedChecksCount: number;
  totalChecksCount: number;
  criticalIssuesCount: number;
  findings: SlsaRuleCheck[];
  leakedSecrets: LeakedSecretFinding[];
}

@Injectable({
  providedIn: 'root'
})
export class SecurityComplianceService {
  // Known Action Version -> SHA mapping database for one-click pinning
  private readonly actionShaDatabase: Record<string, { sha: string; versionComment: string }> = {
    'actions/checkout@v4': { sha: 'actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11', versionComment: 'v4.1.7' },
    'actions/checkout@v3': { sha: 'actions/checkout@f43a0e5ff2bd294095638e18286ca9a3d1956744', versionComment: 'v3.6.0' },
    'actions/setup-node@v4': { sha: 'actions/setup-node@1e60f639196014664a7e1a67761462a713bf1097', versionComment: 'v4.0.3' },
    'actions/setup-node@v3': { sha: 'actions/setup-node@5e21ff4d9bc1a8cf6de233a3057d20ec6b3fb69d', versionComment: 'v3.8.1' },
    'actions/setup-python@v5': { sha: 'actions/setup-python@39cd14951b08e74b54015e9e001cdefcb80e669f', versionComment: 'v5.1.1' },
    'actions/setup-go@v5': { sha: 'actions/setup-go@0a12ed9d6a96ab950c8f026ed9f722fe0da7ef32', versionComment: 'v5.0.2' },
    'actions/cache@v4': { sha: 'actions/cache@0c45773b623bea8c8e75f6c82b208c3cf94ea4f9', versionComment: 'v4.0.2' },
    'actions/upload-artifact@v4': { sha: 'actions/upload-artifact@65462800fd760344b1a7b4382951275a0abb4808', versionComment: 'v4.3.3' },
    'actions/download-artifact@v4': { sha: 'actions/download-artifact@65a9edc5881444af0b9093a5e628f2fe47ea3b2e', versionComment: 'v4.1.7' },
    'google-github-actions/auth@v2': { sha: 'google-github-actions/auth@71fee02933734bd4a29b54b14949f8d3879b71a6', versionComment: 'v2.1.3' },
    'google-github-actions/deploy-cloudrun@v2': { sha: 'google-github-actions/deploy-cloudrun@0d743b0e91176e3790f7725da4c5142f9a86ac4a', versionComment: 'v2.4.0' },
    'docker/build-push-action@v5': { sha: 'docker/build-push-action@4a13e500e05cf64b009e568c12f71553d4242e22', versionComment: 'v5.3.0' },
    'docker/setup-buildx-action@v3': { sha: 'docker/setup-buildx-action@d70bba72b1f501b344493f01b4f4c13857d44a95', versionComment: 'v3.3.0' }
  };

  auditWorkflow(yamlText: string): SecurityAuditReport {
    const checks: SlsaRuleCheck[] = [];
    const leakedSecrets = this.scanForLeakedSecrets(yamlText);

    // Rule 1: Action Pinning with Full Commit SHA (OpenSSF / SLSA L3)
    const hasUnpinnedActions = /uses:\s*[-\w./]+@v\d+/i.test(yamlText);
    const usesActions = yamlText.includes('uses:');
    checks.push({
      id: 'SLSA-PIN-SHA',
      name: 'Action SHA-1 Commit Pinning',
      level: 'SLSA Level 3',
      passed: usesActions && !hasUnpinnedActions,
      score: (!hasUnpinnedActions && usesActions) ? 10 : 3,
      severity: 'critical',
      details: hasUnpinnedActions 
        ? 'Workflow references mutable git tags (e.g. @v4). An attacker compromising the upstream tag could inject malicious code.' 
        : 'All workflow actions are strictly pinned to immutable 40-character commit hashes.',
      recommendation: 'Pin all "uses:" actions to immutable commit SHAs with inline version comments.',
      autoFixAvailable: true
    });

    // Rule 2: Least-Privilege Permissions Block (SLSA L2)
    const hasPermissionsBlock = /permissions:\s*/.test(yamlText);
    const hasReadAllOrContentsRead = /permissions:\s*(\n\s+.*)*contents:\s*read/i.test(yamlText) || /permissions:\s*read-all/i.test(yamlText);
    checks.push({
      id: 'SLSA-PERM-LEAST',
      name: 'Explicit Least-Privilege Token Permissions',
      level: 'SLSA Level 2',
      passed: hasPermissionsBlock && hasReadAllOrContentsRead,
      score: (hasPermissionsBlock && hasReadAllOrContentsRead) ? 10 : (hasPermissionsBlock ? 6 : 0),
      severity: 'critical',
      details: !hasPermissionsBlock 
        ? 'No top-level permissions block defined. Default GITHUB_TOKEN has broad write privileges across packages, issues, and deployments.'
        : (hasReadAllOrContentsRead ? 'Top-level permissions strictly restrict GITHUB_TOKEN to minimal required scope.' : 'Permissions block exists but does not enforce read-only defaults.'),
      recommendation: 'Declare "permissions: contents: read" at the root level of your workflow.',
      autoFixAvailable: true
    });

    // Rule 3: Injection Prevention (Untrusted Context Interpolation)
    const hasUnsafeInterpolation = /run:.*(\$\{\{\s*github\.event\.pull_request\.title|\$\{\{\s*github\.event\.issue\.body|\$\{\{\s*github\.event\.comment|\$\{\{\s*github\.head_ref)/i.test(yamlText);
    checks.push({
      id: 'SLSA-INJECT-GUARD',
      name: 'Script Injection & Context Sanitization',
      level: 'SLSA Level 2',
      passed: !hasUnsafeInterpolation,
      score: !hasUnsafeInterpolation ? 10 : 0,
      severity: 'critical',
      details: hasUnsafeInterpolation
        ? 'Detected untrusted user input interpolation (e.g. PR title or body) directly inside inline bash run: commands. Vulnerable to shell injection.'
        : 'Inline scripts do not directly interpolate untrusted GitHub event contexts.',
      recommendation: 'Pass untrusted contexts via environment variables (env:) rather than directly inside run: strings.',
      autoFixAvailable: false
    });

    // Rule 4: Secret Masking & Leak Detection
    const hasLeaks = leakedSecrets.length > 0;
    checks.push({
      id: 'SLSA-SECRET-MASK',
      name: 'Plaintext Secret Leak Detection',
      level: 'SLSA Level 1',
      passed: !hasLeaks,
      score: !hasLeaks ? 10 : 0,
      severity: 'critical',
      details: hasLeaks
        ? `Found ${leakedSecrets.length} potential hardcoded API key(s) or secret token(s) directly in workflow YAML.`
        : 'No hardcoded credentials, access tokens, or private keys detected in workflow definition.',
      recommendation: 'Wrap sensitive tokens in ${{ secrets.KEY_NAME }} and store them in GitHub repository secrets.',
      autoFixAvailable: true
    });

    // Rule 5: Runner Isolation & Tamper Proofing
    const usesSelfHostedWithoutLabels = /runs-on:\s*self-hosted/i.test(yamlText) && !/runs-on:\s*\[.*self-hosted.*\]/i.test(yamlText);
    checks.push({
      id: 'SLSA-RUNNER-ISOLATION',
      name: 'Isolated Ephemeral Runner Environment',
      level: 'OpenSSF Scorecard',
      passed: !usesSelfHostedWithoutLabels,
      score: !usesSelfHostedWithoutLabels ? 10 : 4,
      severity: 'medium',
      details: usesSelfHostedWithoutLabels
        ? 'Self-hosted runner lacks strict ephemeral sandboxing labels. Risk of state persistence between PR runs.'
        : 'Workflow runs on ephemeral GitHub-hosted sandboxes (ubuntu-latest).',
      recommendation: 'Ensure runners are destroyed after each run or use official GitHub-hosted environments.',
      autoFixAvailable: false
    });

    // Compute Overall Score
    const totalScore = checks.reduce((acc, c) => acc + c.score, 0);
    const maxScore = checks.length * 10;
    const overallScore = Math.round((totalScore / maxScore) * 100);

    let slsaLevel: 'None' | 'Level 1' | 'Level 2' | 'Level 3' = 'None';
    if (overallScore >= 90 && !hasLeaks && !hasUnpinnedActions) slsaLevel = 'Level 3';
    else if (overallScore >= 75 && !hasLeaks) slsaLevel = 'Level 2';
    else if (overallScore >= 50) slsaLevel = 'Level 1';

    const passedCount = checks.filter(c => c.passed).length;
    const criticalCount = checks.filter(c => !c.passed && c.severity === 'critical').length + leakedSecrets.length;

    return {
      overallScore,
      slsaLevelAchieved: slsaLevel,
      passedChecksCount: passedCount,
      totalChecksCount: checks.length,
      criticalIssuesCount: criticalCount,
      findings: checks,
      leakedSecrets
    };
  }

  // Real-time Regex Secret Scanner
  scanForLeakedSecrets(yamlText: string): LeakedSecretFinding[] {
    const findings: LeakedSecretFinding[] = [];
    const lines = yamlText.split('\n');

    const patterns = [
      { name: 'AWS Access Key ID', regex: /(AKIA[0-9A-Z]{16})/g, keyName: 'AWS_ACCESS_KEY_ID' },
      { name: 'GitHub Personal Access Token (Classic)', regex: /(ghp_[a-zA-Z0-9]{36})/g, keyName: 'GH_PAT_TOKEN' },
      { name: 'GitHub Fine-Grained Token', regex: /(github_pat_[a-zA-Z0-9_]{40,})/g, keyName: 'GH_FINE_GRAINED_PAT' },
      { name: 'Stripe Live Secret Key', regex: /(sk_live_[0-9a-zA-Z]{24,})/g, keyName: 'STRIPE_SECRET_KEY' },
      { name: 'OpenAI API Key', regex: /(sk-[a-zA-Z0-9]{40,})/g, keyName: 'OPENAI_API_KEY' },
      { name: 'Slack Webhook URL', regex: /(https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+)/g, keyName: 'SLACK_WEBHOOK_URL' },
      { name: 'Discord Webhook URL', regex: /(https:\/\/discord\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+)/g, keyName: 'DISCORD_WEBHOOK_URL' },
      { name: 'RSA/SSH Private Key Header', regex: /(-----BEGIN [A-Z ]*PRIVATE KEY-----)/g, keyName: 'PRIVATE_SSH_KEY' }
    ];

    lines.forEach((line, idx) => {
      // Ignore comments
      if (line.trim().startsWith('#')) return;

      patterns.forEach(p => {
        let match: RegExpExecArray | null;
        p.regex.lastIndex = 0;
        while ((match = p.regex.exec(line)) !== null) {
          const rawMatch = match[1] || match[0];
          const masked = rawMatch.substring(0, 4) + '••••••••' + rawMatch.substring(Math.max(4, rawMatch.length - 4));
          
          findings.push({
            id: 'secret-' + (idx + 1) + '-' + findings.length,
            type: p.name,
            lineNumber: idx + 1,
            matchSnippet: rawMatch,
            maskedSnippet: masked,
            suggestedSecretKey: p.keyName,
            severity: 'critical'
          });
        }
      });
    });

    return findings;
  }

  // Pin all known actions to immutable commit SHAs
  pinActionsToCommitShas(yamlText: string): string {
    let result = yamlText;

    Object.entries(this.actionShaDatabase).forEach(([tagRef, { sha, versionComment }]) => {
      const regex = new RegExp(`uses:\\s*${tagRef}(\\s*#.*)?`, 'g');
      result = result.replace(regex, `uses: ${sha} # ${versionComment}`);
    });

    return result;
  }

  // Redact a specific leaked secret snippet into ${{ secrets.KEY }}
  redactSecretInYaml(yamlText: string, secretSnippet: string, secretKeyName: string): string {
    return yamlText.replaceAll(secretSnippet, `\${{ secrets.${secretKeyName} }}`);
  }
}
