---
name: new-release
description: >
  Prepare a repository release from its existing versioning, changelog,
  package-manager, Git, and publishing conventions. Use when cutting, tagging,
  or publishing a patch, minor, major, or project-defined release.
---

# New Release

Release the repository through its own contract. Treat the repository as the
source of truth; this skill supplies the sequence and safety gates, not a fixed
branch, package manager, changelog format, tag prefix, or registry.

## 1. Discover The Release Contract

Inspect every release-defining source that exists:

- repository instructions and release documentation;
- manifests, workspace files, and lockfiles;
- changelog structure and prior release entries;
- package scripts, task runners, and release configuration;
- release workflows and registry configuration;
- current branch, remote, and recent version tags.

Before editing, identify all of these or mark them inapplicable:

- authoritative version source and every synchronized copy;
- next version and how the project computes it;
- release branch and required worktree state;
- unreleased changelog section and release heading format;
- version-update command or established release tool;
- validation required before delivery;
- commit, tag, push, publish, and hosted-release order.

Follow established automation when it covers the contract. If sources disagree
or a consequential choice remains unknown, stop and resolve it with the user.

Completion criterion: the release contract and intended version are explicit,
with no unresolved source conflict.

## 2. Prepare The Release

1. Confirm the checkout satisfies the discovered branch and worktree policy.
2. Confirm the unreleased notes describe the exact changes being released. Use
   the `update-changelog` skill when entries need revision.
3. Convert the unreleased section into the repository's release format and
   recreate its expected empty placeholder, when that is the local convention.
4. Update every authoritative or synchronized version file through the
   project's package manager or release tool. Preserve lockfile consistency.
5. Inspect the complete diff for accidental files, stale versions, duplicate
   changelog entries, and incorrect dates or comparison links.

Completion criterion: the working tree contains only the intended release
preparation and every version representation agrees.

## 3. Prove The Candidate

Run the repository's required checks and the narrowest available release dry
run or package inspection. At minimum, verify:

- version output and package metadata report the intended version;
- changelog headings, links, and ordering match prior releases;
- tests, typecheck, build, and lint required by the project pass;
- produced artifacts contain the expected files and exclude local-only data;
- the intended tag does not already exist locally or remotely;
- the release diff contains no credentials or unrelated changes.

Record environmental failures separately from product failures. Never weaken a
release check merely to make the candidate pass.

Completion criterion: every required check is green, or each remaining failure
is reported as a blocker with its exact command and evidence.

## 4. Delivery Checkpoint

Before any push, registry publication, hosted release, or other remote mutation,
show the user:

- release version and target branch;
- files changed;
- checks run and their outcomes;
- exact commit, tag, push, publish, and release actions still pending;
- any irreversible or difficult-to-recover effect.

Obtain explicit approval for the remote delivery actions. Approval to prepare a
release is not approval to publish it.

## 5. Deliver And Verify

Execute only the approved actions, in the repository's established order. Avoid
inventing a manual path when project automation exists.

After delivery, verify each state independently:

- release commit is on the intended remote branch;
- tag resolves to the intended commit;
- registry or artifact host exposes the intended version;
- hosted release and CI workflows completed successfully;
- installation or the documented smoke path works from the published artifact.

If delivery fails midway, inspect the actual commit, tag, remote, registry, and
workflow state before retrying. Report precisely which states completed and
which remain pending; never recreate an existing tag or republish blindly.
