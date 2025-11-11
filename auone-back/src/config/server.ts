import express from "express";
import { corsConfig } from "../src/middlewares/corsConfig";
import { bodyParser } from "../src/middlewares/bodyParser";
import { notFound } from "../src/middlewares/notFound";
import { setupRoutes } from "../src/routes";

export const createServer = () => {
  const app = express();
  app.use(corsConfig);
  app.use(bodyParser);
  setupRoutes(app);
  app.use(notFound);
  return app;
};
