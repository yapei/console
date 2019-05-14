// Allow importing other file types
declare module '*.svg' {
  const value: any;
  export = value;
}
declare module '*.png' {
  const value: any;
  export = value;
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
declare type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
declare type Diff<T, K> = Omit<T, keyof K>;
