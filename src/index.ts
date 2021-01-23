import { fabric } from 'fabric';
import { Heap } from './heap';
import { easeLinear, make2D, make2DFn, random } from './util';

// --- config ---
const HEIGHT = 25;
const WIDTH = 25;

const Column = 20;
const Row = 20;

const strokeColor = '#ccd9ea';
const strokeWidth = 2;

const BlockNum = 100;
const BlockColor = '#800000';

const Start = {
  x: 0,
  y: 0,
};

const End = {
  x: Column - 1,
  y: Row - 1,
};

const BaseVelocity = 150;

const VelocityList = [0.5, 0.75, 1, 1.5, 3.0];
const VelocityProbability = [0.1, 0.2, 0.4, 0.2, 0.1];
// --- config ---

const canvas = new fabric.StaticCanvas('canvas');

const map = make2D(Column, Row, false);

renderGrid(Row, Column);

const grid = make2DFn(Column, Row, (i, j) => addBlock(i, j, 'transparent'));

const velocityEval = initVelocityEval();

const circle = addCircle(Start.x, Start.y);

bootstrap();

function bootstrap() {
  const runBtn = document.querySelector('#run') as Element;
  const runShortestBtn = document.querySelector('#run-shortest') as Element;
  
  const handlerRun = () => {
    setTimeout(() => {
      clear();
      run();
    }, 0);
  };

  const handlerShortest = () => {
    setTimeout(() => {
      clear();
      runShortest();
    }, 0);
  };

  runBtn.addEventListener('click', handlerRun);

  runShortestBtn.addEventListener('click', handlerShortest);

  function clear() {
    runBtn.removeEventListener('click', handlerRun);
    runShortestBtn.removeEventListener('click', handlerShortest);
  }

  fabric.util.requestAnimFrame(renderAll);

  function renderAll() {
    canvas.renderAll();
    fabric.util.requestAnimFrame(renderAll);
  }
}

function renderGrid(Row: number, Column: number) {
  for (let i = 0; i <= Row; i++) {
    canvas.add(
      new fabric.Line([0, i * HEIGHT, Column * WIDTH, i * HEIGHT], {
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      })
    );
  }

  for (let i = 0; i <= Column; i++) {
    canvas.add(
      new fabric.Line([i * WIDTH, 0, i * WIDTH, Row * HEIGHT], {
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      })
    );
  }

  for (let i = 0; i < BlockNum; i++) {
    while (true) {
      let x = random(0, Column - 1);
      let y = random(0, Row - 1);
      if (x === Start.x && y === Start.y) continue;
      if (x === End.x && y === End.y) continue;
      if (!map[x][y]) {
        map[x][y] = true;
        addBlock(x, y);
        break;
      }
    }
  }
}

function initVelocityEval() {
  const q: number[][] = [];
  const dis = make2D(Column, Row, Number.MAX_VALUE);
  for (let i = 0; i < Column; i++) {
    for (let j = 0; j < Row; j++) {
      if (map[i][j]) {
        dis[i][j] = 0;
        q.push([i, j]);
      }
    }
  }
  for (let i = 0; i < q.length; i++) {
    const [ux, uy] = q[i];
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const x = ux + dx;
      const y = uy + dy;
      if (x < 0 || x >= Column || y < 0 || y >= Row) continue;
      if (dis[x][y] > dis[ux][uy] + 1) {
        dis[x][y] = dis[ux][uy] + 1;
        q.push([x, y]);
      }
    }
  }
  
  const distanceProbability: number[] = [];
  for (let i = 0; i < Column; i++) {
    for (let j = 0; j < Row; j++) {
      while (distanceProbability.length - 1 < dis[i][j]) {
        distanceProbability.push(0);
      }
      if (dis[i][j] > 0) {
        distanceProbability[dis[i][j]]++;
      }
    }
  }
  for (let i = 0; i < distanceProbability.length; i++) {
    distanceProbability[i] /= Row * Column - BlockNum;
  }

  const relation = make2DFn(distanceProbability.length, VelocityProbability.length, (i, j) => {
    return Math.min(distanceProbability[i], VelocityProbability[j]);
  });

  const fn = (i: number, j: number) => {
    const vec = relation[dis[i][j]];
    return VelocityList[vec.reduce((pre, cur, id, array) => {
      if (pre === -1 || array[pre] < cur) {
        return id;
      } else {
        return pre;
      }
    }, -1)];
  };

  return {
    dis,
    distanceProbability,
    relation,
    eval: fn
  };
}

