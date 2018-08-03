import * as t from "io-ts";
import { createApp, injectors, RestResult } from "../index";

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
        body: injectors.body(body)
    },
    handler: ({ logger, body: { userId } }) => {
        logger.info("We got a request going on");
        return new RestResult(userId);
    }
});

app.start(4000);
