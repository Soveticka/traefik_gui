import Joi from 'joi';

export const routerSchema = Joi.object({
  entryPoints: Joi.array().items(Joi.string()).required(),
  rule: Joi.string().required(),
  service: Joi.string().required(),
  tls: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.object({
        certResolver: Joi.string().optional(),
      })
    )
    .optional(),
  middlewares: Joi.array().items(Joi.string()).optional(),
});

export const serviceSchema = Joi.object({
  loadBalancer: Joi.object({
    servers: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
        })
      )
      .required(),
    healthCheck: Joi.object({
      interval: Joi.string().optional(),
      path: Joi.string().optional(),
      timeout: Joi.string().optional(),
    }).optional(),
    serversTransport: Joi.string().optional(),
  }).required(),
});

export const middlewareSchema = Joi.object({
  errors: Joi.object({
    query: Joi.string().required(),
    service: Joi.string().required(),
    status: Joi.array().items(Joi.string()).required(),
  }).optional(),
  rateLimit: Joi.object({
    average: Joi.number().required(),
    burst: Joi.number().required(),
  }).optional(),
  headers: Joi.object({
    customRequestHeaders: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    customResponseHeaders: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  }).optional(),
  redirectRegex: Joi.object({
    permanent: Joi.boolean().required(),
    regex: Joi.string().required(),
    replacement: Joi.string().required(),
  }).optional(),
})
  .xor('errors', 'rateLimit', 'headers', 'redirectRegex')
  .required();

export const combinedSchema = Joi.object({
  routerName: Joi.string().required(),
  serviceName: Joi.string().required(),
  router: routerSchema.required(),
  service: serviceSchema.required(),
});
