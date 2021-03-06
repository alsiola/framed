import * as t from "io-ts";
import { createApp, injectors, RestResult } from "../index";

const createLogger = (ctx: string) => ({
    info: (msg: any) => console.log("INFO: " + ctx + msg),
    child: (ctx: string) => createLogger(ctx)
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
        logger: () => createLogger("")
    }
});

const body = t.interface({
    userId: t.string
});

const params = t.interface({
    segmentId: t.string
});

app.controller({
    description: "A test route",
    verb: "post",
    path: "/test2/:segmentId",
    inject: {
        body: injectors.body(body),
        params: injectors.params(params)
    },
    handler: async ({ logger, body: { userId }, params: { segmentId } }) => {
        logger.info("We got a request going on");
        return new RestResult({ userId, segmentId });
    }
});

app.start(4000);
