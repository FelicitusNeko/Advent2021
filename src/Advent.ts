import { get as httpsGet } from "https";

interface BingoBoard {
  data: BingoSpace[][];
  winner: boolean;
}
interface BingoSpace {
  num: number;
  marked: boolean;
}

interface Octocell {
  energy: number;
  flash: boolean;
}

interface CaveNode {
  name: string;
  big: boolean;
  isEnd?: boolean;
  smallJoins: string[];
  bigJoins: string[];
}

const getInput = (year: number, day: number) => {
  const { USERAGENT, COOKIE } = process.env;
  const url = `https://adventofcode.com/${year}/day/${day}/input`;
  return new Promise<string>((f, r) => {
    httpsGet(
      url,
      {
        headers: {
          "User-Agent": USERAGENT,
          Cookie: `session=${COOKIE};`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk.toString()));
        res.on("close", () => f(data));
        res.on("error", (e) => r(e));
      }
    );
  });
};

export default class Advent {
  private functions: ((data: string) => Promise<string | number | object>)[][];

  constructor() {
    this.functions = [
      [this.Day1Problem1, this.Day1Problem2],
      [this.Day2Problem1, this.Day2Problem2],
      [this.Day3Problem1, this.Day3Problem2],
      [this.Day4Problem1, this.Day4Problem2],
      [this.Day5Problem1, this.Day5Problem2],
      [this.Day6Problem1, this.Day6Problem2],
      [this.Day7Problem1, this.Day7Problem2],
      [this.Day8Problem1, this.Day8Problem2],
      [this.Day9Problem1, this.Day9Problem2],
      [this.Day10Problem1, this.Day10Problem2],
      [this.Day11Problem1, this.Day11Problem2],
      [this.Day12Problem1, this.Day12Problem2],
    ];
  }

  async DoToday(day: number, problem?: number) {
    const { YEAR } = process.env;
    const data = await getInput(Number.parseInt(YEAR as string), day);

    if (!this.functions[day - 1])
      console.error(`Error: no function assigned for day ${day}`);
    else if (problem !== undefined) {
      const Today = this.functions[day - 1][problem - 1];
      if (Today !== undefined)
        console.log(
          `Day ${day} problem ${problem}:`,
          await Today.call(this, data)
        );
      else
        console.error(
          `Error: no function assigned for day ${day} problem ${problem}`
        );
    } else {
      const todayAll = this.functions[day - 1];
      await Promise.all(
        todayAll.map((i, x) =>
          i
            .call(this, data)
            .then((ii) => console.log(`Day ${day} problem ${x + 1}:`, ii))
        )
      );
    }
  }

  async Dummy() {
    return "Dummy function";
  }

  // Day 1
  async Day1Problem1(data: string) {
    const depths = data.split("\n").map((i) => Number.parseInt(i));

    let lastDepth: number | undefined = undefined;
    let retval = 0;

    for (const depth of depths) {
      if (lastDepth !== undefined && depth > lastDepth) retval++;
      lastDepth = depth;
    }

    return retval;
  }

  async Day1Problem2(data: string) {
    const depths = data.split("\n").map((i) => Number.parseInt(i));

    const lastDepth: number[] = [];
    let retval = 0;

    const arraySum = (r: number, i: number) => i + r;

    for (const depth of depths) {
      if (lastDepth.length === 3) {
        const lastDepthSum = lastDepth.reduce(arraySum);
        lastDepth.push(depth);
        lastDepth.shift();
        if (lastDepth.reduce(arraySum) > lastDepthSum) retval++;
      } else lastDepth.push(depth);
    }

    return retval;
  }

  // Day 2
  async Day2Problem1(data: string) {
    let forward = 0;
    let depth = 0;

    data
      .trim()
      .split("\n")
      .forEach((i) => {
        const line = i.split(" ");
        const val = Number.parseInt(line[1]);

        switch (line[0]) {
          case "forward":
            forward += val;
            break;
          case "down":
            depth += val;
            break;
          case "up":
            depth -= val;
            break;
        }
      });

    return forward * depth;
  }

