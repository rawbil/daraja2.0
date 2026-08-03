import { configDotenv } from "dotenv";
import { app } from "./app";
import "dotenv/config";
// configDotenv({ debug: true });

const PORT = process.env.PORT as string;

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
