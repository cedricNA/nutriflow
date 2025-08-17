#!/bin/bash
# Log tool usage for debugging and tracking
mkdir -p .claude/logs
timestamp=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$timestamp] Tool used: $*" >> .claude/logs/tool-usage.log
tail -n 1000 .claude/logs/tool-usage.log > .claude/logs/tool-usage.tmp
mv .claude/logs/tool-usage.tmp .claude/logs/tool-usage.log