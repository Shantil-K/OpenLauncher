#!/bin/sh
# Signs a published release so OpenLauncher's in-app updater will install it.
#
# The updater (src/js/update.js) only installs an .ipk whose signature checks out against the public key built into the
# app. The private key lives only on the maintainer's computer, never on GitHub or in the build, so someone who got into
# the GitHub account or the build could still not make TVs install their own .ipk.
#
# Before signing, this checks that the .ipk on the release was built by this repository's release workflow from that tag
# (GitHub's build provenance, made by the "Attest" step in .github/workflows/release.yml), so a file swapped onto the
# release by hand is never signed.
#
# Usage: scripts/sign-release.sh v2.1.0
# Key:   ~/.config/openlauncher/release-signing-key.pem (or $OPENLAUNCHER_SIGNING_KEY). Keep a backup somewhere offline:
#        without it no future release can be signed for the updater (people could still install by hand).
set -eu

TAG="${1:?usage: $0 vX.Y.Z}"
REPO=Shantil-K/OpenLauncher
WORKFLOW=.github/workflows/release.yml
KEY="${OPENLAUNCHER_SIGNING_KEY:-$HOME/.config/openlauncher/release-signing-key.pem}"
cd "$(dirname "$0")/.."

[ -f "$KEY" ] || { echo "No signing key at $KEY" >&2; exit 1; }
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT

echo "Downloading the .ipk of $TAG..."
gh release download "$TAG" --repo "$REPO" --pattern '*.ipk' --dir "$W"
set -- "$W"/*.ipk
[ $# -eq 1 ] && [ -f "$1" ] || { echo "Expected exactly one .ipk on $TAG" >&2; exit 1; }
IPK="$1"
NAME=$(basename "$IPK")
DIGEST=$(sha256sum "$IPK" | cut -d ' ' -f 1)
echo "$NAME  sha256:$DIGEST"

echo "Checking it was built by $WORKFLOW from $TAG..."
if gh attestation --help >/dev/null 2>&1; then
	gh attestation verify "$IPK" --repo "$REPO" --signer-workflow "$REPO/$WORKFLOW" --source-ref "refs/tags/$TAG"
else
	# older gh without "gh attestation": read the provenance from GitHub's API and check what it says
	gh api "repos/$REPO/attestations/sha256:$DIGEST" > "$W/attestations.json" || { echo "No build provenance for this file: not signing." >&2; exit 1; }
	python3 -I - "$W/attestations.json" "$REPO" "$WORKFLOW" "refs/tags/$TAG" "$DIGEST" <<'EOF'
import base64, json, sys
path, repo, workflow, ref, digest = sys.argv[1:]
data = json.load(open(path))
for att in data.get("attestations", []):
    env = att.get("bundle", {}).get("dsseEnvelope", {})
    try:
        stmt = json.loads(base64.b64decode(env.get("payload", "")))
    except Exception:
        continue
    subjects = [s.get("digest", {}).get("sha256") for s in stmt.get("subject", [])]
    wf = stmt.get("predicate", {}).get("buildDefinition", {}).get("externalParameters", {}).get("workflow", {})
    if digest in subjects and wf.get("repository", "").lower().endswith("/" + repo.lower()) and wf.get("path") == workflow and wf.get("ref") == ref:
        print("Built by %s from %s." % (workflow, ref))
        sys.exit(0)
sys.exit("The build provenance doesn't match %s from %s: not signing." % (workflow, ref))
EOF
fi

echo "Signing..."
openssl dgst -sha256 -sign "$KEY" -out "$IPK.sig" "$IPK"

# check it against the public key the app itself carries, so a wrong key is caught here and not on a TV
sed -n '/-----BEGIN PUBLIC KEY-----/,/-----END PUBLIC KEY-----/p' src/js/update.js | tr -d '\t",' > "$W/app-key.pem"
openssl dgst -sha256 -verify "$W/app-key.pem" -signature "$IPK.sig" "$IPK"

gh release upload "$TAG" "$IPK.sig" --repo "$REPO" --clobber
echo "Signed $TAG: TVs can now update to it from the app."
