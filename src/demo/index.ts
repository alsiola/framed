import * as t from "io-ts";
import { createApp, RestError, RestResult } from "../index";

const app = createApp({
    host: "example.com",
    basePath: "/demo",
    schemes: ["http"],
    injectors: []
});

const paramsSchema = t.interface({
    segmentId: t.string
});

const bodySchema = t.interface({
    id: t.string,
    age: t.number
});

app.controller({
    verb: "post",
    path: "/test2/:segmentId",
    validation: {
        params: paramsSchema,
        body: bodySchema
    },
    handler: ({ body: { id, age }, params: { segmentId } }) => {
        if (id === "1") {
            return new RestResult({ id, name, age }, 201);
        }

        if (id === "5") {
            throw new RestError("oh no", 404);
        }

        return {
            id,
            name,
            age
        };
    }
});

app.start(4000);

app.makeSwagger();
