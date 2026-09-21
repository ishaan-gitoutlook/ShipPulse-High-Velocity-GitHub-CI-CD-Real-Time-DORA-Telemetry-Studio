import { Injectable } from '@angular/core';
import { parseDocument, YAMLParseError, YAMLWarning } from 'yaml';

export type IssueCategory = 'syntax' | 'schema' | 'security' | 'best-practice' | 'deprecation';

export interface YamlLintIssue {
  severity: 'error' | 'warning' | 'info';
  category: IssueCategory;
  message: string;
  line: number;
  column: number;
  code?: string;
  snippet?: string;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface JobGraphNode {
  id: string;
  name: string;
  runsOn?: string;
  needs: string[];
  stepsCount: number;
  hasUses: boolean;
  hasRun: boolean;
  status: 'valid' | 'warning' | 'error';
  issues: string[];
}

export interface YamlLintStats {
  linesCount: number;
  jobsCount: number;
  jobNames: string[];
  triggers: string[];
  hasValidStructure: boolean;
  securityRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  healthScore: number; // 0 - 100
  scoreBreakdown: {
    syntaxScore: number;
    securityScore: number;
    bestPracticesScore: number;
    reliabilityScore: number;
  };
  jobGraph: JobGraphNode[];
  hasPermissions: boolean;
  hasConcurrency: boolean;
  hasTimeouts: boolean;
}

export interface YamlLintResult {
  isValid: boolean;
  errors: YamlLintIssue[];
  warnings: YamlLintIssue[];
  infos: YamlLintIssue[];
  stats: YamlLintStats;
}

@Injectable({
  providedIn: 'root'
})
export class YamlLinter {

  /**
   * Lints the provided YAML string using AST parsing and strict GitHub Actions workflow rules.
   */
  lint(content: string): YamlLintResult {
    const errors: YamlLintIssue[] = [];
    const warnings: YamlLintIssue[] = [];
    const infos: YamlLintIssue[] = [];
    const lines = (content || '').split('\n');

    if (!content || !content.trim()) {
      return {
        isValid: false,
        errors: [{
          severity: 'error',
          category: 'syntax',
          message: 'Workflow configuration cannot be empty.',
          line: 1,
          column: 1,
          code: 'EMPTY_FILE',
          suggestion: 'Select a template or provide a valid GitHub Actions workflow definition.'
        }],
        warnings: [],
        infos: [],
        stats: {
          linesCount: 0,
          jobsCount: 0,
          jobNames: [],
          triggers: [],
          hasValidStructure: false,
          securityRating: 'F',
          healthScore: 0,
          scoreBreakdown: {
            syntaxScore: 0,
            securityScore: 0,
            bestPracticesScore: 0,
            reliabilityScore: 0
          },
          jobGraph: [],
          hasPermissions: false,
          hasConcurrency: false,
          hasTimeouts: false
        }
      };
    }

    // 1. Check for tab characters (Strict YAML standard forbids tab indentation)
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const leadingTabs = lineText.match(/^[\t ]*(\t)/);
      if (leadingTabs && leadingTabs.index !== undefined) {
        const tabCol = lineText.indexOf('\t') + 1;
        errors.push({
          severity: 'error',
          category: 'syntax',
          message: 'Tab character found in indentation. YAML strictly requires spaces instead of tabs.',
          line: lineNum,
          column: tabCol,
          code: 'TAB_INDENTATION',
          snippet: lineText.trim().slice(0, 60),
          suggestion: 'Replace tab characters with 2 spaces.',
          autoFixable: true
        });
      }
    });

