import { Response } from "express";

export class RestResult<T> {
    constructor(private result: T, private code: number = 200) {}
    send(res: Response): void {
        res.status(this.code).send(this.result);
    }
}

export class RestError<T> extends RestResult<T> {
    constructor(result: any, code = 500) {
        super(result, code);
    }
}
