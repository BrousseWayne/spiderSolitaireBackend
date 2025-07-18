import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PORT, CLIENT_ORIGIN } from "@/lib/conf";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

//TODO: Log out
//TODO: Expiration token handling ?
//TODO: strict CSRF ??
//TODO: Match cookie expiration
