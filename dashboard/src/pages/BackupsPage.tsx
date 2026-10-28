import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  MdIconButton,
  MdLoading,
  MdIcon,
  MdDialog,
  ConfirmDialog,
  PageHeader,
  NoticeBanner,
  SurfaceCard,
  SwitchRow,
  EmptyState,
} from '../components/ui';
import { BackupItem } from '../types/api';
import { useServerSwitch } from '../components/layout';

export const BackupsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();
  const [actionNotice, setActionNotice] = useState('');

  // Take Snapshot Modal
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Restore Modal
  const [restoreBackup, setRestoreBackup] = useState<BackupItem | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Import Modal
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  // Delete Confirm
  const [deleteBackup, setDeleteBackup] = useState<BackupItem | null>(null);

  const fetchBackups = () => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/backups`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.backups) setBackups(data.backups);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchBackups();
  }, [guildId]);

  const handleTakeSnapshot = async () => {
    setSnapshotLoading(true);
    setActionNotice('');
    try {
      const res = await fetch(`/api/guilds/${guildId}/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: snapshotName }),
      });
      const data = await res.json();
      if (data.success) {
        setSnapshotOpen(false);
        setSnapshotName('');
        setActionNotice(data.message);
        fetchBackups();
      } else {
        alert(data.error || 'Failed to create backup');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreBackup) return;
    setRestoreLoading(true);
    setActionNotice('');
    try {
      const res = await fetch(`/api/guilds/${guildId}/backups/${restoreBackup.slug}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ replace: replaceMode }),
      });
      const data = await res.json();
      if (data.success) {
        setRestoreBackup(null);
        setActionNotice(data.message);
      } else {
        alert(data.error || 'Failed to restore backup');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const res = await fetch(`/api/guilds/${guildId}/backups/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (data.success) {
        setImportOpen(false);
        setImportJson('');
        setActionNotice('Backup imported successfully!');
        fetchBackups();
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (err: any) {
      alert(`Invalid JSON format: ${err.message}`);
    }
  };

  const handleDownload = (b: BackupItem) => {
    const jsonStr = JSON.stringify(
      {
        label: b.label,
        spec: b.spec,
        roles: b.roles,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.slug}-archibot-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteBackup) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/backups/${deleteBackup.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteBackup(null);
        fetchBackups();
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && backups.length === 0) return <MdLoading />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="BACKUPS & MILESTONES"
        title="Server Layout Backups"
        description="Snapshot your channels, categories, and roles. Fully synchronized with /backup on Discord."
        actions={
          <>
            <MdButton variant="tonal" icon="file_upload" onClick={() => setImportOpen(true)}>
              Import JSON
            </MdButton>
            <MdButton variant="filled" icon="add_a_photo" onClick={() => setSnapshotOpen(true)}>
              Take Snapshot Now
            </MdButton>
          </>
        }
      />

      {actionNotice && <NoticeBanner message={actionNotice} tone="success" />}

      <SurfaceCard>
        <h3 className="text-xs font-normal text-discord-white mb-4">Saved Snapshots ({backups.length})</h3>

        {backups.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            description={
              <>
                No saved layouts yet. Click &ldquo;Take Snapshot Now&rdquo; or run{' '}
                <code className="text-discord-text bg-discord-surface px-1.5 py-0.5 rounded text-xs">/backup save</code> on
                Discord.
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backups.map((b) => (
              <div
                key={b.slug}
                className="flex flex-col justify-between p-4 rounded-lg bg-discord-surface border border-discord-border gap-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="text-xs font-normal text-discord-white">{b.label}</div>
                    <MdIconButton icon="delete" onClick={() => setDeleteBackup(b)} title="Delete snapshot" />
                  </div>
                  <div className="text-xs text-discord-muted font-normal mt-0.5">
                    Saved: {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : 'N/A'}
                  </div>

                  <div className="flex items-center gap-3.5 mt-2.5 text-xs font-normal text-discord-text">
                    <span className="flex items-center gap-1.5">
                      <MdIcon name="tag" className="text-base text-discord-muted" />
                      {b.channelCount} Channels
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MdIcon name="shield_person" className="text-base text-discord-muted" />
                      {b.rolesCount} Roles
                    </span>
                  </div>

                  <div className="mt-2.5 p-2.5 rounded-md bg-discord-canvas border border-discord-border text-xs font-mono max-h-24 overflow-y-auto whitespace-pre-wrap text-discord-muted">
                    {b.specPreview}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-discord-border">
                  <MdButton variant="filled" icon="restore" onClick={() => setRestoreBackup(b)} className="flex-1">
                    Restore Layout
                  </MdButton>
                  <MdIconButton icon="download" onClick={() => handleDownload(b)} title="Download JSON File" />
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      {/* Snapshot Modal */}
      <MdDialog
        open={snapshotOpen}
        onClose={() => setSnapshotOpen(false)}
        headline="Create Server Snapshot"
        actions={
          <>
            <MdButton variant="text" onClick={() => setSnapshotOpen(false)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleTakeSnapshot} disabled={snapshotLoading}>
              {snapshotLoading ? 'Saving...' : 'Save Snapshot'}
            </MdButton>
          </>
        }
      >
        <p className="text-xs text-discord-muted">
          This will serialize all current categories, channels, permissions, and roles into a reusable layout backup.
        </p>
        <MdTextField
          label="Snapshot Name"
          value={snapshotName}
          onChange={setSnapshotName}
          placeholder="e.g. Pre-Tournament Setup"
        />
      </MdDialog>

      {/* Restore Modal */}
      <MdDialog
        open={Boolean(restoreBackup)}
        onClose={() => setRestoreBackup(null)}
        headline={`Restore "${restoreBackup?.label}"`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setRestoreBackup(null)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleRestore} disabled={restoreLoading}>
              {restoreLoading ? 'Restoring...' : 'Restore Layout'}
            </MdButton>
          </>
        }
      >
        <p className="text-xs text-discord-muted">
          Choose how ArchiBot should apply the saved channels to this server:
        </p>
        <SwitchRow
          label={replaceMode ? 'Replace Mode (Delete Old Channels)' : 'Merge Mode (Keep Existing)'}
          description={replaceMode ? 'Wipes existing channels first' : 'Creates missing channels and preserves current ones'}
          checked={replaceMode}
          onChange={setReplaceMode}
          danger={replaceMode}
          className="py-3"
        />
      </MdDialog>

      {/* Import Modal */}
      <MdDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        headline="Import Backup JSON"
        actions={
          <>
            <MdButton variant="text" onClick={() => setImportOpen(false)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleImport} disabled={!importJson.trim()}>
              Import Backup
            </MdButton>
          </>
        }
      >
        <p className="text-xs text-discord-muted">
          Paste the contents of an exported ArchiBot backup JSON file below:
        </p>
        <MdTextField
          label="JSON Content"
          value={importJson}
          onChange={setImportJson}
          type="textarea"
          rows={6}
          placeholder='{"label": "...", "spec": "...", "roles": []}'
        />
      </MdDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteBackup)}
        title="Delete Saved Snapshot"
        message={`Are you sure you want to delete "${deleteBackup?.label}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteBackup(null)}
      />
    </div>
  );
};
