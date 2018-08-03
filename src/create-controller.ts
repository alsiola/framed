import { Application, Request, Response } from "express";
import { BaseRequest, Injector } from "./create-app";
import { RestResult } from "./responses";

export type HttpVerb = "get" | "post";

export type Injected<T extends Record<string, Injector<any>>> = {
    [K in keyof T]: T[K] extends Injector<Promise<infer U>>
        ? U
        : ReturnType<T[K]>
};

export interface ControllerOpts<
    T extends Record<string, Injector<any, any>>,
    U extends Record<string, Injector<any, any>>
> {
    description?: string;
    path: string;
    verb: HttpVerb;
    inject?: U;
    handler: (req: Injected<T & U>) => any;
}

const runInjectors = <T extends Record<string, Injector<any>>>(
    injectors: T,
    req: BaseRequest<{}>
) =>
    Object.entries(injectors).reduce(async (out, [key, injector]) => {
        const injectorCtx = {
            ...out,
            ...req
        };

        const injectorResult = await injector(injectorCtx);

        return {
            ...out,
            ...req,
            [key]: injectorResult
        };
    }, {});

export function createController<T extends Record<string, Injector<any, any>>>(
    app: Application,
    appInjectors: T,
    registerRoute: (route: ControllerOpts<T, any>) => void
) {
    return <U extends Record<string, Injector<any, any>>>({
        verb,
        path,
        handler,
        description,
        inject: controllerInjectors
    }: ControllerOpts<T, U>) => {
        registerRoute({
            verb,
            path,
            handler: handler as any,
            description,
            inject: controllerInjectors
        });
        app[verb].apply(
            app,
            [
                path,
                async (req: Request, res: Response) => {
                    try {
                        const baseRequest = {
                            request: req,
                            response: res
                        };

                        const appCtx: BaseRequest<any> = (await runInjectors(
                            appInjectors,
                            baseRequest
                        )) as any;

                        const ctx = controllerInjectors
                            ? await runInjectors(controllerInjectors, appCtx)
                            : appCtx;

                        const result = handler(ctx as Injected<T & U>);

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
