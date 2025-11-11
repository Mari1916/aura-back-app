import express from "express";
import { corsConfig } from "../middlewares/corsConfig";
import { bodyParser } from "../middlewares/bodyParser";
import { notFound } from "../middlewares/notFound";
import { setupRoutes } from "../routes";

export const createServer = () => {
  const app = express();
  app.use(corsConfig);
  app.use(bodyParser);
  setupRoutes(app);
  app.use(notFound);
  return app;
};
