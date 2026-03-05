const fs = require('fs');
const path = require('path');

class FileManager {
    constructor(config) {
        this.config = config;
        this.tempDir = path.join(__dirname, '../temp');
        this.assetsDir = path.join(__dirname, '../assets');
        this.logsDir = path.join(__dirname, '../logs');

        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            this.tempDir,
            this.assetsDir,
            this.logsDir,
            path.join(this.assetsDir, 'templates'),
            path.join(this.assetsDir, 'fonts'),
            path.join(this.assetsDir, 'images')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async saveFile(filename, content, directory = 'temp') {
        const dirPath = directory === 'temp' ? this.tempDir :
            directory === 'assets' ? this.assetsDir :
                directory === 'logs' ? this.logsDir :
                    directory;

        const fullPath = path.join(dirPath, filename);

        if (Buffer.isBuffer(content)) {
            fs.writeFileSync(fullPath, content);
        } else {
            fs.writeFileSync(fullPath, content, 'utf-8');
        }

        return fullPath;
    }

    async readFile(filename, directory = 'temp') {
        const dirPath = directory === 'temp' ? this.tempDir :
            directory === 'assets' ? this.assetsDir :
                directory === 'logs' ? this.logsDir :
                    directory;

        const fullPath = path.join(dirPath, filename);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filename}`);
        }

        return fs.readFileSync(fullPath, 'utf-8');
    }

    async deleteFile(filePath) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }

    async cleanupOldFiles(maxAgeMs = 3600000) { // 1 hour default
        const now = Date.now();
        let cleaned = 0;

        if (fs.existsSync(this.tempDir)) {
            const files = fs.readdirSync(this.tempDir);

            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            }
        }

        return cleaned;
    }

    getFileSize(filePath) {
        if (!fs.existsSync(filePath)) {
            return 0;
        }
        const stats = fs.statSync(filePath);
        return stats.size;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    listFiles(directory = 'temp') {
        const dirPath = directory === 'temp' ? this.tempDir :
            directory === 'assets' ? this.assetsDir :
                directory;

        if (!fs.existsSync(dirPath)) {
            return [];
        }

        return fs.readdirSync(dirPath).map(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            return {
                name: file,
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isDirectory: stats.isDirectory()
            };
        });
    }

    async copyFile(source, destination) {
        if (!fs.existsSync(source)) {
            throw new Error(`Source file not found: ${source}`);
        }

        fs.copyFileSync(source, destination);
        return destination;
    }

    getTotalSize(directory = 'temp') {
        const dirPath = directory === 'temp' ? this.tempDir : directory;

        if (!fs.existsSync(dirPath)) {
            return 0;
        }

        let totalSize = 0;
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                totalSize += stats.size;
            }
        });

        return totalSize;
    }

    generateUniqueFilename(prefix, extension) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}.${extension}`;
    }
}

module.exports = FileManager;
