import {
  writable,
  type Writable,
  type Unsubscriber,
  type Updater,
  get,
} from "svelte/store";
import { CONSTANTS, FSHandler, Point, type PointExport } from ".";
import type { Background } from "./background";
import {
  pathAlgorithms,
  GeneratedPoint,
  type GeneratedPointExport,
} from "../gen";

export function customWritable<T>(initialValue: T): Writable<T> & {
  silentSet: (value: T) => void;
  silentUpdate: (updater: Updater<T>) => void;
} {
  let silent = false;
  const store = writable(initialValue);
  return {
    subscribe(run: (value: T) => void, invalidate?: () => void): Unsubscriber {
      return store.subscribe((value: T) => {
        if (!silent) {
          run(value);
        }
      }, invalidate);
    },
    set(value: T): void {
      silent = false;
      store.set(value);
    },
    silentSet(value: T): void {
      silent = true;
      store.set(value);
    },
    update(callback: Updater<T>): void {
      silent = false;
      store.update(callback);
    },
    silentUpdate(callback: Updater<T>): void {
      silent = true;
      store.update(callback);
    },
  };
}

export interface PathPointExport {
  x: number;
  y: number;
  flags: { [key: string]: number | boolean };
}

export class PathPoint extends Point {
  flags: { [key: string]: number | boolean };
  constructor(
    x: number,
    y: number,
    options: {
      flags: { [key: string]: boolean | number };
    }
  ) {
    super(x, y);

    this.flags = options.flags || {};
  }

  get flagsAny() {
    return this.flags as { [key: string]: any };
  }

  set flagsAny(val: any) {
    this.flags = val;
  }

  clone() {
    return new PathPoint(this.x, this.y, { flags: this.flags });
  }

  export(): PathPointExport {
    return {
      x: this.x,
      y: this.y,
      flags: JSON.parse(JSON.stringify(this.flags)),
    };
  }

  static from(point: PathPointExport) {
    return new PathPoint(point.x, point.y, { flags: point.flags });
  }
}

export const points = writable<PathPoint[]>([]);

type Method = "catmull-rom";

export interface PathConfig {
  method: Method;
  background: Background;
  autosave: boolean;
  flags: { [key: string]: "number" | "boolean" };
}

export const config = writable<PathConfig>({
  method: "catmull-rom",
  background: "over-under",
  autosave: false,
  flags: {},
});

config.subscribe((v) => {
  if (v.autosave && !fsHandler.active) {
    alert("Please save the file before enabling autosave");
    config.update((v) => ({ ...v, autosave: false }));
  }
});

export interface AppState {
  selected: number;
  generatedPoints: GeneratedPoint[];
  fileHandle: FileSystemFileHandle | null;
}
export const state = writable<AppState>({
  selected: -1,
  generatedPoints: [],
  fileHandle: null,
});

points.subscribe((p) => {
  if (p.length < 2) return state.update((s) => ({ ...s, generatedPoints: [] }));
  const method = get(config).method;
  const algorithm = pathAlgorithms[method];
  const waypoints: Point[] = p.map((point) => point.clone());
  const first = waypoints[0];
  const second = waypoints[1];
  const last = waypoints[waypoints.length - 1];
  const firstGhostPoint = first.multiply(2).subtract(second);
  waypoints.unshift(firstGhostPoint);
  waypoints.push(last);

  state.update((s) => {
    s.generatedPoints = algorithm(waypoints);
    return s;
  });
});

const exportData = () => {
  return {
    config: get(config),
    points: get(points).map((point) => point.export()),
    version: CONSTANTS.version,
  };
};

const importData = (data: any) => {
  if (!data.config || !data.points || !data.version)
    throw alert("invalid file");
  if (
    data.version !== CONSTANTS.version &&
    !confirm(
      "This file was created with a different version of the app. Some features may not work as expected. Do you want to continue?"
    )
  )
    return;
  points.update((p) => {
    p.splice(
      0,
      p.length,
      ...data.points.map(
        (point: any) =>
          new PathPoint(point.x, point.y, {
            flags: point.flags,
          })
      )
    );
    return p;
  });

  config.set(data.config);
};

export interface HistoryState {
  points: PathPointExport[];
  state: Omit<AppState, "generatedPoints"> & {
    generatedPoints: GeneratedPointExport[];
  };
  config: PathConfig;
}

export const history = writable<HistoryState[]>([]);

export const undo = () => {
  history.update((h) => {
    const last = h.pop();
    if (last) {
      points.set(last.points.map((point) => PathPoint.from(point)));
      state.set({
        ...last.state,
        generatedPoints: last.state.generatedPoints.map((point) =>
          GeneratedPoint.from(point)
        ),
      });
      config.set(last.config);
    }
    return h;
  });
};

export const clearHistory = () => {
  history.set([]);
};

export const pushHistory = () => {
  const p = get(points);
  const s = get(state);
  const c = get(config);

  history.update((h) => {
    h.push({
      points: p.map((point) => point.export()),
      state: {
        ...JSON.parse(JSON.stringify(s)),
        generatedPoints: s.generatedPoints.map((point) => point.export()),
      },
      config: JSON.parse(JSON.stringify(c)),
    });
    return h;
  });
};

if (get(history).length === 0) pushHistory();

const fsHandler = new FSHandler();

export const load = () => {
  fsHandler.open().then((content) => {
    const data = JSON.parse(content);
    try {
      importData(data);
    } catch {}
  });
};

export const save = () => {
  const data = exportData();
  fsHandler.write(JSON.stringify(data));
};

export const saveAs = () => {
  const data = exportData();
  fsHandler.write(JSON.stringify(data), true);
};

points.subscribe(() => {
  if (get(config).autosave) save();
});

config.subscribe(() => {
  if (get(config).autosave) save();
});

export const addFlag = (
  flag: string,
  type: "boolean" | "number",
  overWrite = false
) => {
  if (flag in get(config).flags && !overWrite)
    throw new Error("Flag already exists");
  config.update((c) => {
    c.flags[flag] = type;
    return c;
  });
};

export const removeFlag = (flag: string) => {
  config.update((c) => {
    delete c.flags[flag];
    return c;
  });
};
