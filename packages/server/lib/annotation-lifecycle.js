export const ANNOTATION_STATUSES = Object.freeze(['pending', 'claimed', 'resolved', 'discarded']);
export const WORK_NOTICE_CODES = Object.freeze(['workflow_unavailable', 'execution_failed']);
export const DEFAULT_CLAIM_TTL_MS = 5 * 60 * 1000;

export function assertAnnotationStatusFilter(status, { allowAll = true } = {}) {
  const allowed = allowAll ? [...ANNOTATION_STATUSES, 'all'] : ANNOTATION_STATUSES;
  if (!allowed.includes(status)) throw new TypeError('Invalid status filter');
  return status;
}

export function assertAnnotationLifecycleState(annotation) {
  if (!annotation || typeof annotation !== 'object' || !ANNOTATION_STATUSES.includes(annotation.status)) {
    throw new LifecycleError('invalid_state', 'Annotation has an invalid lifecycle state');
  }
  if (annotation.work_notice !== undefined) {
    if (annotation.status !== 'pending') {
      throw new LifecycleError('invalid_work_notice', 'Work Notice requires a Pending Annotation');
    }
    assertWorkNotice(annotation.work_notice);
  }
  return annotation;
}

const OWNER_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._:@/-]{0,199}$/u;

export class LifecycleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LifecycleError';
    this.code = code;
  }
}

function requireOwner(owner) {
  if (typeof owner !== 'string' || !OWNER_PATTERN.test(owner)) {
    throw new LifecycleError('invalid_owner', 'Claim owner must be a bounded non-empty identity');
  }
  return owner;
}

function withoutClaim(annotation) {
  const { claim, ...remaining } = annotation;
  return remaining;
}

function withoutWorkNotice(annotation) {
  const { work_notice, ...remaining } = annotation;
  return remaining;
}

function createWorkNotice(reason, createdAt) {
  if (!reason || typeof reason !== 'object' || Array.isArray(reason)) {
    throw new LifecycleError('invalid_work_notice', 'Work Notice reason must be an object');
  }
  if (Object.keys(reason).some(key => !['code', 'summary'].includes(key)) || !WORK_NOTICE_CODES.includes(reason.code)) {
    throw new LifecycleError('invalid_work_notice', 'Work Notice code is invalid');
  }
  if (
    typeof reason.summary !== 'string'
    || reason.summary.length === 0
    || reason.summary.length > 500
    || reason.summary !== reason.summary.trim()
    || /[\u0000-\u001F\u007F]/u.test(reason.summary)
  ) {
    throw new LifecycleError('invalid_work_notice', 'Work Notice summary must be a safe bounded line');
  }
  return { code: reason.code, summary: reason.summary, created_at: createdAt };
}

export function assertWorkNotice(notice) {
  if (!notice || typeof notice !== 'object' || Array.isArray(notice)) {
    throw new LifecycleError('invalid_work_notice', 'Work Notice must be an object');
  }
  if (Object.keys(notice).some(key => !['code', 'summary', 'created_at'].includes(key))) {
    throw new LifecycleError('invalid_work_notice', 'Work Notice contains unsupported fields');
  }
  createWorkNotice({ code: notice.code, summary: notice.summary }, notice.created_at);
  if (
    typeof notice.created_at !== 'string'
    || !Number.isFinite(Date.parse(notice.created_at))
    || new Date(notice.created_at).toISOString() !== notice.created_at
  ) {
    throw new LifecycleError('invalid_work_notice', 'Work Notice timestamp must be canonical ISO 8601');
  }
  return notice;
}

export class AnnotationLifecycle {
  constructor({ now = Date.now, claimTtlMs = DEFAULT_CLAIM_TTL_MS } = {}) {
    if (typeof now !== 'function') throw new TypeError('Lifecycle clock must be a function');
    if (!Number.isSafeInteger(claimTtlMs) || claimTtlMs <= 0) throw new TypeError('Claim TTL must be a positive integer');
    this.now = now;
    this.claimTtlMs = claimTtlMs;
  }

