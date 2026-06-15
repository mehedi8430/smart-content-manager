import { TUser } from ".";

declare global {
  namespace Express {
    interface Request {
      user?: TUser;
    }
  }
}

export { };