function light(i: number, j: number) {
  grid[i][j].animate('fill', '#ccd9ea', {
    duration: BaseVelocity / 2,
    easing: easeLinear,
  });
}

function unlight(i: number, j: number) {
  grid[i][j].animate('fill', 'transparent', {
    duration: BaseVelocity / 2,
    easing: easeLinear,
  });
}

function addBlock(x: number, y: number, fill: string = BlockColor) {
  // if (x < 0 || x >= Column) return;
  // if (y < 0 || y >= Row) return;

  const rect = new fabric.Rect({
    left: x * WIDTH + strokeWidth - 1,
    top: y * HEIGHT + strokeWidth - 1,
    fill,
    width: WIDTH - strokeWidth + 1,
    height: HEIGHT - strokeWidth + 1,
  });

  canvas.add(rect);

  return rect;
}

interface IMoveCommand {
  dir: string;
  isIn: boolean;
}

function addCircle(x: number, y: number) {
  // if (x < 0 || x >= Column) return;
  // if (y < 0 || y >= Row) return;

  light(x, y);

  const circle = new fabric.Circle({
    radius: WIDTH / 2 - 4,
    left: x * WIDTH + 4.5,
    top: y * HEIGHT + 4.5,
    fill: '#0f5a0f',
  });

  canvas.add(circle);

  let isInAnime = false;

  const moveRight = () => {
    x++;
    const velocity = velocityEval.eval(x, y);
    circle.animate('left', '+=' + WIDTH.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity * velocity,
    });
  };
  const moveLeft = () => {
    x--;
    const velocity = velocityEval.eval(x, y);
    circle.animate('left', '-=' + WIDTH.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity * velocity,
    });
  };
  const moveUp = () => {
    y--;
    const velocity = velocityEval.eval(x, y);
    circle.animate('top', '-=' + HEIGHT.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity * velocity,
    });
  };
  const moveDown = () => {
    y++;
    const velocity = velocityEval.eval(x, y);
    circle.animate('top', '+=' + HEIGHT.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity * velocity,
    });
  };

  const history: IMoveCommand[] = [];
  let next = 0;

  const push = (dir: string, isIn: boolean) => {
    history.push({ dir, isIn });
  };

  function move({ dir, isIn }: IMoveCommand) {
    isInAnime = true;
    if (!isIn) {
      unlight(x, y);
    }
    if (dir === 'L') {
      moveLeft();
    } else if (dir === 'R') {
      moveRight();
    } else if (dir === 'U') {
      moveUp();
    } else if (dir === 'D') {
      moveDown();
    }
    if (isIn) {
      light(x, y);
    }
  }

  function onComplete() {
    isInAnime = false;
    if (next < history.length) {
      move(history[next++]);
    }
  }

  return {
    circle,
    moveLeft(isIn = true) {
      push('L', isIn);
    },
    moveRight(isIn = true) {
      push('R', isIn);
    },
    moveUp(isIn = true) {
      push('U', isIn);
    },
    moveDown(isIn = true) {
      push('D', isIn);
    },
    start() {
      if (next < history.length) {
        move(history[next++]);
      }
    },
  };
}

interface Node {
  x: number;
  y: number;
  distance: number;
  val: number;
  pre?: Node;
}

