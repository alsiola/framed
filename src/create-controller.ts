import { Application, Request, Response } from "express";
import { BaseRequest, Injector, InjectorRecord } from "./create-app";
import { RestError, RestResult } from "./responses";
import { reduceAsync } from "./util/reduce-async";

export type HttpVerb = "get" | "post";

export type Injected<T extends InjectorRecord> = {
    [K in keyof T]: T[K] extends Injector<Promise<infer U>>
        ? U
        : ReturnType<T[K]>
};

export interface ControllerOpts<
    T extends InjectorRecord,
    U extends InjectorRecord<any, T>
> {
    description?: string;
    path: string;
    verb: HttpVerb;
    inject?: U;
    handler: (
        req: Injected<T & U>
    ) => RestResult<any> | Promise<RestResult<any>>;
}

const runInjectors = <T extends InjectorRecord<any, any>>(
    injectors: T,
    req: BaseRequest<{}>
) => {
    return reduceAsync(
        (out, [key, injector]) =>
            Promise.resolve(
                injector({
                    ...out,
                    ...req
                })
            ).then(injectorResult => ({
                ...out,
                ...req,
                [key]: injectorResult
            })),
        Object.entries(injectors),
        {}
    );
};

export const createController = <T extends InjectorRecord>(
    app: Application,
    appInjectors: T,
    registerRoute: (route: ControllerOpts<T, any>) => void
) => {
    return <U extends InjectorRecord<any, T>>({
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
                            ? await runInjectors(
                                  controllerInjectors || {},
                                  appCtx
                              )
                            : {};

                        const result: RestResult<any> = await handler(
                            ctx as Injected<T & U>
                        );

                        result.send(res);
                    } catch (err) {
                        if (err instanceof RestResult) {
                            return err.send(res);
                        }
                        new RestError(err.message).send(res);
                    }
                }
            ].filter(x => !!x)
        );
    };
};
