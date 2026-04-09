import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { TraefikConfig, TraefikRouter, TraefikService, TraefikMiddleware } from '../types/traefik';

const DYNAMIC_FILE_PATH = process.env.DYNAMIC_FILE_PATH || './dynamic.yml';
const CONFIG_PATH = process.env.CONFIG_PATH || './config';

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

  private normalizeConfig(rawConfig: unknown): TraefikConfig {
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

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_PATH)) {
      fs.mkdirSync(CONFIG_PATH, { recursive: true });
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

  async saveFullConfig(config: TraefikConfig): Promise<void> {
    this.ensureNoPartialSplitState();
    const splitState = this.getSplitFileState();
    const normalizedConfig = this.normalizeConfig(config);

    if (splitState.allExist) {
      return this.saveSplitConfig(normalizedConfig);
    }

    try {
      const yamlContent = YAML.stringify(normalizedConfig, { indent: 2 });
      fs.writeFileSync(DYNAMIC_FILE_PATH, yamlContent, 'utf8');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  private async saveSplitConfig(config: TraefikConfig): Promise<void> {
    this.ensureConfigDir();
    this.ensureNoPartialSplitState();

    try {
      const routersConfig = { http: { routers: config.http.routers } };
      const routersPath = path.join(CONFIG_PATH, 'routers.yml');
      fs.writeFileSync(routersPath, YAML.stringify(routersConfig, { indent: 2 }), 'utf8');

      const servicesConfig = {
        http: {
          services: config.http.services,
          ...(config.http.serversTransports && { serversTransports: config.http.serversTransports }),
        },
      };
      const servicesPath = path.join(CONFIG_PATH, 'services.yml');
      fs.writeFileSync(servicesPath, YAML.stringify(servicesConfig, { indent: 2 }), 'utf8');

      const middlewaresConfig = { http: { middlewares: config.http.middlewares } };
      const middlewaresPath = path.join(CONFIG_PATH, 'middlewares.yml');
      fs.writeFileSync(middlewaresPath, YAML.stringify(middlewaresConfig, { indent: 2 }), 'utf8');

      console.log('Split configuration saved successfully');
    } catch (error) {
      console.error('Error saving split config:', error);
      throw new Error('Failed to save split configuration');
    }
  }

  async splitConfigIntoFiles(config: TraefikConfig): Promise<void> {
    this.ensureConfigDir();
    const normalizedConfig = this.normalizeConfig(config);

    try {
      const routersConfig = { http: { routers: normalizedConfig.http.routers } };
      const servicesConfig = {
        http: {
          services: normalizedConfig.http.services,
          ...(normalizedConfig.http.serversTransports && { serversTransports: normalizedConfig.http.serversTransports }),
        },
      };
      const middlewaresConfig = { http: { middlewares: normalizedConfig.http.middlewares } };

      fs.writeFileSync(path.join(CONFIG_PATH, 'routers.yml'), YAML.stringify(routersConfig, { indent: 2 }), 'utf8');
      fs.writeFileSync(path.join(CONFIG_PATH, 'services.yml'), YAML.stringify(servicesConfig, { indent: 2 }), 'utf8');
      fs.writeFileSync(
        path.join(CONFIG_PATH, 'middlewares.yml'),
        YAML.stringify(middlewaresConfig, { indent: 2 }),
        'utf8'
      );

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

  async saveRouter(name: string, router: TraefikRouter): Promise<void> {
    const config = await this.loadFullConfig();
    config.http.routers[name] = router;
    await this.saveFullConfig(config);
  }

  async deleteRouter(name: string): Promise<void> {
    const config = await this.loadFullConfig();
    delete config.http.routers[name];
    await this.saveFullConfig(config);
  }

  async saveService(name: string, service: TraefikService): Promise<void> {
    const config = await this.loadFullConfig();
    config.http.services[name] = service;
    await this.saveFullConfig(config);
  }

  async deleteService(name: string): Promise<void> {
    const config = await this.loadFullConfig();
    delete config.http.services[name];
    await this.saveFullConfig(config);
  }

  async saveMiddleware(name: string, middleware: TraefikMiddleware): Promise<void> {
    const config = await this.loadFullConfig();
    config.http.middlewares[name] = middleware;
    await this.saveFullConfig(config);
  }

  async deleteMiddleware(name: string): Promise<void> {
    const config = await this.loadFullConfig();
    delete config.http.middlewares[name];
    await this.saveFullConfig(config);
  }
}