    // 2. Scan lines for Potential Hardcoded Plaintext Secrets / Tokens
    const sensitiveKeyPatterns = [
      { pattern: /(?:api_?key|secret_?key|auth_?token|jwt_?secret|password|private_?key|access_?token|aws_?secret_?access_?key)[\s:=]+["']?([a-zA-Z0-9_\-.~+/$=!]{8,})["']?/i, desc: 'Hardcoded secret token or password' },
      { pattern: /ghp_[a-zA-Z0-9]{20,}/i, desc: 'GitHub Personal Access Token' },
      { pattern: /sk-live-[a-zA-Z0-9]{24,}/i, desc: 'Live API secret key' },
      { pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/, desc: 'Embedded private cryptographic key' }
    ];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      // Skip lines that already properly use GitHub Secrets expressions
      if (lineText.includes('${{ secrets.') || lineText.includes('${{secrets.')) {
        return;
      }
      for (const check of sensitiveKeyPatterns) {
        if (check.pattern.test(lineText)) {
          // Verify it's not just an example placeholder
          const match = lineText.match(check.pattern);
          const val = match ? match[1] || match[0] : '';
          if (!val.toLowerCase().includes('placeholder') && !val.toLowerCase().includes('example') && !val.startsWith('${{')) {
            warnings.push({
              severity: 'warning',
              category: 'security',
              message: `Potential hardcoded sensitive credential detected: ${check.desc}.`,
              line: lineNum,
              column: Math.max(1, lineText.search(check.pattern) + 1),
              code: 'HARDCODED_SECRET',
              snippet: lineText.trim().slice(0, 60),
              suggestion: 'Store sensitive credentials in GitHub Secrets and reference with ${{ secrets.YOUR_KEY }}.',
              autoFixable: true
            });
          }
        }
      }
    });

