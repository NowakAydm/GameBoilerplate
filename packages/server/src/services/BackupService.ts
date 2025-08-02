import fs from 'fs/promises';
import path from 'path';
import { UserModel } from '../models/User';
import { addSystemLog } from '../routes/admin';

export interface BackupMetadata {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  type: 'manual' | 'scheduled';
  status: 'completed' | 'failed' | 'in_progress';
  description?: string;
}

export interface BackupData {
  users: any[];
  metadata: {
    backupDate: string;
    gameVersion: string;
    totalUsers: number;
    totalGameData: number;
  };
}

class BackupService {
  private backupDir: string;
  private maxBackups: number = 30; // Keep last 30 backups

  constructor() {
    // Create backups directory in the server package
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      addSystemLog('info', 'system', 'Backup directory created', undefined, { directory: this.backupDir });
    }
  }

  /**
   * Create a backup of all game data
   */
  async createBackup(type: 'manual' | 'scheduled' = 'manual', description?: string): Promise<BackupMetadata> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${backupId}.json`;
    const filePath = path.join(this.backupDir, filename);

    try {
      addSystemLog('info', 'system', `Starting ${type} backup`, undefined, { backupId });

      // Collect all game data
      const users = await UserModel.find({}).lean();
      
      const backupData: BackupData = {
        users,
        metadata: {
          backupDate: new Date().toISOString(),
          gameVersion: '1.0.0', // You can get this from package.json
          totalUsers: users.length,
          totalGameData: users.reduce((sum, user) => sum + (user.totalPlaytime || 0), 0),
        },
      };

      // Write backup to file
      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');

      // Get file size
      const stats = await fs.stat(filePath);

      const metadata: BackupMetadata = {
        id: backupId,
        filename,
        createdAt: new Date().toISOString(),
        size: stats.size,
        type,
        status: 'completed',
        description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} backup`,
      };

      addSystemLog('info', 'system', `Backup completed successfully`, undefined, {
        backupId,
        filename,
        size: stats.size,
        userCount: users.length,
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return metadata;
    } catch (error) {
      addSystemLog('error', 'system', `Backup failed: ${error}`, undefined, { backupId, error });
      
      const metadata: BackupMetadata = {
        id: backupId,
        filename,
        createdAt: new Date().toISOString(),
        size: 0,
        type,
        status: 'failed',
        description: description || `Failed ${type} backup`,
      };

      return metadata;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json') && file.startsWith('backup_'));

      const backups: BackupMetadata[] = [];

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        // Extract backup ID from filename
        const backupId = file.replace('.json', '');
        const createdAt = new Date(stats.mtime).toISOString();

        // Determine if it was a scheduled backup (every day at midnight) or manual
        const hour = new Date(stats.mtime).getHours();
        const type = hour === 0 ? 'scheduled' : 'manual';

        backups.push({
          id: backupId,
          filename: file,
          createdAt,
          size: stats.size,
          type,
          status: 'completed',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} backup`,
        });
      }

      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      addSystemLog('error', 'system', `Failed to list backups: ${error}`);
      return [];
    }
  }

  /**
   * Load backup data from file
   */
  async loadBackup(backupId: string): Promise<BackupData | null> {
    try {
      const filename = `${backupId}.json`;
      const filePath = path.join(this.backupDir, filename);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      const backupData: BackupData = JSON.parse(fileContent);

      addSystemLog('info', 'system', `Backup data loaded`, undefined, { backupId, userCount: backupData.users.length });

      return backupData;
    } catch (error) {
      addSystemLog('error', 'system', `Failed to load backup: ${error}`, undefined, { backupId });
      return null;
    }
  }

  /**
   * Restore data from backup (THIS IS DANGEROUS - USE WITH CAUTION)
   */
  async restoreFromBackup(backupId: string): Promise<{ success: boolean; message: string; restored: number }> {
    try {
      const backupData = await this.loadBackup(backupId);
      if (!backupData) {
        return { success: false, message: 'Backup not found', restored: 0 };
      }

      addSystemLog('warn', 'system', `Starting restore operation`, undefined, { backupId });

      // Create a backup of current state before restoring
      await this.createBackup('manual', 'Pre-restore backup');

      // Clear existing data (DANGEROUS!)
      await UserModel.deleteMany({});

      // Restore users
      let restored = 0;
      for (const userData of backupData.users) {
        try {
          // Remove _id field to avoid conflicts
          const { _id, ...userDataWithoutId } = userData;
          const user = new UserModel(userDataWithoutId);
          await user.save();
          restored++;
        } catch (userError) {
          addSystemLog('warn', 'system', `Failed to restore user`, undefined, { 
            userId: userData.userId, 
            error: userError 
          });
        }
      }

      addSystemLog('info', 'system', `Restore completed`, undefined, { 
        backupId, 
        totalUsers: backupData.users.length,
        restoredUsers: restored,
      });

      return { 
        success: true, 
        message: `Successfully restored ${restored} of ${backupData.users.length} users`,
        restored 
      };
    } catch (error) {
      addSystemLog('error', 'system', `Restore failed: ${error}`, undefined, { backupId });
      return { success: false, message: `Restore failed: ${error}`, restored: 0 };
    }
  }

  /**
   * Delete a backup file
   */
  async deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    try {
      const filename = `${backupId}.json`;
      const filePath = path.join(this.backupDir, filename);
      
      await fs.unlink(filePath);

      addSystemLog('info', 'system', `Backup deleted`, undefined, { backupId, filename });

      return { success: true, message: 'Backup deleted successfully' };
    } catch (error) {
      addSystemLog('error', 'system', `Failed to delete backup: ${error}`, undefined, { backupId });
      return { success: false, message: `Failed to delete backup: ${error}` };
    }
  }

  /**
   * Clean up old backups (keep only maxBackups)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }

        addSystemLog('info', 'system', `Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      addSystemLog('error', 'system', `Failed to cleanup old backups: ${error}`);
    }
  }

  /**
   * Schedule daily backups (call this during server startup)
   */
  startDailyBackupSchedule(): void {
    // Schedule backup every day at 2 AM
    const schedule = () => {
      const now = new Date();
      const next = new Date();
      next.setDate(now.getDate() + 1);
      next.setHours(2, 0, 0, 0); // 2 AM

      const msUntilNext = next.getTime() - now.getTime();

      setTimeout(async () => {
        await this.createBackup('scheduled', 'Daily scheduled backup');
        schedule(); // Schedule next backup
      }, msUntilNext);
    };

    schedule();
    addSystemLog('info', 'system', 'Daily backup schedule started (2 AM)');
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    scheduledBackups: number;
    manualBackups: number;
  }> {
    const backups = await this.listBackups();
    
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const scheduledBackups = backups.filter(b => b.type === 'scheduled').length;
    const manualBackups = backups.filter(b => b.type === 'manual').length;

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
      newestBackup: backups.length > 0 ? backups[0].createdAt : null,
      scheduledBackups,
      manualBackups,
    };
  }
}

export const backupService = new BackupService();