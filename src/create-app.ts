import express from "express";
import { ControllerOpts, createController } from "./create-controller";
import { inspectRoutes } from "./inspect-routes";
import { makeSwagger } from "./swagger-gen";

export type Injector<T extends object> = () => T;

export interface SwaggerOpts {
    version: string;
    title: string;
    description: string;
    basePath: string;
    host: string;
    schemes: string[];
}

export interface AppOpts<T extends Record<string, Injector<any>>> {
    inject: T;
}

export function createApp<T extends Record<string, Injector<any>>>({
    inject,
    ...swaggerOpts
}: AppOpts<T> & SwaggerOpts) {
    const app = express();
    const routes: ControllerOpts<T>[] = [];

    const registerRoute = (route: ControllerOpts<T>) => {
        routes.push(route);
    };

    return {
        controller: createController<T>(app, inject, registerRoute),
        start: (port: number) =>
            app.listen(port, () => console.log("Heeeere we go...")),
        inspectRoutes: inspectRoutes(routes),
        makeSwagger: () =>
            makeSwagger({
                routes: inspectRoutes(routes)(),
                ...swaggerOpts
            })
    };
}
