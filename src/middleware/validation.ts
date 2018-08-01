type SchemaPart = "query" | "params" | "body";
import { NextFunction, Request, Response } from "express";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";

export const REQ_RESULT_KEY = "validated_result";

export const validatingMiddleware = <A, O, I>(
    schema: t.InterfaceType<A, O, I>,
    part: SchemaPart
) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.decode(req[part]);

    if (result.isLeft()) {
        res.send(PathReporter.report(result));
        return;
    }

    (req as any)[REQ_RESULT_KEY + part] = result.value;

    next();
};
