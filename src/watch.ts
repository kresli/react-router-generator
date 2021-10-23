import * as glob from "glob";
interface Options {
  interval: number;
}

function isArraySame(a: string[], b: string[]) {
  const mergedSize = new Set([...a, ...b]).size;
  return mergedSize === a.length && mergedSize === b.length;
}

export function getPaths(globPattern: string) {
  return glob.sync(globPattern);
}

export function watch(
  globPattern: string,
  callback: (paths: string[]) => void,
  options?: Options
) {
  const interval = options?.interval || 1000;
  let cachedPaths: string[] = [];
  let runningGlob = false;
  const readDir = async () => {
    if (runningGlob) return;
    runningGlob = true;
    const paths = getPaths(globPattern);
    if (isArraySame(cachedPaths, paths)) return;
    cachedPaths = paths;
    callback(paths);
    runningGlob = false;
  };
  readDir();
  const id = setInterval(readDir, interval);
  return () => clearInterval(id);
}
