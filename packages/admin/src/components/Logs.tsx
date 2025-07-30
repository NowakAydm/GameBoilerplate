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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh,
  ExpandMore,
  FilterList,
} from '@mui/icons-material';
import { useAdminStore } from '../stores/adminStore';

const LogLevelChip: React.FC<{ level: string }> = ({ level }) => {
  const getColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Chip 
      label={level.toUpperCase()} 
      color={getColor(level) as any} 
      size="small"
      variant="filled"
    />
  );
};

const LogTypeChip: React.FC<{ type: string }> = ({ type }) => {
  const getColor = (type: string) => {
    switch (type) {
      case 'socket': return 'primary';
      case 'game': return 'secondary';
      case 'auth': return 'success';
      case 'system': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Chip 
      label={type} 
      color={getColor(type) as any} 
      size="small"
      variant="outlined"
    />
  );
};

export const Logs: React.FC = () => {
  const {
    logs,
    fetchLogs,
    logFilter,
    logType,
    currentPage,
    logsPerPage,
    setLogFilter,
    setLogType,
    setCurrentPage,
    error,
  } = useAdminStore();

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLogs, logType, currentPage]);

  const handleFilterChange = (value: string) => {
    setLogFilter(value);
  };

  const handleTypeChange = (value: string) => {
    setLogType(value);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const filteredLogs = logs.filter(log => 
    logFilter === '' || 
    log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
    log.userId?.includes(logFilter)
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatData = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          System Logs
        </Typography>
        <Tooltip title="Refresh Logs">
          <IconButton onClick={fetchLogs} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <FilterList color="action" />
          <TextField
            label="Filter logs..."
            variant="outlined"
            size="small"
            value={logFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            sx={{ minWidth: 250 }}
            placeholder="Search by message or user ID"
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={logType}
              label="Type"
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="socket">Socket</MenuItem>
              <MenuItem value="game">Game</MenuItem>
              <MenuItem value="auth">Auth</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {filteredLogs.length} log entries
          </Typography>
        </Box>
      </Paper>

      {/* Logs Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow hover>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <LogLevelChip level={log.level} />
                      </TableCell>
                      <TableCell>
                        <LogTypeChip type={log.type} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 400 }}>
                        <Typography 
                          variant="body2" 
                          noWrap
                          sx={{ 
                            cursor: log.data ? 'pointer' : 'default',
                            '&:hover': log.data ? { textDecoration: 'underline' } : {}
                          }}
                          onClick={() => {
                            if (log.data) {
                              setExpandedLog(expandedLog === log.id ? null : log.id);
                            }
                          }}
                        >
                          {log.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.userId && (
                          <Typography variant="body2" fontFamily="monospace">
                            {log.userId.slice(0, 8)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.data && (
                          <IconButton
                            size="small"
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          >
                            <ExpandMore 
                              sx={{ 
                                transform: expandedLog === log.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedLog === log.id && log.data && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Accordion expanded={true} elevation={0}>
                            <AccordionSummary sx={{ minHeight: 'auto', '& .MuiAccordionSummary-content': { margin: 0 } }}>
                              <Typography variant="body2" fontWeight="bold">
                                Additional Data:
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                              <Box
                                component="pre"
                                sx={{
                                  fontSize: '0.75rem',
                                  fontFamily: 'monospace',
                                  bgcolor: 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: 200,
                                }}
                              >
                                {formatData(log.data)}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={Math.ceil(filteredLogs.length / logsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
