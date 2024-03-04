import {
  writable,
  type Writable,
  type Unsubscriber,
  type Updater,
  get,
} from "svelte/store";
import {
  CONSTANTS,
  FSHandler,
  PathPoint,
  Point,
  type PathPointExport,
	type PathPointOptions,
  type PointExport,
} from ".";
import type { Background } from "./background";
import {
  pathAlgorithms,
  GeneratedPoint,
  type GeneratedPointExport,
  type PathAlgorithm,
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

export const points = writable<PathPoint[]>([]);

export type FlagPoint = {
  pathIndex: number;
  pointIndex: number;
  flags: PathPointOptions["flags"];
};

export const flagPoints = writable<FlagPoint[]>([]);
export const addFlagPoint = (point: FlagPoint) => {
	flagPoints.update((f) => {
		f.push(point);
		return f;
	});
};

export interface PathConfig {
  algorithm: PathAlgorithm;
  background: Background;
  autosave: boolean;
  flags: { [key: string]: "number" | "boolean" };
}

export const config = writable<PathConfig>({
  algorithm: "cubic-spline",
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

export type EditingMode = "pathPoint" | "flagPoint";

export interface AppState {
  selected: number;
  selectedHandle: { handle: number; point: number } | null;
  generatedPoints: GeneratedPoint[];
  fileHandle: FileSystemFileHandle | null;
  editingMode: EditingMode;
}
export const state = writable<AppState>({
  selected: -1,
  selectedHandle: null,
  generatedPoints: [],
  fileHandle: null,
  editingMode: "pathPoint",
});

export const lastSelected = writable<{
  selected: number;
  selectedHandle: { handle: number; point: number } | null;
}>({
  selected: -1,
  selectedHandle: null,
});

export const updateLastSelected = () => {
  const s = get(state);
  lastSelected.set({
    selected: s.selected,
    selectedHandle: JSON.parse(JSON.stringify(s.selectedHandle)),
  });
};

points.subscribe((p) => {
  if (p.length < 2) return state.update((s) => ({ ...s, generatedPoints: [] }));
  const method = get(config).algorithm;
  const algorithm = pathAlgorithms[method];
  const waypoints: PathPoint[] = p.map((point) => point.clone());

  state.update((s) => {
    try {
      s.generatedPoints = algorithm(waypoints);
      return s;
    } catch {
      return s;
    }
  });
});

config.subscribe(() => {
  const p = get(points);
  if (p.length < 2) return state.update((s) => ({ ...s, generatedPoints: [] }));
  const method = get(config).algorithm;
  const algorithm = pathAlgorithms[method];
  const waypoints: PathPoint[] = p.map((point) => point.clone());

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
    throw alert("invalid file" + (!data.version ? " (no version)" : ""));
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
const initialState = writable<HistoryState>();

export const undo = (extra = 0) => {
  history.update((h) => {
    h.pop();
    for (let i = 0; i < extra; i++) h.pop();
    const last = h[h.length - 1];
    if (last) {
      points.set(last.points.map((point) => PathPoint.from(point)));
      state.set({
        ...last.state,
        generatedPoints: last.state.generatedPoints.map((point) =>
          GeneratedPoint.from(point)
        ),
      });
      config.set(last.config);
    } else {
      history.set([get(initialState)]);
    }
    return h;
  });
};

export const clearHistory = () => {
  history.set([]);
};

export const pushHistory = (isInitial = false) => {
  const p = get(points);
  const s = get(state);
  const c = get(config);

  if (isInitial) {
    initialState.set({
      points: p.map((point) => point.export()),
      state: {
        ...JSON.parse(JSON.stringify(s)),
        generatedPoints: s.generatedPoints.map((point) => point.export()),
      },
      config: JSON.parse(JSON.stringify(c)),
    });
  }

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

if (get(history).length === 0) pushHistory(true);

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

export const addFlag = (flag: string, type: "boolean" | "number", overWrite = false) => {
  if (flag in get(config).flags && !overWrite) throw new Error("Flag already exists");
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
