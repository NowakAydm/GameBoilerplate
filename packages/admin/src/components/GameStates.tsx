import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Refresh,
  CleaningServices,
  PersonRemove,
  Edit,
  Visibility,
} from '@mui/icons-material';
import { useAdminStore } from '../stores/adminStore';

interface GameStateModalProps {
  open: boolean;
  onClose: () => void;
  gameState: any;
  onSave: (userId: string, newState: any) => void;
}

const GameStateModal: React.FC<GameStateModalProps> = ({ open, onClose, gameState, onSave }) => {
  const [editedState, setEditedState] = useState('');

  useEffect(() => {
    if (gameState) {
      setEditedState(JSON.stringify(gameState, null, 2));
    }
  }, [gameState]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedState);
      onSave(gameState.userId, parsed);
      onClose();
    } catch (error) {
      // Handle JSON parse error
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Game State - {gameState?.userId}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={20}
          value={editedState}
          onChange={(e) => setEditedState(e.target.value)}
          variant="outlined"
          sx={{ mt: 1, fontFamily: 'monospace' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const GameStates: React.FC = () => {
  const { gameStates, fetchGameStates, cleanupGameStates, kickUser, error } = useAdminStore();
  const [selectedState, setSelectedState] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchGameStates();
    const interval = setInterval(fetchGameStates, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchGameStates]);

  const handleEditState = (gameState: any) => {
    setSelectedState(gameState);
    setModalOpen(true);
  };

  const handleSaveState = async (userId: string, newState: any) => {
    // TODO: Implement API call to update game state
    console.log('Save state for user:', userId, newState);
    fetchGameStates(); // Refresh after save
  };

  const handleKickUser = async (userId: string) => {
    if (window.confirm(`Are you sure you want to kick user ${userId}?`)) {
      await kickUser(userId);
    }
  };

  const formatPosition = (position: { x: number; y: number; z: number }) => {
    return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`;
  };

  const getTimeSinceLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Game States
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh Game States">
            <IconButton onClick={fetchGameStates} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cleanup Inactive States">
            <IconButton onClick={cleanupGameStates} color="warning">
              <CleaningServices />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Last Action</TableCell>
                <TableCell>Last Seen</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gameStates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No active game states found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                gameStates.map((gameState) => (
                  <TableRow key={gameState.userId}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {gameState.userId.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{formatPosition(gameState.position)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={gameState.lastAction} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getTimeSinceLastSeen(gameState.lastSeen)}</TableCell>
                    <TableCell>
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditState(gameState)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit State">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditState(gameState)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Kick User">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleKickUser(gameState.userId)}
                        >
                          <PersonRemove />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <GameStateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        gameState={selectedState}
        onSave={handleSaveState}
      />
    </Box>
  );
};
