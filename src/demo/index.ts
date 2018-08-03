import * as t from "io-ts";
import { createApp, RestResult } from "../index";
import { injectBody } from "../middleware/validation";

interface Logger {
    info: (msg: any) => void;
}

const logger = () => ({
    info: (msg: any) => console.log("INFO: " + msg)
});

const app = createApp({
    swagger: {
        title: "Framework Demo App",
        version: "0.0.1",
        description: "A demo app for framework with lovely types",
        host: "example.com",
        basePath: "/demo",
        schemes: ["http"]
    },
    inject: {
        logger
    }
});

const body = t.interface({
    userId: t.string
});

app.controller({
    description: "A test route",
    verb: "post",
    path: "/test2/:segmentId",
    inject: {
        body: injectBody(body)
    },
    handler: ({ logger, body: { userId } }) => {
        return new RestResult(userId);
    }
});

app.start(4000);
