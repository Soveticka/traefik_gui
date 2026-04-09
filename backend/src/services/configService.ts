import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import YAML from 'yaml';
import { TraefikConfig, TraefikMiddleware, TraefikRouter, TraefikService } from '../types/traefik';

const DYNAMIC_FILE_PATH = process.env.DYNAMIC_FILE_PATH || './dynamic.yml';
const CONFIG_PATH = process.env.CONFIG_PATH || './config';
const BACKUP_DIR_NAME = '.backups';

export class ConfigConflictError extends Error {
  readonly currentRevision: string;

  constructor(currentRevision: string) {
    super('Configuration revision mismatch');
    this.name = 'ConfigConflictError';
    this.currentRevision = currentRevision;
  }
}

export class ConfigService {
  private createEmptyConfig(): TraefikConfig {
    return {
      http: {
        routers: {},
        services: {},
        middlewares: {},
      },
    };
  }

  normalizeConfig(rawConfig: unknown): TraefikConfig {
    const root = (rawConfig && typeof rawConfig === 'object' ? rawConfig : {}) as Record<string, unknown>;
    const http = (root.http && typeof root.http === 'object' ? root.http : {}) as Record<string, unknown>;

    const routers =
      http.routers && typeof http.routers === 'object' ? (http.routers as Record<string, TraefikRouter>) : {};
    const services =
      http.services && typeof http.services === 'object' ? (http.services as Record<string, TraefikService>) : {};
    const middlewares =
      http.middlewares && typeof http.middlewares === 'object'
        ? (http.middlewares as Record<string, TraefikMiddleware>)
        : {};

    const normalized: TraefikConfig = {
      http: {
        routers,
        services,
        middlewares,
      },
    };

    if (http.serversTransports && typeof http.serversTransports === 'object') {
      normalized.http.serversTransports = http.serversTransports as Record<string, any>;
    }

    return normalized;
  }

  getRevision(config: TraefikConfig): string {
    const normalized = this.normalizeConfig(config);
    const serialized = YAML.stringify(normalized, { indent: 2 });
    return createHash('sha256').update(serialized, 'utf8').digest('hex');
  }

  async getCurrentRevision(): Promise<string> {
    const config = await this.loadFullConfig();
    return this.getRevision(config);
  }