function run() {
  const H = (x: number, y: number, distance: number) => {
    return Math.abs(End.x - x) + Math.abs(End.y - y) + distance;
  };
  const vis = make2D(Column, Row, false);
  const check = (x: number, y: number) => {
    if (x < 0 || x >= Column) return false;
    if (y < 0 || y >= Row) return false;
    return !vis[x][y] && !map[x][y];
  };

  function dfs(u: Node) {
    if (u.x === End.x && u.y === End.y) {
      return true;
    }
    vis[u.x][u.y] = true;

    const next: Node[] = [];
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = u.x + dx;
      const y = u.y + dy;
      if (check(x, y)) {
        const val = H(x, y, u.distance + 1);
        next.push({ x, y, distance: u.distance + 1, val, pre: u });
      }
    }
    next.sort((lhs, rhs) => {
      return lhs.val - rhs.val;
    });
    for (const son of next) {
      if (vis[son.x][son.y]) continue;
      const dx = son.x - u.x;
      const dy = son.y - u.y;
      // console.log(`(${u.x}, ${u.y}) -> (${son.x}, ${son.y})`);
      if (dx === -1) {
        circle.moveLeft();
        if (dfs(son)) {
          return true;
        } else {
          circle.moveRight(false);
        }
      } else if (dx === 1) {
        circle.moveRight();
        if (dfs(son)) {
          return true;
        } else {
          circle.moveLeft(false);
        }
      } else if (dy === 1) {
        circle.moveDown();
        if (dfs(son)) {
          return true;
        } else {
          circle.moveUp(false);
        }
      } else if (dy === -1) {
        circle.moveUp();
        if (dfs(son)) {
          return true;
        } else {
          circle.moveDown(false);
        }
      }
    }
    return false;
  }

  const findPath = dfs({
    x: Start.x,
    y: Start.y,
    distance: 0,
    val: H(Start.x, Start.y, 0),
  });

  if (findPath) {
    circle.start();
  } else {
  }
}

function runShortest() {
  const cmp = (lhs: Node, rhs: Node) => {
    return lhs.val < rhs.val;
  };
  const H = (x: number, y: number, distance: number) => {
    return Math.abs(End.x - x) + Math.abs(End.y - y) + distance;
  };
  const vis = make2D(Column, Row, false);
  const check = (x: number, y: number) => {
    if (x < 0 || x >= Column) return false;
    if (y < 0 || y >= Row) return false;
    return !vis[x][y] && !map[x][y];
  };

  const heap = new Heap(cmp);
  heap.push({
    x: Start.x, y: Start.y, distance: 0, val: H(Start.x, Start.y, 0)
  });

  while (!heap.empty()) {
    const u = heap.pop();
    vis[u.x][u.y] = true;
    // if (u.pre) {
    //   const dx = u.x - u.pre.x;
    //   const dy = u.y - u.pre.y;
    //   // console.log(dx, dy);
    //   if (dx === -1) {
    //     circle.moveLeft();
    //   } else if (dx === 1) {
    //     circle.moveRight();
    //   } else if (dy === 1) {
    //     circle.moveDown();
    //   } else if (dy === -1) {
    //     circle.moveUp();
    //   }
    // }
    if (u.x === End.x && u.y === End.y) {
      const routeReverse: string[] = [];
      let x: Node = u;
      while (true) {
        const pre = x.pre;
        if (pre !== undefined) {
          const dx = x.x - pre.x;
          const dy = x.y - pre.y;
          if (dx === -1) {
            routeReverse.push('L');
          } else if (dx === 1) {
            routeReverse.push('R');
          } else if (dy === 1) {
            routeReverse.push('D');
          } else if (dy === -1) {
            routeReverse.push('U');
          }
          x = pre;
        } else {
          break;
        }
      }
      for (const dir of routeReverse.reverse()) {
        if (dir === 'L') {
          circle.moveLeft();
        } else if (dir === 'R') {
          circle.moveRight();
        } else if (dir === 'D') {
          circle.moveDown();
        } else if (dir === 'U') {
          circle.moveUp();
        }
      }
      circle.start();
      break;
    }
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
      const x = u.x + dx;
      const y = u.y + dy;
      if (check(x, y)) {
        const val = H(x, y, u.distance + 1);
        heap.push({ x, y, distance: u.distance + 1, val, pre: u });
      }
    }
  }
}
