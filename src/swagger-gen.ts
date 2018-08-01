import { readFileSync, writeFileSync } from "fs";
import * as handlebars from "handlebars";
import { SwaggerOpts } from "./create-app";
import { RouteInfo } from "./inspect-routes";

interface AppInfo extends SwaggerOpts {
    routes: RouteInfo[];
}

export const makeSwagger = (appInfo: AppInfo): void => {
    const swaggerFile = handlebars.compile(
        readFileSync(__dirname + "/.." + "/swagger.handlebars").toString()
    )(appInfo);

    writeFileSync("./swagger.yaml", swaggerFile);
};
