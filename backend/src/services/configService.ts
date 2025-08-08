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

  private hasSplitFiles(): boolean {
    return fs.existsSync(path.join(CONFIG_PATH, 'routers.yml')) ||
           fs.existsSync(path.join(CONFIG_PATH, 'services.yml')) ||
           fs.existsSync(path.join(CONFIG_PATH, 'middlewares.yml'));
  }

  async loadFullConfig(): Promise<TraefikConfig> {
    if (this.hasSplitFiles()) {
      return this.loadSplitConfig();
    }
    
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

  private async loadSplitConfig(): Promise<TraefikConfig> {
    const config: TraefikConfig = {
      http: {
        routers: {},
        services: {},
        middlewares: {}
      }
    };

    try {
      // Load routers
      const routersPath = path.join(CONFIG_PATH, 'routers.yml');
      if (fs.existsSync(routersPath)) {
        const routersContent = fs.readFileSync(routersPath, 'utf8');
        const routersConfig = YAML.parse(routersContent);
        config.http.routers = routersConfig.http?.routers || {};
      }

      // Load services
      const servicesPath = path.join(CONFIG_PATH, 'services.yml');
      if (fs.existsSync(servicesPath)) {
        const servicesContent = fs.readFileSync(servicesPath, 'utf8');
        const servicesConfig = YAML.parse(servicesContent);
        config.http.services = servicesConfig.http?.services || {};
        if (servicesConfig.http?.serversTransports) {
          config.http.serversTransports = servicesConfig.http.serversTransports;
        }
      }

      // Load middlewares
      const middlewaresPath = path.join(CONFIG_PATH, 'middlewares.yml');
      if (fs.existsSync(middlewaresPath)) {
        const middlewaresContent = fs.readFileSync(middlewaresPath, 'utf8');
        const middlewaresConfig = YAML.parse(middlewaresContent);
        config.http.middlewares = middlewaresConfig.http?.middlewares || {};
      }

      return config;
    } catch (error) {
      console.error('Error loading split config:', error);
      return config;
    }
  }

  async saveFullConfig(config: TraefikConfig): Promise<void> {
    if (this.hasSplitFiles()) {
      return this.saveSplitConfig(config);
    }

    try {
      const yamlContent = YAML.stringify(config, { indent: 2 });
      fs.writeFileSync(DYNAMIC_FILE_PATH, yamlContent, 'utf8');
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  private async saveSplitConfig(config: TraefikConfig): Promise<void> {
    this.ensureConfigDir();

    try {
      // Save routers
      const routersConfig = { http: { routers: config.http.routers } };
      const routersPath = path.join(CONFIG_PATH, 'routers.yml');
      fs.writeFileSync(routersPath, YAML.stringify(routersConfig, { indent: 2 }), 'utf8');

      // Save services
      const servicesConfig = { 
        http: { 
          services: config.http.services,
          ...(config.http.serversTransports && { serversTransports: config.http.serversTransports })
        } 
      };
      const servicesPath = path.join(CONFIG_PATH, 'services.yml');
      fs.writeFileSync(servicesPath, YAML.stringify(servicesConfig, { indent: 2 }), 'utf8');

      // Save middlewares
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