  private async assertExpectedRevision(expectedRevision?: string): Promise<void> {
    if (!expectedRevision) {
      return;
    }

    const currentRevision = await this.getCurrentRevision();
    if (currentRevision !== expectedRevision) {
      throw new ConfigConflictError(currentRevision);
    }
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_PATH)) {
      fs.mkdirSync(CONFIG_PATH, { recursive: true });
    }
  }

  private ensureParentDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private ensureBackupDirFor(filePath: string): string {
    const dir = path.dirname(filePath);
    const backupDir = path.join(dir, BACKUP_DIR_NAME);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  }

  private writeYamlAtomic(filePath: string, value: unknown): void {
    this.ensureParentDir(filePath);

    const yamlContent = YAML.stringify(value, { indent: 2 });
    YAML.parse(yamlContent);

    const tmpPath = `${filePath}.tmp-${Date.now()}`;
    const hadExistingFile = fs.existsSync(filePath);

    fs.writeFileSync(tmpPath, yamlContent, 'utf8');

    try {
      if (hadExistingFile) {
        const backupDir = this.ensureBackupDirFor(filePath);
        const backupName = `${path.basename(filePath)}.${Date.now()}.bak`;
        const backupPath = path.join(backupDir, backupName);
        fs.copyFileSync(filePath, backupPath);
      }

      try {
        // Replace in place when possible.
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        const code = (renameError as NodeJS.ErrnoException).code;
        // Bind-mounted files can fail rename/unlink semantics (e.g., EBUSY/EXDEV on Docker).
        if (code === 'EBUSY' || code === 'EXDEV' || code === 'EPERM') {
          fs.writeFileSync(filePath, yamlContent, 'utf8');
          fs.unlinkSync(tmpPath);
          return;
        }
        throw renameError;
      }
    } catch (error) {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
      throw error;
    }
  }

  private getSplitFileState(): { allExist: boolean; anyExist: boolean; missingFiles: string[] } {
    const splitFiles = ['routers.yml', 'services.yml', 'middlewares.yml'];
    const missingFiles = splitFiles.filter((fileName) => !fs.existsSync(path.join(CONFIG_PATH, fileName)));

    return {
      allExist: missingFiles.length === 0,
      anyExist: missingFiles.length < splitFiles.length,
      missingFiles,
    };
  }

  private ensureNoPartialSplitState(): void {
    const splitState = this.getSplitFileState();
    if (splitState.anyExist && !splitState.allExist) {
      throw new Error(
        `Partial split configuration detected. Missing files: ${splitState.missingFiles.join(', ')}. ` +
          'Restore missing split files or remove split files to use monolithic mode safely.'
      );
    }
  }

  private buildRoutersConfig(config: TraefikConfig): Record<string, unknown> {
    return { http: { routers: config.http.routers } };
  }

  private buildServicesConfig(config: TraefikConfig): Record<string, unknown> {
    return {
      http: {
        services: config.http.services,
        ...(config.http.serversTransports && { serversTransports: config.http.serversTransports }),
      },
    };
  }

  private buildMiddlewaresConfig(config: TraefikConfig): Record<string, unknown> {
    return { http: { middlewares: config.http.middlewares } };
  }

  async loadFullConfig(): Promise<TraefikConfig> {
    this.ensureNoPartialSplitState();
    const splitState = this.getSplitFileState();

    if (splitState.allExist) {
      return this.loadSplitConfig();
    }

    try {
      const content = fs.readFileSync(DYNAMIC_FILE_PATH, 'utf8');
      return this.normalizeConfig(YAML.parse(content));
    } catch (error) {
      console.error('Error loading config:', error);
      return this.createEmptyConfig();
    }
  }

  private async loadSplitConfig(): Promise<TraefikConfig> {
    this.ensureNoPartialSplitState();
    const config = this.createEmptyConfig();

    try {
      const routersPath = path.join(CONFIG_PATH, 'routers.yml');
      const routersContent = fs.readFileSync(routersPath, 'utf8');
      const routersConfig = this.normalizeConfig(YAML.parse(routersContent));
      config.http.routers = routersConfig.http.routers;

      const servicesPath = path.join(CONFIG_PATH, 'services.yml');
      const servicesContent = fs.readFileSync(servicesPath, 'utf8');
      const servicesConfig = this.normalizeConfig(YAML.parse(servicesContent));
      config.http.services = servicesConfig.http.services;
      if (servicesConfig.http.serversTransports) {
        config.http.serversTransports = servicesConfig.http.serversTransports;
      }

      const middlewaresPath = path.join(CONFIG_PATH, 'middlewares.yml');
      const middlewaresContent = fs.readFileSync(middlewaresPath, 'utf8');
      const middlewaresConfig = this.normalizeConfig(YAML.parse(middlewaresContent));
      config.http.middlewares = middlewaresConfig.http.middlewares;

      return config;
    } catch (error) {
      console.error('Error loading split config:', error);
      throw new Error('Failed to load split configuration');
    }
  }

  async saveFullConfig(config: TraefikConfig, expectedRevision?: string): Promise<void> {
    this.ensureNoPartialSplitState();
    await this.assertExpectedRevision(expectedRevision);

    const splitState = this.getSplitFileState();
    const normalizedConfig = this.normalizeConfig(config);

    if (splitState.allExist) {
      return this.saveSplitConfig(normalizedConfig);
    }

    try {
      this.writeYamlAtomic(DYNAMIC_FILE_PATH, normalizedConfig);
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  private async saveSplitConfig(config: TraefikConfig): Promise<void> {
    this.ensureConfigDir();
    this.ensureNoPartialSplitState();

    try {
      const routersPath = path.join(CONFIG_PATH, 'routers.yml');
      const servicesPath = path.join(CONFIG_PATH, 'services.yml');
      const middlewaresPath = path.join(CONFIG_PATH, 'middlewares.yml');

      this.writeYamlAtomic(routersPath, this.buildRoutersConfig(config));
      this.writeYamlAtomic(servicesPath, this.buildServicesConfig(config));
      this.writeYamlAtomic(middlewaresPath, this.buildMiddlewaresConfig(config));

      console.log('Split configuration saved successfully');
    } catch (error) {
      console.error('Error saving split config:', error);
      throw new Error('Failed to save split configuration');
    }
  }

  async splitConfigIntoFiles(config: TraefikConfig, expectedRevision?: string): Promise<void> {
    await this.assertExpectedRevision(expectedRevision);
    this.ensureConfigDir();
    const normalizedConfig = this.normalizeConfig(config);

    try {
      this.writeYamlAtomic(path.join(CONFIG_PATH, 'routers.yml'), this.buildRoutersConfig(normalizedConfig));
      this.writeYamlAtomic(path.join(CONFIG_PATH, 'services.yml'), this.buildServicesConfig(normalizedConfig));
      this.writeYamlAtomic(path.join(CONFIG_PATH, 'middlewares.yml'), this.buildMiddlewaresConfig(normalizedConfig));

      console.log('Configuration split into separate files successfully');
    } catch (error) {
      console.error('Error splitting config:', error);
      throw new Error('Failed to split configuration');
    }
  }

  async loadRouters(): Promise<Record<string, TraefikRouter>> {
    const config = await this.loadFullConfig();
    return config.http.routers || {};
  }

  async loadServices(): Promise<Record<string, TraefikService>> {
    const config = await this.loadFullConfig();
    return config.http.services || {};
  }

  async loadMiddlewares(): Promise<Record<string, TraefikMiddleware>> {
    const config = await this.loadFullConfig();
    return config.http.middlewares || {};
  }

  async saveRouter(name: string, router: TraefikRouter, expectedRevision?: string): Promise<void> {
    const config = await this.loadFullConfig();
    config.http.routers[name] = router;
    await this.saveFullConfig(config, expectedRevision);
  }

  async deleteRouter(name: string, expectedRevision?: string): Promise<void> {
    const config = await this.loadFullConfig();
    delete config.http.routers[name];
    await this.saveFullConfig(config, expectedRevision);
  }

  async saveService(name: string, service: TraefikService, expectedRevision?: string): Promise<void> {
    const config = await this.loadFullConfig();
    config.http.services[name] = service;
    await this.saveFullConfig(config, expectedRevision);
  }

  async deleteService(name: string, expectedRevision?: string): Promise<void> {
    const config = await this.loadFullConfig();
    delete config.http.services[name];
    await this.saveFullConfig(config, expectedRevision);
  }

  async saveMiddleware(name: string, middleware: TraefikMiddleware, expectedRevision?: string): Promise<void> {
    const config = await this.loadFullConfig();
    config.http.middlewares[name] = middleware;
    await this.saveFullConfig(config, expectedRevision);
  }

  async deleteMiddleware(name: string, expectedRevision?: string): Promise<void> {
    const config = await this.loadFullConfig();
    delete config.http.middlewares[name];
    await this.saveFullConfig(config, expectedRevision);
  }
}