  async Day2Problem2(data: string) {
    let forward = 0;
    let depth = 0;
    let aim = 0;

    data
      .trim()
      .split("\n")
      .forEach((i) => {
        const line = i.split(" ");
        const val = Number.parseInt(line[1]);

        switch (line[0]) {
          case "forward":
            forward += val;
            depth += aim * val;
            break;
          case "down":
            aim += val;
            break;
          case "up":
            aim -= val;
            break;
        }
      });

    return forward * depth;
  }

  // Day 3
  async Day3Problem1(data: string) {
    const readouts = data.split("\n");
    const readoutCount = readouts.length;
    const oneCount = new Array<number>(readouts[0].length).fill(0);

    readouts.forEach((i) => {
      i.split("").forEach((c, x) => (oneCount[x] += c === "1" ? 1 : 0));
    });

    let gamma = "",
      epsilon = "";
    oneCount.forEach((i) => {
      if (i > readoutCount / 2) {
        gamma += "1";
        epsilon += "0";
      } else {
        gamma += "0";
        epsilon += "1";
      }
    });

    return Number.parseInt(gamma, 2) * Number.parseInt(epsilon, 2);
  }

  async Day3Problem2(data: string) {
    const readouts = data.split("\n");
    const readoutLen = readouts[0].length;

    const valueScrubber = (targetOnes: boolean) => {
      let worksheet = readouts.slice(0);

      for (let x = 0; x < readoutLen; x++) {
        let oneCount = 0;
        worksheet.forEach((i) => {
          if (i[x] === "1") oneCount++;
        });

        const keepTarget =
          oneCount >= worksheet.length / 2 === targetOnes ? "1" : "0";
        worksheet = worksheet.filter((i) => i[x] === keepTarget);
        if (worksheet.length <= 1) break;
      }

      if (worksheet.length === 0) throw new Error("No values left");
      if (worksheet.length > 1)
        throw new Error(`Too many values left ${worksheet.length}`);
      return worksheet[0];
    };

    const O2Gen = valueScrubber(true);
    const CO2Scrub = valueScrubber(false);

    return Number.parseInt(O2Gen, 2) * Number.parseInt(CO2Scrub, 2);
  }

  // Day 4
  ParseBingoData(data: string) {
    const rawBoardData = data.split("\n\n");
    const numberOrder = rawBoardData
      .shift()
      ?.split(",")
      .map((i) => Number.parseInt(i));

    if (!numberOrder) throw new Error("Could not read number order");

    const boardData = rawBoardData.map((board) => {
      return {
        data: board
          .trim()
          .split("\n")
          .map((row) => {
            return row
              .trim()
              .split(/\s+/)
              .map((space) => {
                return {
                  num: Number.parseInt(space),
                  marked: false,
                } as BingoSpace;
              });
          }),
        winner: false,
      } as BingoBoard;
    });

    return { numberOrder, boardData };
  }

  CallBingoNumber(boardData: BingoBoard[], z: number) {
    for (const board of boardData) {
      for (const row of board.data) {
        for (const cell of row) {
          if (cell.num === z) cell.marked = true;
        }
      }

      for (let x = 0; x < 5; x++) {
        let horizStreak = 0,
          vertStreak = 0;
        for (let y = 0; y < 5; y++) {
          if (board.data[x][y].marked) horizStreak++;
          if (board.data[y][x].marked) vertStreak++;
        }

        if (horizStreak === 5 || vertStreak === 5) board.winner = true;
      }
    }
  }

  ScoreBingoBoard(board: BingoBoard) {
    let retval = 0;
    for (const row of board.data) {
      for (const cell of row) {
        if (!cell.marked) retval += cell.num;
      }
    }
    return retval;
  }

  async Day4Problem1(data: string) {
    const { numberOrder, boardData } = this.ParseBingoData(data);

    for (const z of numberOrder) {
      this.CallBingoNumber(boardData, z);
      for (const board of boardData)
        if (board.winner) return this.ScoreBingoBoard(board) * z;
    }

    return 0;
  }

  async Day4Problem2(data: string) {
    const { numberOrder, boardData } = this.ParseBingoData(data);
    let curBoardData = boardData.slice();

    for (const z of numberOrder) {
      this.CallBingoNumber(curBoardData, z);

      if (curBoardData.length > 1)
        curBoardData = curBoardData.filter((i) => !i.winner);
      if (curBoardData.length === 0) throw new Error("No cards left");
      else if (curBoardData.length === 1 && curBoardData[0].winner)
        return this.ScoreBingoBoard(curBoardData[0]) * z;
    }

    return 0;
  }

