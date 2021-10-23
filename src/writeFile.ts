import * as fs from "fs";
import * as path from "path";

function isExists(path: string) {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
}

export function writeFile(filePath: string, data: string) {
  const dirname = path.dirname(filePath);
  const exist = isExists(dirname);
  if (!exist) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  fs.writeFileSync(filePath, data, "utf8");
}