  apply(annotation, { operation, owner, reason, resolution_record: resolutionRecord } = {}) {
    const nowMs = this.now();
    const timestamp = new Date(nowMs).toISOString();
    const current = this.current(annotation, nowMs);

    if (current.status === 'resolved' || current.status === 'discarded') {
      throw new LifecycleError('terminal_state', `${current.status} is a terminal Annotation state`);
    }

    if (operation === 'claim') {
      const identity = requireOwner(owner);
      if (current.status === 'claimed' && current.claim.owner !== identity) {
        throw new LifecycleError('claim_conflict', 'Annotation is claimed by another owner');
      }
      return {
        ...withoutWorkNotice(current),
        status: 'claimed',
        claim: {
          owner: identity,
          refreshed_at: timestamp,
          expires_at: new Date(nowMs + this.claimTtlMs).toISOString(),
        },
        updated_at: timestamp,
      };
    }

    if (operation === 'release') {
      const identity = requireOwner(owner);
      if (current.status !== 'claimed') throw new LifecycleError('invalid_transition', 'Only a claimed Annotation can be released');
      if (current.claim.owner !== identity) throw new LifecycleError('claim_conflict', 'Only the Claim owner can release the Annotation');
      return {
        ...withoutClaim(current),
        status: 'pending',
        ...(reason === undefined ? {} : { work_notice: createWorkNotice(reason, timestamp) }),
        updated_at: timestamp,
      };
    }

    if (operation === 'dismiss_notice') {
      if (current.status !== 'pending') {
        throw new LifecycleError('invalid_transition', 'Only a Pending Annotation can dismiss a Work Notice');
      }
      if (!current.work_notice) return current;
      return { ...withoutWorkNotice(current), updated_at: timestamp };
    }

    if (operation === 'resolve') {
      const identity = requireOwner(owner);
      if (current.status !== 'claimed') throw new LifecycleError('invalid_transition', 'Annotation must be claimed before it can be Resolved');
      if (current.claim.owner !== identity) throw new LifecycleError('claim_conflict', 'Only the Claim owner can resolve the Annotation');
      return {
        ...withoutClaim(current),
        status: 'resolved',
        ...(resolutionRecord !== undefined ? { resolution_record: structuredClone(resolutionRecord) } : {}),
        updated_at: timestamp,
      };
    }

    if (operation === 'discard') {
      if (current.status === 'claimed') {
        const identity = requireOwner(owner);
        if (current.claim.owner !== identity) throw new LifecycleError('claim_conflict', 'Only the Claim owner can discard a claimed Annotation');
      }
      return { ...withoutWorkNotice(withoutClaim(current)), status: 'discarded', updated_at: timestamp };
    }

    throw new LifecycleError('invalid_operation', 'Unknown Annotation lifecycle operation');
  }

  current(annotation, nowMs = this.now()) {
    if (!annotation || typeof annotation !== 'object' || Array.isArray(annotation)) {
      throw new TypeError('Annotation must be an object');
    }
    assertAnnotationLifecycleState(annotation);
    if (annotation.status !== 'claimed') return structuredClone(withoutClaim(annotation));
    if (
      !annotation.claim
      || typeof annotation.claim.expires_at !== 'string'
      || !Number.isFinite(Date.parse(annotation.claim.expires_at))
      || typeof annotation.claim.refreshed_at !== 'string'
      || !Number.isFinite(Date.parse(annotation.claim.refreshed_at))
    ) {
      throw new LifecycleError('invalid_claim', 'Claimed Annotation must have a valid Claim');
    }
    requireOwner(annotation.claim.owner);
    if (Date.parse(annotation.claim.expires_at) <= nowMs) {
      return { ...withoutClaim(structuredClone(annotation)), status: 'pending', updated_at: new Date(nowMs).toISOString() };
    }
    return structuredClone(annotation);
  }
}
