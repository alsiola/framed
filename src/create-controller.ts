import { Application, Response } from "express";
import * as t from "io-ts";
import { Injector } from "./create-app";
import { RestResult } from "./responses";

export type HttpVerb = "get" | "post";

interface FramedRequest<Q, P, B> {
    query: Q;
    params: P;
    body: B;
    request: Request;
}

export interface ControllerOpts<Q, QO, QI, P, PO, PI, B, BO, BI> {
    path: string;
    verb: HttpVerb;
    validation: {
        query?: t.InterfaceType<Q, QO, QI>;
        params?: t.InterfaceType<P, PO, PI>;
        body?: t.InterfaceType<B, BO, BI>;
    };
    handler: (req: FramedRequest<QO, PO, BO>) => any;
}

export type ControllerOptsAny = ControllerOpts<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
>;

export const createController = <T extends object>(
    app: Application,
    injectors: Injector<T>[],
    registerRoute: (route: any) => void
) => <Q, QO, QI, P, PO, PI, B, BO, BI>({
    verb,
    path,
    validation: { query, params, body },
    handler
}: ControllerOpts<Q, QO, QI, P, PO, PI, B, BO, BI>) => {
    registerRoute({
        verb,
        path,
        validation: { query, params, body },
        handler
    });
    app[verb].apply(
        app,
        [
            path,
            (req: Request, res: Response) => {
                try {
                    const ctx = injectors.reduce(
                        (out, curr) => ({
                            ...out,
                            ...(curr(out) as any)
                        }),
                        {}
                    );
                    const result = handler(ctx);

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
};
