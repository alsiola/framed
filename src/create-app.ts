import bodyParser from "body-parser";
import express, { Express, NextFunction, Request, Response } from "express";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
import { RestResult } from "./responses";

const number = new t.Type<number, string>(
    "StringToNumber",
    (m): m is number => typeof m === "number",
    (m, c) =>
        t.string.validate(m, c).chain(s => {
            const num = parseInt(s, 10);
            return isNaN(num) ? t.failure(s, c) : t.success(num);
        }),
    m => m.toString()
);

type SchemaPart = "query" | "params" | "body";

type HttpVerb = "get" | "post";

const REQ_RESULT_KEY = "validated_result";

const validatingMiddleware = <A, O, I>(
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

interface FramedRequest<Q, P, B> {
    query: Q;
    params: P;
    body: B;
    request: Request;
}

interface ControllerOpts<Q, QO, QI, P, PO, PI, B, BO, BI> {
    path: string;
    verb: HttpVerb;
    validation: {
        query?: t.InterfaceType<Q, QO, QI>;
        params?: t.InterfaceType<P, PO, PI>;
        body?: t.InterfaceType<B, BO, BI>;
    };
    handler: (req: FramedRequest<QO, PO, BO>) => any;
}

const createController = (app: Express) => <Q, QO, QI, P, PO, PI, B, BO, BI>({
    verb,
    path,
    validation: { query, params, body },
    handler
}: ControllerOpts<Q, QO, QI, P, PO, PI, B, BO, BI>) =>
    app[verb].apply(
        app,
        [
            path,
            query && validatingMiddleware(query, "query"),
            params && validatingMiddleware(params, "params"),
            body && validatingMiddleware(body, "body"),
            (req: Request, res: Response) => {
                try {
                    const result = handler({
                        query: (req as any)[REQ_RESULT_KEY + "query"],
                        params: (req as any)[REQ_RESULT_KEY + "params"],
                        body: (req as any)[REQ_RESULT_KEY + "body"],
                        request: req
                    });

                    if (result instanceof RestResult) {
                        return result.send(res);
                    }

                    res.send(result);
                } catch (err) {
                    if (err instanceof RestResult) {
                        return err.send(res);
                    }
                    res.status(500).send(err.message);
                }
            }
        ].filter(x => !!x)
    );

export const createApp = () => {
    const app = express();
    app.use(bodyParser.json());
    return {
        controller: createController(app),
        start: (port: number) =>
            app.listen(port, () => console.log("Heeeere we go..."))
    };
};
