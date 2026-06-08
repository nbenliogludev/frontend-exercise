import { Router } from "express";

import { parseUsersQuery } from "./users.query";
import { getUsers } from "./users.service";

export const usersRouter = Router();

usersRouter.get("/", async (request, response, next) => {
  try {
    const query = parseUsersQuery(request.query);
    const users = await getUsers(query);

    response.status(200).json(users);
  } catch (error) {
    next(error);
  }
});
