import { readFileSync, writeFileSync } from "fs";
import * as handlebars from "handlebars";
import { RouteInfo } from "./inspect-routes";

interface AppInfo {
    host: string;
    basePath: string;
    schemes: string[];
    routes: RouteInfo[];
}

export const makeSwagger = (appInfo: AppInfo): void => {
    const swaggerFile = handlebars.compile(
        readFileSync(__dirname + "/.." + "/swagger.handlebars").toString()
    )(appInfo);

    writeFileSync("./swagger.yaml", swaggerFile);
};
