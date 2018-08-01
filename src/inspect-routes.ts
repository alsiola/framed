import * as t from "io-ts";
import { ControllerOpts, HttpVerb } from "./create-controller";

export interface RouteInfo {
    verb: HttpVerb;
    path: string;
    params: Array<{
        name: string;
        type: string;
    }>;
}

const getParamType = (
    name: string,
    validation: t.InterfaceType<any> | undefined
): string => {
    if (!validation || !validation.props[name]) {
        return "MISSING";
    }

    switch (validation.props[name]._tag) {
        case t.string._tag:
            return "string";
        default:
            return "TODO";
    }
};

export const inspectRoutes = (
    routes: ControllerOpts<any, any, any, any, any, any, any, any, any>[]
) => (): RouteInfo[] => {
    const paramRegex = /\:[a-zA-Z0-9]+\/?/;

    return routes.map(({ verb, path, validation }) => {
        const params = paramRegex.exec(path);
        return {
            path: path.replace(
                paramRegex,
                match => "{" + match.substr(1) + "}"
            ),
            params:
                params === null
                    ? []
                    : params.map(param => {
                          const name = param.substr(1);
                          return {
                              name,
                              type: getParamType(name, validation.params)
                          };
                      }),
            verb
        };
    });
};
