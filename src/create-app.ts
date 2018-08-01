import bodyParser from "body-parser";
import express from "express";
import { ControllerOptsAny, createController } from "./create-controller";
import { inspectRoutes } from "./inspect-routes";
import { makeSwagger } from "./swagger-gen";

export type Injector<T extends object> = (req: {}) => T;

export interface AppOpts<T extends object> {
    basePath: string;
    host: string;
    schemes: string[];
    injectors: Injector<T>[];
}

export const createApp = <T extends object>({
    basePath,
    host,
    schemes,
    injectors
}: AppOpts<T>) => {
    const app = express();
    app.use(bodyParser.json());
    const routes: ControllerOptsAny[] = [];

    const registerRoute = (route: ControllerOptsAny) => {
        routes.push(route);
    };

    return {
        controller: createController(app, injectors, registerRoute),
        start: (port: number) =>
            app.listen(port, () => console.log("Heeeere we go...")),
        inspectRoutes: inspectRoutes(routes),
        makeSwagger: () =>
            makeSwagger({
                routes: inspectRoutes(routes)(),
                basePath,
                host,
                schemes
            })
    };
};
