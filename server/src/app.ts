import cors from "cors";
import express, { type ErrorRequestHandler } from "express";

import { usersRouter } from "./users/users.routes";

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);

  response.status(500).json({
    error: {
      message: "Internal server error",
    },
  });
};

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/users", usersRouter);
  app.use(errorHandler);

  return app;
};