  // Day 5
  async Day5Problem1(data: string) {
    const readouts = data
      .trim()
      .split("\n")
      .map((i) =>
        /(\d+),(\d+) -> (\d+),(\d+)/g
          .exec(i)
          ?.slice(1)
          .map((i) => Number.parseInt(i))
      ) as number[][];
    const outData: Record<string, number> = {};

    for (const [x1, y1, x2, y2] of readouts) {
      if (x1 === x2) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
          if (!outData[`${x1},${y}`]) outData[`${x1},${y}`] = 1;
          else outData[`${x1},${y}`]++;
        }
      } else if (y1 === y2) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          if (!outData[`${x},${y1}`]) outData[`${x},${y1}`] = 1;
          else outData[`${x},${y1}`]++;
        }
      } else {
        continue;
      }
    }

    return Object.values(outData).filter((i) => i >= 2).length;
  }

  async Day5Problem2(data: string) {
    const readouts = data
      .trim()
      .split("\n")
      .map((i) =>
        /(\d+),(\d+) -> (\d+),(\d+)/g
          .exec(i)
          ?.slice(1)
          .map((i) => Number.parseInt(i))
      ) as number[][];
    const outData: Record<string, number> = {};

    for (const [x1, y1, x2, y2] of readouts) {
      if (x1 === x2) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
          if (!outData[`${x1},${y}`]) outData[`${x1},${y}`] = 1;
          else outData[`${x1},${y}`]++;
        }
      } else if (y1 === y2) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          if (!outData[`${x},${y1}`]) outData[`${x},${y1}`] = 1;
          else outData[`${x},${y1}`]++;
        }
      } else {
        const xmult = x1 > x2 ? -1 : 1,
          ymult = y1 > y2 ? -1 : 1;
        for (let z = 0; z <= Math.abs(x1 - x2); z++) {
          if (!outData[`${x1 + z * xmult},${y1 + z * ymult}`])
            outData[`${x1 + z * xmult},${y1 + z * ymult}`] = 1;
          else outData[`${x1 + z * xmult},${y1 + z * ymult}`]++;
        }
      }
    }

    return Object.values(outData).filter((i) => i >= 2).length;
  }

  // Day 6
  FishSimulator(data: string, days: number) {
    const fishCounts = new Array<number>(9).fill(0);

    data
      .trim()
      .split(",")
      .map((i) => Number.parseInt(i))
      .forEach((i) => fishCounts[i]++);

    for (let x = 0; x < days; x++) {
      const zeroFish = fishCounts.shift();
      if (zeroFish === undefined) throw new Error("zeroFish undefined");
      fishCounts[6] += zeroFish;
      fishCounts.push(zeroFish);
    }

    return fishCounts.reduce((r, i) => r + i);
  }

  async Day6Problem1(data: string) {
    return this.FishSimulator(data, 80);
  }

  async Day6Problem2(data: string) {
    return this.FishSimulator(data, 256);
  }

  // Day 7
  async Day7Problem1(data: string) {
    const positions = data
      .trim()
      .split(",")
      .map((i) => Number.parseInt(i));
    const max = Math.max(...positions),
      min = Math.min(...positions);

    let lowPos = min,
      lowConsumption = Number.POSITIVE_INFINITY;
    for (let x = min; x <= max; x++) {
      const consumption = positions.reduce((r, i) => r + Math.abs(i - x), 0);
      if (consumption < lowConsumption) {
        lowPos = x;
        lowConsumption = consumption;
      }
    }

    console.debug("Position with lowest consumption value:", lowPos);
    return lowConsumption;
  }

  async Day7Problem2(data: string) {
    const positions = data
      .trim()
      .split(",")
      .map((i) => Number.parseInt(i));
    const max = Math.max(...positions),
      min = Math.min(...positions);

    let lowPos = min,
      lowConsumption = Number.POSITIVE_INFINITY;
    for (let x = min; x <= max; x++) {
      const consumption = positions.reduce((r, i) => {
        const diff = Math.abs(i - x);
        let triangle = 0;
        for (let y = 1; y <= diff; y++) triangle += y;
        return r + triangle;
      }, 0);
      if (consumption < lowConsumption) {
        lowPos = x;
        lowConsumption = consumption;
      }
    }

    console.debug("Position with lowest consumption value:", lowPos);
    return lowConsumption;
  }

  // Day 8
  Parse7Sline(line: string) {
    const lineTokens = line.split(" ");
    const SortLetters = (i: string) =>
      i
        .split("")
        .sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
        .join("");
    return {
      digits: lineTokens.slice(0, 10).map(SortLetters),
      display: lineTokens.slice(11).map(SortLetters),
    };
  }

  async Day8Problem1(data: string) {
    const lines = data
      .trim()
      .split("\n")
      .map((i) => this.Parse7Sline(i));

    const uniqueLengths = [2, 3, 4, 7];
    let uniqueCount = 0;
    for (const line of lines) {
      uniqueCount += line.display.filter((i) =>
        uniqueLengths.includes(i.length)
      ).length;
    }

    return uniqueCount;
  }

  async Day8Problem2(data: string) {
    const lines = data
      .trim()
      .split("\n")
      .map((i) => this.Parse7Sline(i));

    const UniqueSegments = (haystack: string, ...straws: string[]) => {
      let stackSegs = haystack.split("");
      for (const straw of straws) {
        const strawSegs = straw.split("");
        stackSegs = stackSegs.filter((i) => !strawSegs.includes(i));
      }
      return stackSegs.join("");
    };
    const ContainsAllOf = (haystack: string, ...needles: string[]) => {
      const stackSegs = haystack.split("");
      for (const needle of needles) {
        if (needle.split("").filter((i) => !stackSegs.includes(i)).length > 0)
          return false;
      }
      return true;
    };

    let total = 0;
    for (const line of lines) {
      const refArray = new Array<string>(10).fill("");
      let workingLine = line.digits.slice();

      workingLine.forEach((i) => {
        switch (i.length) {
          case 2:
            refArray[1] = i;
            break;
          case 3:
            refArray[7] = i;
            break;
          case 4:
            refArray[4] = i;
            break;
          case 7:
            refArray[8] = i;
            break;
        }
      });
      workingLine = workingLine.filter((i) => !refArray.includes(i));

      const topLine = UniqueSegments(refArray[7], refArray[1]);
      const fourLines = UniqueSegments(refArray[4], refArray[1]);

      refArray[9] = workingLine.filter(
        (i) =>
          i.length === 6 && ContainsAllOf(i, topLine, fourLines, refArray[1])
      )[0];
      const bottomLine = UniqueSegments(refArray[9], refArray[7], refArray[4]);
      refArray[3] = workingLine.filter(
        (i) =>
          i.length === 5 && ContainsAllOf(i, topLine, bottomLine, refArray[1])
      )[0];
      workingLine = workingLine.filter((i) => !refArray.includes(i));

      refArray[5] = workingLine.filter(
        (i) => i.length === 5 && ContainsAllOf(refArray[9], i)
      )[0];
      refArray[0] = workingLine.filter(
        (i) =>
          i.length === 6 && ContainsAllOf(i, topLine, bottomLine, refArray[1])
      )[0];
      workingLine = workingLine.filter((i) => !refArray.includes(i));

      refArray[6] = workingLine.filter((i) => i.length === 6)[0];
      refArray[2] = workingLine.filter((i) => i.length === 5)[0];

      total += Number.parseInt(
        line.display.map((i) => refArray.indexOf(i)).join("")
      );
    }

    return total;
  }

  // Day 9
  async Day9Problem1(data: string) {
    const map = data
      .trim()
      .split("\n")
      .map((i) => i.split("").map((ii) => Number.parseInt(ii)));

    let retval = 0;
    for (let y = 0; y < map.length; y++)
      for (let x = 0; x < map[y].length; x++) {
        const here = map[y][x];
        if (y > 0 && map[y - 1][x] <= here) continue;
        if (y + 1 < map.length && map[y + 1][x] <= here) continue;
        if (x > 0 && map[y][x - 1] <= here) continue;
        if (x + 1 < map[y].length && map[y][x + 1] <= here) continue;
        retval += here + 1;
      }

    return retval;
  }

  async Day9Problem2(data: string) {
    interface mapData {
      depth: number;
      basin?: number;
    }

    const map = data
      .trim()
      .split("\n")
      .map((i) =>
        i.split("").map((ii) => {
          return { depth: Number.parseInt(ii) } as mapData;
        })
      );
    const basinSizes: number[] = [];

    for (let y = 0; y < map.length; y++)
      for (let x = 0; x < map[y].length; x++) {
        const here = map[y][x].depth;
        if (y > 0 && map[y - 1][x].depth <= here) continue;
        if (y + 1 < map.length && map[y + 1][x].depth <= here) continue;
        if (x > 0 && map[y][x - 1].depth <= here) continue;
        if (x + 1 < map[y].length && map[y][x + 1].depth <= here) continue;
        map[y][x].basin = basinSizes.length;
        basinSizes.push(1);
      }

    let changes = true;
    while (changes) {
      changes = false;
      for (let y = 0; y < map.length; y++)
        for (let x = 0; x < map[y].length; x++) {
          const here = map[y][x];
          if (here.depth === 9 || here.basin !== undefined) continue;

          const AssignBasin = (y: number, x: number) => {
            const there = map[y][x];
            if (there.basin === undefined)
              throw new Error("Trying to assign undefined basin");
            here.basin = there.basin;
            basinSizes[here.basin]++;
            changes = true;
          };

          if (y > 0 && map[y - 1][x].basin !== undefined) {
            AssignBasin(y - 1, x);
            continue;
          }
          if (y + 1 < map.length && map[y + 1][x].basin !== undefined) {
            AssignBasin(y + 1, x);
            continue;
          }
          if (x > 0 && map[y][x - 1].basin !== undefined) {
            AssignBasin(y, x - 1);
            continue;
          }
          if (x + 1 < map[y].length && map[y][x + 1].basin !== undefined) {
            AssignBasin(y, x + 1);
            continue;
          }
        }
    }

    return basinSizes
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((r, i) => r * i);
  }

  // Day 10
  async Day10Problem1(data: string) {
    const lines = data.trim().split("\n");

    enum Bracket {
      Paren,
      Square,
      Curly,
      Angle,
    }

    const scoreValues: Record<number, number> = {
      [Bracket.Paren]: 3,
      [Bracket.Square]: 57,
      [Bracket.Curly]: 1197,
      [Bracket.Angle]: 25137,
    };

    const opens = ["(", "[", "{", "<"],
      closes = [")", "]", "}", ">"];

    const ScoreLine = (line: string): number => {
      const stack: Bracket[] = [];
      for (const char of line.split("")) {
        if (opens.includes(char)) {
          stack.push(opens.indexOf(char) as Bracket);
        } else if (closes.includes(char)) {
          const bracket = closes.indexOf(char) as Bracket;
          if (stack.pop() !== bracket) return scoreValues[bracket];
        }
      }
      return 0;
    };

    return lines.map(ScoreLine).reduce((r, i) => r + i);
  }

  async Day10Problem2(data: string) {
    const lines = data.trim().split("\n");

    enum Bracket {
      Paren,
      Square,
      Curly,
      Angle,
    }

    const opens = ["(", "[", "{", "<"],
      closes = [")", "]", "}", ">"];

    const FillAndScoreLine = (line: string): number | null => {
      const stack: Bracket[] = [];
      for (const char of line.split("")) {
        if (opens.includes(char)) {
          stack.push(opens.indexOf(char) as Bracket);
        } else if (closes.includes(char)) {
          const bracket = closes.indexOf(char) as Bracket;
          if (stack.pop() !== bracket) return null;
        }
      }
      return stack.reverse().reduce((r, i) => r * 5 + i + 1, 0);
    };

    const result = (
      lines.map(FillAndScoreLine).filter((i) => i !== null) as number[]
    ).sort((a, b) => a - b);
    return result[Math.floor(result.length / 2)];
  }

  // Day 11
  OctopusCycle(map: Octocell[][]) {
    let retval = 0;
    for (const row of map) for (const cell of row) cell.energy++;

    let anyChanged = false;
    do {
      anyChanged = false;

      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++)
          if (map[y][x].energy > 9 && !map[y][x].flash) {
            map[y][x].flash = true;
            anyChanged = true;
            for (let dy = -1; dy <= 1; dy++) {
              if (y + dy < 0 || y + dy >= map.length) continue;
              for (let dx = -1; dx <= 1; dx++) {
                if (
                  x + dx < 0 ||
                  x + dx >= map[y].length ||
                  (dx === 0 && dy === 0)
                )
                  continue;
                map[y + dy][x + dx].energy++;
              }
            }
          }
      }
    } while (anyChanged);

    for (const row of map)
      for (const cell of row)
        if (cell.flash) {
          cell.energy = 0;
          cell.flash = false;
          retval++;
        }
    return retval;
  }

  async Day11Problem1(data: string) {
    const map = data
      .trim()
      .split("\n")
      .map((i) =>
        i.split("").map((ii) => {
          return { energy: Number.parseInt(ii), flash: false } as Octocell;
        })
      );

    let retval = 0;

    for (let z = 0; z < 100; z++) retval += this.OctopusCycle(map);

    return retval;
  }

  async Day11Problem2(data: string) {
    const map = data
      .trim()
      .split("\n")
      .map((i) =>
        i.split("").map((ii) => {
          return { energy: Number.parseInt(ii), flash: false } as Octocell;
        })
      );

    const flashTarget = map.reduce((r, i) => r + i.length, 0);
    let cycles = 0;

    do {
      cycles++;
    } while (this.OctopusCycle(map) < flashTarget);

    return cycles;
  }

  // Day 12
  GenerateCaveSystem(data: string) {
    const connections = data
      .trim()
      .split("\n")
      .map((i) => i.split("-"));

    const nodes: Record<string, CaveNode> = {
      start: { name: "start", big: false, smallJoins: [], bigJoins: [] },
      end: {
        name: "end",
        big: false,
        isEnd: true,
        smallJoins: [],
        bigJoins: [],
      },
    };

    for (const cave of new Set(
      connections
        .reduce((r: string[], i: string[]) => r.concat(...i), [])
        .filter((i) => !["start", "end"].includes(i))
        .sort((a, b) => a.localeCompare(b))
    )) {
      nodes[cave] = {
        name: cave,
        big: /^[A-Z]+$/.test(cave),
        smallJoins: [],
        bigJoins: [],
      };
    }

    for (const connection of connections) {
      if (nodes[connection[0]].big)
        nodes[connection[1]].bigJoins.push(connection[0]);
      else nodes[connection[1]].smallJoins.push(connection[0]);
      if (nodes[connection[1]].big)
        nodes[connection[0]].bigJoins.push(connection[1]);
      else nodes[connection[0]].smallJoins.push(connection[1]);
    }
    for (const node of Object.values(nodes))
      node.smallJoins = node.smallJoins
        .filter((i) => i !== "start")
        .sort((a, b) => a.localeCompare(b));

    return nodes;
  }

  FindPath(
    paths: string[][],
    nodes: Record<string, CaveNode>,
    node: CaveNode,
    curPath: string[],
    smallCavesVisited: string[],
    doublerUsed: boolean
  ) {
    //console.debug('Scanning at:', node.name);
    if (node.isEnd) {
      paths.push(curPath);
      return;
    }
    for (const bigJoin of node.bigJoins)
      this.FindPath(
        paths,
        nodes,
        nodes[bigJoin],
        curPath.concat(bigJoin),
        smallCavesVisited,
        doublerUsed
      );
    const usableSmallJoins = node.smallJoins.filter(
      (i) => !doublerUsed || !smallCavesVisited.includes(i)
    );
    for (const smallJoin of usableSmallJoins)
      this.FindPath(
        paths,
        nodes,
        nodes[smallJoin],
        curPath.concat(smallJoin),
        smallCavesVisited.concat(smallJoin),
        doublerUsed || smallCavesVisited.includes(smallJoin)
      );
  }

  Day12(data: string, startingDoubler: boolean) {
    const nodes = this.GenerateCaveSystem(data);
    const paths: string[][] = [];

    this.FindPath(paths, nodes, nodes.start, ["start"], [], startingDoubler);

    return paths.length;
  }

  async Day12Problem1(data: string) {
    return this.Day12(data, true);
  }

  async Day12Problem2(data: string) {
    return this.Day12(data, false);
  }
}
