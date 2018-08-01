import { createApp, RestResult } from "../index";

const logger = () => ({
    info: (msg: any) => console.log("INFO: " + msg)
});

const app = createApp({
    title: "Framework Demo App",
    version: "0.0.1",
    description: "A demo app for framework with lovely types",
    host: "example.com",
    basePath: "/demo",
    schemes: ["http"],
    inject: {
        logger
    }
});

app.controller({
    description: "A test route",
    verb: "post",
    path: "/test2/:segmentId",
    handler: ({ logger }) => {
        logger.info("Cool shit");
        return new RestResult({}, 200);
    }
});

app.start(4000);

app.makeSwagger();
