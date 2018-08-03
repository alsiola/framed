import express, { Request, Response } from "express";
import { ControllerOpts, createController } from "./create-controller";
import { inspectRoutes } from "./inspect-routes";
import { makeSwagger } from "./swagger-gen";

export interface SwaggerOpts {
    version: string;
    title: string;
    description: string;
    basePath: string;
    host: string;
    schemes: string[];
}

export type Injector<T extends object, U = {}> = (
    req: BaseRequest<U>
) => T | Promise<T>;

export type BaseRequest<T> = T & {
    request: Request;
    response: Response;
};

export interface AppOpts<T extends Record<string, Injector<any>>> {
    inject: T;
    swagger?: SwaggerOpts;
}

export function createApp<T extends Record<string, Injector<any>>>({
    inject,
    swagger
}: AppOpts<T>) {
    const app = express();
    const routes: ControllerOpts<T, any>[] = [];

    const registerRoute = <U extends Record<string, Injector<any>>>(
        route: ControllerOpts<T, U>
    ) => {
        routes.push(route);
        swagger &&
            makeSwagger({
                routes: inspectRoutes(routes)(),
                ...swagger
            });
    };

    swagger &&
        makeSwagger({
            routes: inspectRoutes(routes)(),
            ...swagger
        });

    return {
        controller: createController<T>(app, inject, registerRoute),
        start: (port: number) =>
            app.listen(port, () => console.log("Heeeere we go...")),
        inspectRoutes: inspectRoutes(routes)
    };
}
