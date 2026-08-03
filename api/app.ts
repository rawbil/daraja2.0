import express, {
  NextFunction,
  Request,
  Response,
  type Application,
} from "express";
import "dotenv/config";
import { configDotenv } from "dotenv";
// configDotenv({ debug: true });
import cors from "cors";
export const app: Application = express();

import DarajaGateway from "./routes/daraja-routes";

export interface Handler {
  req: Request;
  res: Response;
  next: NextFunction;
}

export const handler =
  (fn: (h: Handler) => void) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn({ req, res, next });

// Body Parser
app.use(express.json(), express.urlencoded({ extended: true }));

//cors
app.use(cors());

app.use("/api/v1/daraja", DarajaGateway);

// health check
app.get(
  "/api/v1/health",
  handler(({ res }) => {
    res.status(200).json({ success: true, message: "HEALTH OK" });
  }),
);

// unknown routes
app.use(
  handler(({ req, res }) => {
    res.status(404).json({
      success: false,
      message: `the route '${req.originalUrl}' does not exist`,
    });
  }),
);
