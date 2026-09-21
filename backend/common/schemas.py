"""
ShipPulse - Common Pydantic Models & Request/Response Schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str
    timestamp: int
    version: str = "1.0.0"


class OAuthUrlResponse(BaseModel):
    url: str
    redirect_uri: str
    state: str


class OAuthExchangeRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: Optional[int] = None
    login: str
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int = 0
    total_private_repos: int = 0
    html_url: Optional[str] = None


class RepoFileRecord(BaseModel):
    path: str
    name: str
    type: str = "file"
    size: int = 0


class RepoFilesResponse(BaseModel):
    repository: str
    branch: str = "main"
    files: List[RepoFileRecord]


class SingleFileResponse(BaseModel):
    repository: str
    path: str
    content: str


class SaveFileRequest(BaseModel):
    path: str
    content: str


class SaveFileResponse(BaseModel):
    success: bool = True
    message: str
    repository: str
    path: str
    size: int
    timestamp: str


class GenerateWorkflowRequest(BaseModel):
    template: str = "nodejs"
    filePath: str = ".github/workflows/deploy.yml"
    yamlContent: Optional[str] = None
    branch: str = "main"
    commitMessage: str = "ci: add automated deployment workflow via ShipPulse"


class GenerateWorkflowResponse(BaseModel):
    success: bool = True
    message: str
    repository: str
    filePath: str
    branch: str
    commit: Dict[str, Any]


class ExecCommandRequest(BaseModel):
    command: str = "npm test"


class ExecCommandResponse(BaseModel):
    command: str
    output: str
    exitCode: int
    durationMs: int
    timestamp: str


class YamlLintError(BaseModel):
    message: str
    line: int
    column: int
    code: str = "SYNTAX_ERROR"


class YamlLintRequest(BaseModel):
    content: str = ""


class YamlLintResponse(BaseModel):
    isValid: bool
    errors: List[YamlLintError] = []
    warnings: List[YamlLintError] = []
    parsed: Optional[Any] = None


class DeployRequest(BaseModel):
    repoFullName: str
    branch: str = "main"
    environment: str = "Production"


class DeploymentRecord(BaseModel):
    pipeline_id: str
    repo: str
    branch: str
    environment: str
    status: str
    webhook_active: bool
    auto_deploy_on_push: bool
    deployed_at: str
    url: str


class DeployResponse(BaseModel):
    success: bool = True
    message: str
    deployment: DeploymentRecord


class WebhookEventRecord(BaseModel):
    id: str
    event: str
    repoFullName: str
    branch: str
    sender: str
    commitSha: str
    commitMessage: str
    timestamp: str
    actionTaken: str
    pipelineTriggered: Optional[str] = None
    payloadSnippet: str


class WebhookHistoryResponse(BaseModel):
    success: bool = True
    total: int
    events: List[WebhookEventRecord]


class PipelineLogsResponse(BaseModel):
    pipelineId: str
    timestamp: str
    status: str
    newLog: str
    metrics: Dict[str, Any]


class PipelineActionRequest(BaseModel):
    action: str  # 'start' | 'pause' | 'resume' | 'cancel'


class PipelineActionResponse(BaseModel):
    success: bool
    pipelineId: str
    action: str
    status: str
    message: str
    timestamp: str
