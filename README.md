# Trash Bin — Super Productivity plugin

A best-effort recovery archive for deleted tasks in Super Productivity.

## Features

- Captures snapshots of tasks observed by the plugin before deletion.
- Lists deletion time and whether a task snapshot is available.
- Lets you restore a captured task as a **new task**, remove individual archive entries, or empty the plugin archive.
- Stores the archive using Super Productivity's synced plugin-data API.

## Limitations

The public `taskDelete` hook supplies a task ID rather than a complete task object. The plugin therefore caches task snapshots from task creation/update events and app state reads. If a deletion occurs before a task snapshot was captured, the plugin cannot reconstruct it.

This version does not provide full recovery for projects, tags, saved filters, recurrence configuration, timer history, original IDs, or every task relationship. A restored task is created as a new task. Use Super Productivity's built-in export/backup for durable backups, and test this plugin with sample data first.

## Install

1. Download `plugin.zip` from the Releases page (or use the local ZIP while testing).
2. In Super Productivity, open **Settings → Plugins → Choose Plugin File** and select the ZIP.
3. Enable the plugin and open its manifest-provided plugin/side-panel entry.

## Build the install ZIP

Place `manifest.json`, `plugin.js`, `index.html`, and `icon.svg` at the root of `plugin.zip`. Do not zip the containing directory.

## Community listing

The Super Productivity community listing requires an entry in `src/assets/community-plugins.json` in the upstream repository. See the [plugin development guide](https://github.com/super-productivity/super-productivity/blob/master/docs/plugin-development.md#get-listed-in-the-app).

## License

MIT
