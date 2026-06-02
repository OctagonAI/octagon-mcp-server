#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CLAUDE_PLUGIN_OPTION_api_key:-}" ]; then
  echo "Octagon plugin is enabled without an API key. Open /plugin to configure api_key before using Octagon tools."
fi
