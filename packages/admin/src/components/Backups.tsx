import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Backup,
  CloudDownload,
  Delete,
  Restore,
  Schedule,
  ManualRecord,
  Warning,
  Refresh,
  Add,
  GetApp,
  Storage,
} from '@mui/icons-material';
import { useAdminStore } from '../stores/adminStore';

interface BackupMetadata {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  type: 'manual' | 'scheduled';
  status: 'completed' | 'failed' | 'in_progress';
  description?: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup: string | null;
  newestBackup: string | null;
  scheduledBackups: number;
  manualBackups: number;
}

export const Backups: React.FC = () => {
  const { error, clearError } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [operationInProgress, setOperationInProgress] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:3000/admin/backups', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCreateBackup = async () => {
    setOperationInProgress(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:3000/admin/backups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: backupDescription }),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        setBackupDescription('');
        await fetchBackups();
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (restoreConfirmation !== 'RESTORE_DATA_CONFIRMED' || !selectedBackup) {
      return;
    }

    setOperationInProgress(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:3000/admin/backups/${selectedBackup.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmation: 'RESTORE_DATA_CONFIRMED' }),
      });

      if (response.ok) {
        setRestoreDialogOpen(false);
        setRestoreConfirmation('');
        setSelectedBackup(null);
        await fetchBackups();
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    setOperationInProgress(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:3000/admin/backups/${selectedBackup.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setSelectedBackup(null);
        await fetchBackups();
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
    } finally {
      setOperationInProgress(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && backups.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Backup Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={operationInProgress}
          >
            Create Backup
          </Button>
          <Tooltip title="Refresh Backups">
            <IconButton onClick={fetchBackups} color="primary" disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {operationInProgress && (
        <LinearProgress sx={{ mb: 3 }} />
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Total Backups
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalBackups}
                    </Typography>
                  </Box>
                  <Storage color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Total Size
                    </Typography>
                    <Typography variant="h4">
                      {formatFileSize(stats.totalSize)}
                    </Typography>
                  </Box>
                  <CloudDownload color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Scheduled
                    </Typography>
                    <Typography variant="h4">
                      {stats.scheduledBackups}
                    </Typography>
                  </Box>
                  <Schedule color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Manual
                    </Typography>
                    <Typography variant="h4">
                      {stats.manualBackups}
                    </Typography>
                  </Box>
                  <ManualRecord color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Backup List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Backups
          </Typography>
          
          {backups.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No backups available. Create your first backup to get started.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Backup ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {backup.id.substring(0, 20)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={backup.type === 'scheduled' ? <Schedule /> : <ManualRecord />}
                          label={backup.type}
                          color={backup.type === 'scheduled' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(backup.createdAt)}</TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell>
                        <Chip
                          label={backup.status}
                          color={backup.status === 'completed' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{backup.description}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Restore Backup">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setRestoreDialogOpen(true);
                              }}
                              disabled={backup.status !== 'completed'}
                            >
                              <Restore />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Backup">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Backup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description (optional)"
            fullWidth
            variant="outlined"
            value={backupDescription}
            onChange={(e) => setBackupDescription(e.target.value)}
            helperText="Describe what this backup contains or why it was created"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBackup}
            variant="contained"
            disabled={operationInProgress}
            startIcon={<Backup />}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Warning color="error" />
            Restore from Backup
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>WARNING:</strong> This will overwrite ALL current game data! A pre-restore backup will be created automatically.
          </Alert>
          
          {selectedBackup && (
            <Box mb={2}>
              <Typography variant="body2"><strong>Backup ID:</strong> {selectedBackup.id}</Typography>
              <Typography variant="body2"><strong>Created:</strong> {formatDate(selectedBackup.createdAt)}</Typography>
              <Typography variant="body2"><strong>Size:</strong> {formatFileSize(selectedBackup.size)}</Typography>
            </Box>
          )}

          <TextField
            margin="dense"
            label="Type 'RESTORE_DATA_CONFIRMED' to confirm"
            fullWidth
            variant="outlined"
            value={restoreConfirmation}
            onChange={(e) => setRestoreConfirmation(e.target.value)}
            error={restoreConfirmation.length > 0 && restoreConfirmation !== 'RESTORE_DATA_CONFIRMED'}
            helperText="This action cannot be undone"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRestoreDialogOpen(false);
            setRestoreConfirmation('');
            setSelectedBackup(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleRestoreBackup}
            variant="contained"
            color="error"
            disabled={restoreConfirmation !== 'RESTORE_DATA_CONFIRMED' || operationInProgress}
            startIcon={<Restore />}
          >
            Restore Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Backup Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Backup</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this backup? This action cannot be undone.
          </Typography>
          {selectedBackup && (
            <Box mt={2}>
              <Typography variant="body2"><strong>Backup ID:</strong> {selectedBackup.id}</Typography>
              <Typography variant="body2"><strong>Created:</strong> {formatDate(selectedBackup.createdAt)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setSelectedBackup(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBackup}
            variant="contained"
            color="error"
            disabled={operationInProgress}
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};