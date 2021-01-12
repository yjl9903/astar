import { fabric } from 'fabric';
import { easeLinear, make2D, make2DFn, random } from './util';
// import { Heap } from './heap';

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
// --- config ---

const canvas = new fabric.StaticCanvas('canvas');

const map = make2D(Column, Row, false);

renderGrid(Row, Column);

const grid = make2DFn(Column, Row, (i, j) => addBlock(i, j, 'transparent'));

const circle = addCircle(Start.x, Start.y);

bootstrap();

function bootstrap() {
  document.querySelector('#run').addEventListener('click', function () {
    this.parentNode.removeChild(this);
    setTimeout(() => {
      run();
    }, 0);
  });
  
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
  if (x < 0 || x >= Column) return;
  if (y < 0 || y >= Row) return;

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
  if (x < 0 || x >= Column) return;
  if (y < 0 || y >= Row) return;

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
    circle.animate('left', '+=' + WIDTH.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity,
    });
  };
  const moveLeft = () => {
    x--;
    circle.animate('left', '-=' + WIDTH.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity,
    });
  };
  const moveUp = () => {
    y--;
    circle.animate('top', '-=' + HEIGHT.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity,
    });
  };
  const moveDown = () => {
    y++;
    circle.animate('top', '+=' + HEIGHT.toString(), {
      onComplete,
      easing: easeLinear,
      duration: BaseVelocity,
    });
  };

  const history: IMoveCommand[] = [];
  let next = 0;

  const push = (dir: string, isIn: boolean) => {
    history.push({ dir, isIn });
    // if (next < history.length && history[history.length - 1].dir === dir) {
    //   history[history.length - 1].count++;
    // } else {
    // }
    // setTimeout(() => {
    //   if (!inAnime) {
    //     const dir = history[next].dir;
    //     const count = history[next].count;
    //     move(dir, count);
    //   }
    // }, 100);
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
  // const cmp = (lhs: Node, rhs: Node) => {
  //   return lhs.val < rhs.val;
  // };
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

  dfs({
    x: Start.x,
    y: Start.y,
    distance: 0,
    val: H(Start.x, Start.y, 0),
  });

  circle.start();

  // const heap = new Heap(cmp);
  // heap.push({
  //   x: Start.x, y: Start.y, distance: 0, val: H(Start.x, Start.y, 0)
  // });
  // while (!heap.empty()) {
  //   const u = heap.pop();
  //   if (u.pre) {
  //     const dx = u.x - u.pre.x;
  //     const dy = u.y - u.pre.y;
  //     // console.log(dx, dy);
  //     if (dx === -1) {
  //       circle.moveLeft();
  //     } else if (dx === 1) {
  //       circle.moveRight();
  //     } else if (dy === 1) {
  //       circle.moveDown();
  //     } else if (dy === -1) {
  //       circle.moveUp();
  //     }
  //   }
  //   if (u.x === End.x && u.y === End.y) {
  //     break;
  //   }
  //   for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
  //     const x = u.x + dx;
  //     const y = u.y + dy;
  //     console.log(x, y, check(x, y));
  //     if (check(x, y)) {
  //       const val = H(x, y, u.distance + 1);
  //       heap.push({ x, y, distance: u.distance + 1, val, pre: u });
  //     }
  //   }
  // }
}
