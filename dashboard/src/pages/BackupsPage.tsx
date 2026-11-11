import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Badge,
  MdButton,
  MdIcon,
  MdIconButton,
  MdTextField,
} from '../components/atoms';
import {
  BackupsSkeleton,
  ConfirmDialog,
  EmptyState,
  MdDialog,
  PageHeader,
  SurfaceCard,
  SwitchRow,
  toast,
} from '../components/molecules';
import {
  ChannelTreePreview,
  parseTemplatePreview,
} from '../components/organisms';
import { useServerSwitch } from '../components/templates';
import { BackupItem } from '../types/api';

export const BackupsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();

  // Take Snapshot Modal
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Preview Structure Modal (Matches Template Builder Structure Preview Modal)
  const [previewBackup, setPreviewBackup] = useState<BackupItem | null>(null);

  // Restore Modal
  const [restoreBackup, setRestoreBackup] = useState<BackupItem | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Import Modal
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // Delete Confirm
  const [deleteBackup, setDeleteBackup] = useState<BackupItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const previewCategoryCount = useMemo(() => {
    if (!previewBackup) return 0;
    return parseTemplatePreview(previewBackup.spec || previewBackup.specPreview).filter((g) =>
      Boolean(g.category)
    ).length;
  }, [previewBackup]);

  const handleTakeSnapshot = async () => {
    setSnapshotLoading(true);
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
        toast.success(data.message || 'Backup snapshot created successfully!');
        fetchBackups();
      } else {
        toast.error(data.error || 'Failed to create backup');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreBackup) return;
    setRestoreLoading(true);
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
        toast.success(data.message || 'Backup restored successfully!');
      } else {
        toast.error(data.error || 'Failed to restore backup');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleImport = async () => {
    setImportLoading(true);
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
        toast.success('Backup imported successfully!');
        fetchBackups();
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (err: any) {
      toast.error(`Invalid JSON format: ${err.message}`);
    } finally {
      setImportLoading(false);
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
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/backups/${deleteBackup.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteBackup(null);
        toast.success('Snapshot deleted successfully.');
        fetchBackups();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && backups.length === 0) return <BackupsSkeleton />;

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        category="CHANNELS & TEMPLATES"
        title="Saved Templates & Layout Backups"
        description="Save your server's channels, categories, and roles as reusable templates, or import and restore custom JSON layouts."
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

      {backups.length === 0 ? (
        <SurfaceCard
          title="Saved Snapshots (0)"
          subtitle="Create a snapshot or import an exported JSON layout to reuse server structures anytime."
        >
          <EmptyState
            icon="inventory_2"
            title="No saved templates or backups yet"
            description={
              <>
                Click &ldquo;Take Snapshot Now&rdquo; above or run{' '}
                <code className="text-discord-text bg-discord-surface px-1.5 py-0.5 rounded text-xs">
                  /backup save
                </code>{' '}
                on Discord.
              </>
            }
            action={
              <MdButton variant="filled" icon="add_a_photo" onClick={() => setSnapshotOpen(true)}>
                Take Snapshot Now
              </MdButton>
            }
          />
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {backups.map((b) => {
            const specText = b.spec || b.specPreview;
            const categoryCount = parseTemplatePreview(specText).filter((g) =>
              Boolean(g.category)
            ).length;

            return (
              <SurfaceCard
                key={b.slug}
                className="flex flex-col justify-between gap-4 h-full transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--md-elevation-card-hover)]"
              >
                <div className="flex flex-col gap-3.5 min-w-0">
                  {/* Card Header (Matches Template Builder card style) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-discord-blurple text-white flex items-center justify-center shrink-0 shadow-xs">
                        <MdIcon name="inventory_2" className="text-xl" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-normal text-discord-white truncate leading-tight">
                          {b.label}
                        </div>
                        <div className="text-xs font-normal text-discord-muted mt-0.5 truncate">
                          {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : 'Saved layout'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-1">
                      <MdIconButton
                        icon="download"
                        onClick={() => handleDownload(b)}
                        title="Download JSON File"
                      />
                      <MdIconButton
                        icon="delete"
                        onClick={() => setDeleteBackup(b)}
                        title="Delete snapshot"
                        className="text-discord-muted hover:text-discord-red"
                      />
                    </div>
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge label={`${categoryCount} Categories`} tone="blurple" />
                    <Badge label={`${b.channelCount} Channels`} tone="green" />
                    <Badge label={`${b.rolesCount} Roles`} tone="neutral" />
                  </div>

                  {/* Embedded Template Builder Channel Tree Preview */}
                  {specText ? (
                    <ChannelTreePreview spec={specText} maxHeightClass="h-44 max-h-44" />
                  ) : (
                    <div className="p-3 rounded-xl bg-discord-surface h-44 flex items-center justify-center text-xs font-normal text-discord-muted">
                      No channels in this snapshot
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3.5 border-t border-discord-border flex items-center gap-2">
                  <MdButton
                    variant="filled"
                    icon="restore"
                    onClick={() => setRestoreBackup(b)}
                    className="flex-1"
                  >
                    Restore Layout
                  </MdButton>
                  {specText && (
                    <MdButton
                      variant="tonal"
                      icon="visibility"
                      onClick={() => setPreviewBackup(b)}
                    >
                      Preview
                    </MdButton>
                  )}
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {/* Template Structure Preview Modal (Matches ArchitectPage Structure Preview Modal) */}
      <MdDialog
        open={Boolean(previewBackup)}
        onClose={() => setPreviewBackup(null)}
        headline={previewBackup ? `${previewBackup.label} Structure` : 'Template Structure'}
        actions={
          <>
            <MdButton variant="text" onClick={() => setPreviewBackup(null)}>
              Close
            </MdButton>
            {previewBackup && (
              <MdButton
                variant="filled"
                icon="restore"
                onClick={() => {
                  const target = previewBackup;
                  setPreviewBackup(null);
                  setRestoreBackup(target);
                }}
              >
                Restore Layout
              </MdButton>
            )}
          </>
        }
      >
        {previewBackup && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-discord-muted font-normal">
              <span>{previewCategoryCount} categories</span>
              <span>•</span>
              <span>{previewBackup.channelCount} channels</span>
              <span>•</span>
              <span>{previewBackup.rolesCount} roles</span>
            </div>
            <ChannelTreePreview
              spec={previewBackup.spec || previewBackup.specPreview}
              maxHeightClass="min-h-[360px] max-h-[58vh]"
            />
          </div>
        )}
      </MdDialog>

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
        <p className="text-xs text-discord-muted font-normal leading-relaxed">
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
        <p className="text-xs text-discord-muted font-normal leading-relaxed">
          Choose how ArchiBot should apply the saved channels to this server:
        </p>
        <SwitchRow
          boxed
          label={replaceMode ? 'Replace Mode (Delete Old Channels)' : 'Merge Mode (Keep Existing)'}
          description={
            replaceMode
              ? 'Wipes existing channels first'
              : 'Creates missing channels and preserves current ones'
          }
          checked={replaceMode}
          onChange={setReplaceMode}
          danger={replaceMode}
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
            <MdButton
              variant="filled"
              onClick={handleImport}
              disabled={importLoading || !importJson.trim()}
            >
              {importLoading ? 'Importing...' : 'Import Backup'}
            </MdButton>
          </>
        }
      >
        <p className="text-xs text-discord-muted font-normal leading-relaxed">
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
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteBackup(null)}
      />
    </div>
  );
};
