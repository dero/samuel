#!/usr/bin/env bash
set -euo pipefail

# Determine repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

ENV_FILE="${ROOT_DIR}/.env"
SKIP_BUILD=0
DRY_RUN=0

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -s, --skip-build   Skip project build (use existing dist/)"
    echo "  -n, --dry-run      Perform a dry run with rsync without making changes"
    echo "  -h, --help         Show this help message"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--skip-build)
            SKIP_BUILD=1
            shift
            ;;
        -n|--dry-run)
            DRY_RUN=1
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            ;;
    esac
done

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Error: .env file not found at ${ENV_FILE}" >&2
    exit 1
fi

# Load variables from .env
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

# Validate required variables
missing_vars=()
[[ -z "${DEPLOYMENT_IP:-}" ]] && missing_vars+=("DEPLOYMENT_IP")
[[ -z "${DEPLOYMENT_USER:-}" ]] && missing_vars+=("DEPLOYMENT_USER")
[[ -z "${DEPLOYMENT_PATH:-}" ]] && missing_vars+=("DEPLOYMENT_PATH")

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "Error: Missing required environment variables in .env: ${missing_vars[*]}" >&2
    exit 1
fi

# Step 1: Build project (unless skipped)
if [[ "${SKIP_BUILD}" -eq 1 ]]; then
    echo "==> Skipping build as requested..."
else
    echo "==> Building project (yarn build)..."
    yarn build
fi

# Step 2: Verify dist directory
if [[ ! -d "${ROOT_DIR}/dist" ]] || [[ ! -f "${ROOT_DIR}/dist/index.html" ]]; then
    echo "Error: dist/ directory or dist/index.html not found. Run 'yarn build' first." >&2
    exit 1
fi

# Step 3: Deploy via rsync over SSH
echo "==> Deploying dist/ to ${DEPLOYMENT_USER}@${DEPLOYMENT_IP}:${DEPLOYMENT_PATH}..."

RSYNC_OPTS=(-avz --delete --chmod=D755,F644)
if [[ "${DRY_RUN}" -eq 1 ]]; then
    RSYNC_OPTS+=(--dry-run)
    echo "    (Dry-run mode enabled)"
fi

# Ensure remote destination directory exists
ssh -o BatchMode=yes "${DEPLOYMENT_USER}@${DEPLOYMENT_IP}" "mkdir -p '${DEPLOYMENT_PATH}'"

# Sync files
rsync "${RSYNC_OPTS[@]}" "${ROOT_DIR}/dist/" "${DEPLOYMENT_USER}@${DEPLOYMENT_IP}:${DEPLOYMENT_PATH}/"

echo "==> Deployment completed successfully!"
echo "    Site URL: https://samuel.dero.cz"
