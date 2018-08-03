import { Request } from "express";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
import { Injector } from "../create-app";
import { RestError } from "../responses";

export const getBody = <T>(req: Request): Promise<T> => {
    return new Promise((resolve, reject) => {
        const bodyParts: Buffer[] = [];
        let validBody = true;

        req.on("data", chunk => {
            if (typeof chunk === "string") {
                validBody = false;
                return;
            }
            bodyParts.push(chunk);
        })
            .on("error", err => reject(err))
            .on("end", () => {
                if (!validBody) {
                    return reject("Invalid request body");
                }
                const body = JSON.parse(
                    bodyParts.length > 0
                        ? Buffer.concat(bodyParts).toString()
                        : "{}"
                );
                resolve(body);
            });
    });
};

export const injectBody = <A, O extends object, I>(
    schema: t.InterfaceType<A, O, I>
): Injector<Promise<O>, {}> => async ({ request }) => {
    const body = await getBody(request);
    const result = schema.decode(body);

    if (result.isLeft()) {
        throw new RestError(PathReporter.report(result), 400) as any;
    }

    return result.value;
};