    // 3. Scan for Expression syntax issues (${{ ... }})
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      if (lineText.includes('${{')) {
        const openCount = (lineText.match(/\${{/g) || []).length;
        const closeCount = (lineText.match(/}}/g) || []).length;
        if (openCount !== closeCount) {
          errors.push({
            severity: 'error',
            category: 'syntax',
            message: 'Unbalanced GitHub Actions expression syntax. ${{ must have matching }}.',
            line: lineNum,
            column: lineText.indexOf('${{') + 1,
            code: 'UNBALANCED_EXPRESSION',
            snippet: lineText.trim().slice(0, 60),
            suggestion: 'Ensure every "${{" is closed with "}}".'
          });
        }
      }
    });

    // 4. Parse AST with 'yaml' library
    let doc: ReturnType<typeof parseDocument> | null = null;
    try {
      doc = parseDocument(content, {
        prettyErrors: true,
        keepSourceTokens: true
      });

      // Extract parser syntax errors
      if (doc.errors && doc.errors.length > 0) {
        for (const err of doc.errors as YAMLParseError[]) {
          const linePos = err.linePos;
          const line = linePos && linePos[0] ? linePos[0].line : 1;
          const col = linePos && linePos[0] ? linePos[0].col : 1;

          let cleanMsg = err.message || 'YAML Syntax Error';
          if (cleanMsg.includes(':\n')) {
            cleanMsg = cleanMsg.split(':\n')[0].trim();
          }

          let suggestion: string | undefined;
          if (cleanMsg.toLowerCase().includes('mapping values are not allowed')) {
            suggestion = 'Check colon placement, missing spaces after ":", or invalid indentation.';
          } else if (cleanMsg.toLowerCase().includes('block sequence')) {
            suggestion = 'Check list hyphens ("- ") indentation and spacing.';
          } else if (cleanMsg.toLowerCase().includes('end of stream') || cleanMsg.toLowerCase().includes('flow')) {
            suggestion = 'Ensure all quotes, brackets, and braces are correctly closed.';
          } else if (cleanMsg.toLowerCase().includes('duplicate key') || cleanMsg.toLowerCase().includes('duplicated mapping key')) {
            suggestion = 'Remove or rename the duplicate key identifier.';
          }

          errors.push({
            severity: 'error',
            category: 'syntax',
            message: cleanMsg,
            line,
            column: col,
            code: err.code || 'SYNTAX_ERROR',
            snippet: lines[line - 1] ? lines[line - 1].trim().slice(0, 60) : undefined,
            suggestion
          });
        }
      }

      // Extract parser warnings
      if (doc.warnings && doc.warnings.length > 0) {
        for (const warn of doc.warnings as YAMLWarning[]) {
          const linePos = warn.linePos;
          const line = linePos && linePos[0] ? linePos[0].line : 1;
          const col = linePos && linePos[0] ? linePos[0].col : 1;

          warnings.push({
            severity: 'warning',
            category: 'syntax',
            message: warn.message,
            line,
            column: col,
            code: warn.code || 'PARSER_WARNING',
            snippet: lines[line - 1] ? lines[line - 1].trim().slice(0, 60) : undefined
          });
        }
      }
    } catch (parseEx: unknown) {
      const errorMsg = parseEx instanceof Error ? parseEx.message : 'Failed to parse YAML document';
      errors.push({
        severity: 'error',
        category: 'syntax',
        message: errorMsg,
        line: 1,
        column: 1,
        code: 'PARSER_EXCEPTION'
      });
    }

    // 5. GitHub Actions Workflow Structural, Schema & Best Practice Verification
    const jobNames: string[] = [];
    const triggers: string[] = [];
    const jobGraph: JobGraphNode[] = [];
    let hasValidStructure = false;
    let hasPermissions = false;
    let hasConcurrency = false;
    let hasTimeouts = false;

    if (doc && errors.length === 0) {
      const json = doc.toJSON();
      if (!json || typeof json !== 'object' || Array.isArray(json)) {
        errors.push({
          severity: 'error',
          category: 'schema',
          message: 'Root of GitHub Actions workflow must be a key-value mapping (dictionary).',
          line: 1,
          column: 1,
          code: 'INVALID_ROOT',
          suggestion: 'Define top-level keys like "name:", "on:", and "jobs:".'
        });
      } else {
        // Verify 'name'
        if (!json.name) {
          infos.push({
            severity: 'info',
            category: 'best-practice',
            message: 'Top-level "name:" is omitted. GitHub Actions will default to the workflow file path.',
            line: 1,
            column: 1,
            code: 'MISSING_NAME',
            suggestion: 'Add a descriptive "name: CI/CD Deployment Pipeline" at the top.'
          });
        }

        // Check Permissions (Least-Privilege Security)
        if (json.permissions) {
          hasPermissions = true;
        } else {
          infos.push({
            severity: 'info',
            category: 'security',
            message: 'Workflow has no explicit "permissions:" block. Defaulting to repository default token permissions.',
            line: 1,
            column: 1,
            code: 'NO_PERMISSIONS_BLOCK',
            suggestion: 'Consider defining "permissions: contents: read" for least-privilege security posture.'
          });
        }

        // Check Concurrency
        if (json.concurrency) {
          hasConcurrency = true;
        }

        // Verify 'on' triggers
        if (!json.on) {
          errors.push({
            severity: 'error',
            category: 'schema',
            message: 'Workflow is missing required "on:" trigger declaration.',
            line: 1,
            column: 1,
            code: 'MISSING_TRIGGER',
            suggestion: 'Add "on: push:" or "on: pull_request:" or "on: workflow_dispatch:".'
          });
        } else if (typeof json.on === 'string') {
          triggers.push(json.on);
        } else if (Array.isArray(json.on)) {
          triggers.push(...json.on);
        } else if (typeof json.on === 'object') {
          triggers.push(...Object.keys(json.on));

          // Schedule cron syntax check if present
          if (json.on.schedule && Array.isArray(json.on.schedule)) {
            for (const sched of json.on.schedule) {
              if (sched && sched.cron) {
                const cronParts = String(sched.cron).trim().split(/\s+/);
                if (cronParts.length !== 5) {
                  warnings.push({
                    severity: 'warning',
                    category: 'schema',
                    message: `Invalid cron expression in schedule: "${sched.cron}". Standard cron requires 5 fields.`,
                    line: 1,
                    column: 1,
                    code: 'INVALID_CRON',
                    suggestion: 'Format: "minute hour day month day-of-week" (e.g. "0 0 * * *")'
                  });
                }
              }
            }
          }
        }

        // Verify 'jobs'
        if (!json.jobs) {
          errors.push({
            severity: 'error',
            category: 'schema',
            message: 'Workflow must declare a "jobs:" section containing one or more jobs.',
            line: 1,
            column: 1,
            code: 'MISSING_JOBS',
            suggestion: 'Add "jobs:" with at least one build, test, or deploy job.'
          });
        } else if (typeof json.jobs !== 'object' || Array.isArray(json.jobs)) {
          errors.push({
            severity: 'error',
            category: 'schema',
            message: '"jobs:" must be a mapping of job IDs to job configurations.',
            line: 1,
            column: 1,
            code: 'INVALID_JOBS_TYPE'
          });
        } else {
          const keys = Object.keys(json.jobs);
          if (keys.length === 0) {
            errors.push({
              severity: 'error',
              category: 'schema',
              message: '"jobs:" section is empty. At least one job must be defined.',
              line: 1,
              column: 1,
              code: 'EMPTY_JOBS'
            });
          } else {
            jobNames.push(...keys);

            // Check Job IDs validity
            for (const jKey of keys) {
              if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(jKey)) {
                errors.push({
                  severity: 'error',
                  category: 'schema',
                  message: `Job ID "${jKey}" contains invalid characters. Job IDs must start with a letter or _ and contain only alphanumeric characters, - or _.`,
                  line: 1,
                  column: 1,
                  code: 'INVALID_JOB_ID',
                  suggestion: `Rename "${jKey}" to "${jKey.replace(/[^a-zA-Z0-9_-]/g, '_')}".`
                });
              }
            }

            // Inspect each job definition
            for (const jKey of keys) {
              const jobDef = json.jobs[jKey];
              const jobIssues: string[] = [];

              if (!jobDef || typeof jobDef !== 'object') {
                errors.push({
                  severity: 'error',
                  category: 'schema',
                  message: `Job "${jKey}" definition must be an object.`,
                  line: 1,
                  column: 1,
                  code: 'INVALID_JOB_DEFINITION'
                });
                jobGraph.push({
                  id: jKey,
                  name: jKey,
                  needs: [],
                  stepsCount: 0,
                  hasUses: false,
                  hasRun: false,
                  status: 'error',
                  issues: ['Invalid job definition']
                });
                continue;
              }

              // Check runs-on
              if (!jobDef['runs-on'] && !jobDef.uses) {
                errors.push({
                  severity: 'error',
                  category: 'schema',
                  message: `Job "${jKey}" is missing required "runs-on:" (e.g. runs-on: ubuntu-latest).`,
                  line: 1,
                  column: 1,
                  code: 'MISSING_RUNS_ON',
                  suggestion: `Add "runs-on: ubuntu-latest" under "${jKey}:".`,
                  autoFixable: true
                });
                jobIssues.push('Missing runs-on');
              } else if (jobDef['runs-on']) {
                const runner = String(jobDef['runs-on']);
                const validRunners = ['ubuntu-latest', 'ubuntu-24.04', 'ubuntu-22.04', 'ubuntu-20.04', 'windows-latest', 'windows-2022', 'macos-latest', 'macos-14', 'macos-13', 'self-hosted'];
                if (!validRunners.includes(runner) && !runner.startsWith('${{')) {
                  infos.push({
                    severity: 'info',
                    category: 'best-practice',
                    message: `Job "${jKey}" uses custom runner "${runner}". Ensure the runner environment exists in your GitHub organization.`,
                    line: 1,
                    column: 1,
                    code: 'CUSTOM_RUNNER'
                  });
                }
              }

              // Check timeouts
              if (jobDef['timeout-minutes']) {
                hasTimeouts = true;
              }

              // Check 'needs' dependencies
              const needsList: string[] = [];
              if (jobDef.needs) {
                if (typeof jobDef.needs === 'string') {
                  needsList.push(jobDef.needs);
                } else if (Array.isArray(jobDef.needs)) {
                  needsList.push(...jobDef.needs);
                }

                for (const neededJob of needsList) {
                  if (!keys.includes(neededJob)) {
                    errors.push({
                      severity: 'error',
                      category: 'schema',
                      message: `Job "${jKey}" references non-existent dependency job "${neededJob}" in "needs:".`,
                      line: 1,
                      column: 1,
                      code: 'UNKNOWN_JOB_DEPENDENCY',
                      suggestion: `Available jobs are: ${keys.join(', ')}`
                    });
                    jobIssues.push(`Unknown dependency: ${neededJob}`);
                  }
                  if (neededJob === jKey) {
                    errors.push({
                      severity: 'error',
                      category: 'schema',
                      message: `Job "${jKey}" cannot depend on itself in "needs:".`,
                      line: 1,
                      column: 1,
                      code: 'CIRCULAR_DEPENDENCY'
                    });
                    jobIssues.push('Self-referencing dependency');
                  }
                }
              }

              // Check steps
              let stepsCount = 0;
              let hasUses = false;
              let hasRun = false;

              if (jobDef.steps) {
                if (!Array.isArray(jobDef.steps)) {
                  errors.push({
                    severity: 'error',
                    category: 'schema',
                    message: `Job "${jKey}" steps must be a list (sequence) of action steps.`,
                    line: 1,
                    column: 1,
                    code: 'INVALID_STEPS_TYPE'
                  });
                  jobIssues.push('Invalid steps list');
                } else {
                  stepsCount = jobDef.steps.length;
                  if (stepsCount === 0) {
                    warnings.push({
                      severity: 'warning',
                      category: 'best-practice',
                      message: `Job "${jKey}" has an empty "steps:" array.`,
                      line: 1,
                      column: 1,
                      code: 'EMPTY_STEPS'
                    });
                  }

                  jobDef.steps.forEach((step: Record<string, unknown>, stepIdx: number) => {
                    if (!step || typeof step !== 'object') {
                      errors.push({
                        severity: 'error',
                        category: 'schema',
                        message: `Step ${stepIdx + 1} in job "${jKey}" must be an object.`,
                        line: 1,
                        column: 1,
                        code: 'INVALID_STEP'
                      });
                      return;
                    }

                    const stepObj = step as Record<string, unknown>;
                    const stepUses = stepObj['uses'];
                    const stepRun = stepObj['run'];
                    const stepName = stepObj['name'];

                    if (!stepUses && !stepRun) {
                      warnings.push({
                        severity: 'warning',
                        category: 'schema',
                        message: `Step ${stepIdx + 1} ("${String(stepName || 'unnamed')}") in job "${jKey}" has neither "uses:" nor "run:" declared.`,
                        line: 1,
                        column: 1,
                        code: 'NO_OP_STEP',
                        suggestion: 'Add "run: command" or "uses: action@version".'
                      });
                    }

                    if (stepUses) {
                      hasUses = true;
                      const usesVal = String(stepUses);

                      // Check for legacy action versions (@v1, @v2, @v3 on common actions)
                      if (usesVal.includes('actions/checkout@v1') || usesVal.includes('actions/checkout@v2') || usesVal.includes('actions/checkout@v3')) {
                        warnings.push({
                          severity: 'warning',
                          category: 'deprecation',
                          message: `Outdated action version "${usesVal}". Node 20 runtime runner deprecates Node 12/16 based actions.`,
                          line: 1,
                          column: 1,
                          code: 'OUTDATED_ACTION_VERSION',
                          suggestion: 'Upgrade to actions/checkout@v4.',
                          autoFixable: true
                        });
                      } else if (usesVal.includes('actions/setup-node@v1') || usesVal.includes('actions/setup-node@v2') || usesVal.includes('actions/setup-node@v3')) {
                        warnings.push({
                          severity: 'warning',
                          category: 'deprecation',
                          message: `Outdated action version "${usesVal}". Upgrade to actions/setup-node@v4.`,
                          line: 1,
                          column: 1,
                          code: 'OUTDATED_ACTION_VERSION',
                          suggestion: 'Upgrade to actions/setup-node@v4.',
                          autoFixable: true
                        });
                      } else if (usesVal.endsWith('@master') || usesVal.endsWith('@main')) {
                        warnings.push({
                          severity: 'warning',
                          category: 'security',
                          message: `Action "${usesVal}" is pinned to mutable branch instead of a specific release tag or commit SHA.`,
                          line: 1,
                          column: 1,
                          code: 'MUTABLE_ACTION_REF',
                          suggestion: 'Pin to a major release version tag (e.g. @v4) or commit SHA for supply-chain security.'
                        });
                      }
                    }

                    if (stepRun) {
                      hasRun = true;
                    }
                  });
                }
              } else if (!(jobDef as Record<string, unknown>)['uses']) {
                warnings.push({
                  severity: 'warning',
                  category: 'schema',
                  message: `Job "${jKey}" has no "steps:" defined.`,
                  line: 1,
                  column: 1,
                  code: 'NO_STEPS',
                  suggestion: 'Add "steps:" with "uses:" or "run:" actions.'
                });
                jobIssues.push('No steps defined');
              }

              jobGraph.push({
                id: jKey,
                name: String(jobDef.name || jKey),
                runsOn: jobDef['runs-on'] ? String(jobDef['runs-on']) : undefined,
                needs: needsList,
                stepsCount,
                hasUses,
                hasRun,
                status: jobIssues.length > 0 ? (errors.some(e => e.message.includes(jKey)) ? 'error' : 'warning') : 'valid',
                issues: jobIssues
              });
            }
          }
        }

        if (errors.length === 0) {
          hasValidStructure = true;
        }
      }
    }

    // 6. Calculate Workflow Health & Security Score (0 - 100)
    let syntaxScore = 100;
    let securityScore = 100;
    let bestPracticesScore = 100;
    let reliabilityScore = 100;

    const syntaxErrors = errors.filter(e => e.category === 'syntax');
    const schemaErrors = errors.filter(e => e.category === 'schema');
    const securityIssues = [...errors, ...warnings, ...infos].filter(e => e.category === 'security');
    const bestPracticeIssues = [...warnings, ...infos].filter(e => e.category === 'best-practice' || e.category === 'deprecation');

    syntaxScore = Math.max(0, 100 - (syntaxErrors.length * 35) - (schemaErrors.length * 25));
    securityScore = Math.max(0, 100 - (securityIssues.filter(i => i.severity === 'warning').length * 20) - (securityIssues.filter(i => i.severity === 'error').length * 40));
    bestPracticesScore = Math.max(0, 100 - (bestPracticeIssues.length * 10));
    reliabilityScore = Math.max(0, 100 - (errors.length * 30) - (warnings.length * 10));

    if (!hasPermissions) {
      securityScore = Math.max(0, securityScore - 5);
    }
    if (!hasTimeouts && jobNames.length > 0) {
      reliabilityScore = Math.max(0, reliabilityScore - 5);
    }

    const overallHealthScore = Math.round(
      (syntaxScore * 0.35) + 
      (securityScore * 0.25) + 
      (bestPracticesScore * 0.20) + 
      (reliabilityScore * 0.20)
    );

    let securityRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (errors.length === 0) {
      if (overallHealthScore >= 95) securityRating = 'A+';
      else if (overallHealthScore >= 88) securityRating = 'A';
      else if (overallHealthScore >= 78) securityRating = 'B';
      else if (overallHealthScore >= 68) securityRating = 'C';
      else securityRating = 'D';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      stats: {
        linesCount: lines.length,
        jobsCount: jobNames.length,
        jobNames,
        triggers,
        hasValidStructure,
        securityRating,
        healthScore: overallHealthScore,
        scoreBreakdown: {
          syntaxScore,
          securityScore,
          bestPracticesScore,
          reliabilityScore
        },
        jobGraph,
        hasPermissions,
        hasConcurrency,
        hasTimeouts
      }
    };
  }

  /**
   * Auto-Fix: Convert tab indentation to 2 spaces
   */
  fixTabs(yaml: string): string {
    return (yaml || '').replace(/\t/g, '  ');
  }

  /**
   * Auto-Fix: Upgrade deprecated action references to modern versions
   */
  upgradeActionVersions(yaml: string): string {
    let result = yaml || '';
    result = result.replace(/actions\/checkout@v[123]/g, 'actions/checkout@v4');
    result = result.replace(/actions\/setup-node@v[123]/g, 'actions/setup-node@v4');
    result = result.replace(/actions\/setup-python@v[1234]/g, 'actions/setup-python@v5');
    result = result.replace(/actions\/setup-go@v[1234]/g, 'actions/setup-go@v5');
    result = result.replace(/actions\/upload-artifact@v[123]/g, 'actions/upload-artifact@v4');
    result = result.replace(/actions\/download-artifact@v[123]/g, 'actions/download-artifact@v4');
    result = result.replace(/docker\/setup-buildx-action@v[12]/g, 'docker/setup-buildx-action@v3');
    result = result.replace(/docker\/build-push-action@v[1234]/g, 'docker/build-push-action@v5');
    return result;
  }

  /**
   * Auto-Fix: Add missing 'runs-on: ubuntu-latest' to jobs that lack it
   */
  addRunsOnUbuntu(yaml: string): string {
    const lines = (yaml || '').split('\n');
    const output: string[] = [];
    let inJobs = false;
    let currentJobIndent = -1;
    let jobHasRunsOn = false;

    for (const line of lines) {
      if (line.match(/^jobs:\s*$/)) {
        inJobs = true;
        output.push(line);
        continue;
      }

      if (inJobs) {
        // Detect a job definition e.g. "  build:"
        const jobMatch = line.match(/^(\s{2})([a-zA-Z0-9_-]+):\s*$/);
        if (jobMatch) {
          // Check previous job
          if (currentJobIndent !== -1 && !jobHasRunsOn) {
            output.push('    runs-on: ubuntu-latest');
          }
          currentJobIndent = 2;
          jobHasRunsOn = false;
          output.push(line);
          continue;
        }

        if (line.match(/^\s{4}runs-on:/)) {
          jobHasRunsOn = true;
        }
      }

      output.push(line);
    }

    if (inJobs && currentJobIndent !== -1 && !jobHasRunsOn) {
      output.push('    runs-on: ubuntu-latest');
    }

    return output.join('\n');
  }

  /**
   * Auto-Fix: Format and normalize indentation & trailing whitespace
   */
  formatYaml(yaml: string): string {
    return (yaml || '')
      .replace(/\t/g, '  ')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim() + '\n';
  }
}
