import * as t from "io-ts";
import { Injector } from "./create-app";
import { ControllerOpts, HttpVerb } from "./create-controller";

export interface RouteInfo {
    description: string;
    verb: HttpVerb;
    path: string;
    params: Array<{
        name: string;
        type: string;
    }>;
    hasParams: boolean;
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

const paramRegex = /\:[a-zA-Z0-9]+\/?/;

export const inspectRoutes = <
    T extends Record<string, Injector<any>>,
    U extends Record<string, Injector<any>>
>(
    routes: ControllerOpts<T, U>[]
) => (): RouteInfo[] => {
    return routes.map(({ verb, path, description = "" }) => {
        return {
            description,
            path: path.replace(
                paramRegex,
                match => "{" + match.substr(1) + "}"
            ),
            params: [],
            hasParams: false,
            verb
        };
    });
};
