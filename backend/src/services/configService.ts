import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { TraefikConfig, TraefikRouter, TraefikService, TraefikMiddleware } from '../types/traefik';

const DYNAMIC_FILE_PATH = process.env.DYNAMIC_FILE_PATH || './dynamic.yml';
const CONFIG_PATH = process.env.CONFIG_PATH || './config';

export class ConfigService {
  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_PATH)) {
      fs.mkdirSync(CONFIG_PATH, { recursive: true });
    }
  }

  async loadFullConfig(): Promise<TraefikConfig> {
    try {
      const content = fs.readFileSync(DYNAMIC_FILE_PATH, 'utf8');
      return YAML.parse(content) as TraefikConfig;
    } catch (error) {
      console.error('Error loading config:', error);
      return {
        http: {
          routers: {},
          services: {},
          middlewares: {}
        }
      };
    }
  }

  async saveFullConfig(config: TraefikConfig): Promise<void> {
    try {
      const yamlContent = YAML.stringify(config, { indent: 2 });
      fs.writeFileSync(DYNAMIC_FILE_PATH, yamlContent, 'utf8');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  async splitConfigIntoFiles(config: TraefikConfig): Promise<void> {
    this.ensureConfigDir();

    try {
      // Split into separate files
      const routersConfig = { http: { routers: config.http.routers } };
      const servicesConfig = { 
        http: { 
          services: config.http.services,
          ...(config.http.serversTransports && { serversTransports: config.http.serversTransports })
        } 
      };
      const middlewaresConfig = { http: { middlewares: config.http.middlewares } };

      // Write separate files
      fs.writeFileSync(
        path.join(CONFIG_PATH, 'routers.yml'),
        YAML.stringify(routersConfig, { indent: 2 }),
        'utf8'
      );

      fs.writeFileSync(
        path.join(CONFIG_PATH, 'services.yml'),
        YAML.stringify(servicesConfig, { indent: 2 }),
        'utf8'
      );

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