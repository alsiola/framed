export const reduceAsync = <T, U>(
    fn: (a: U, b: T) => U | Promise<U>,
    arr: T[],
    seed: U
): Promise<U> => {
    return arr.reduce((out, curr) => {
        return out.then(rOut => fn(rOut, curr));
    }, Promise.resolve(seed));
};
