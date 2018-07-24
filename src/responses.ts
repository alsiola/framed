import { Response } from "express";

export class RestResult {
    constructor(private result: any, private code: number = 200) {}
    send(res: Response): void {
        res.status(this.code).send(this.result);
    }
}

export class RestError extends RestResult {
    constructor(result: any, code = 500) {
        super(result, code);
    }
}
