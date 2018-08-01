import { Application, Request, Response } from "express";
import { Injector } from "./create-app";
import { RestResult } from "./responses";

export type HttpVerb = "get" | "post";

export type Injected<T extends Record<string, Injector<any>>> = {
    [K in keyof T]: ReturnType<T[K]>
};

export interface ControllerOpts<T extends Record<string, Injector<any>>> {
    description?: string;
    path: string;
    verb: HttpVerb;
    handler: (req: Injected<T>) => any;
}

export function createController<T extends Record<string, Injector<any>>>(
    app: Application,
    injectors: T,
    registerRoute: (route: ControllerOpts<T>) => void
) {
    return ({ verb, path, handler, description }: ControllerOpts<T>) => {
        registerRoute({
            verb,
            path,
            handler,
            description
        });
        app[verb].apply(
            app,
            [
                path,
                (req: Request, res: Response) => {
                    try {
                        const ctx = Object.entries(injectors).reduce(
                            (out, [key, injector]) => ({
                                ...out,
                                [key]: injector()
                            }),
                            {}
                        );
                        const result = handler(ctx as Injected<T>);

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
}
