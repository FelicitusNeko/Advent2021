import {
  // createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { get as httpsGet } from "https";
import { join as pathJoin } from "path";
import {
  ALS /*, ALSInstructionType, ALSProgramState*/,
  ALSProgramState,
} from "./ALS";
import BITSReader, {
  BITSLiteralPacket,
  BITSOperatorPacket,
  BITSPacket,
  BITSPacketType,
} from "./BITSReader";

const useTestData = false;
const testData = `inp z
inp x
mul z 3
eql z x`;

// Day 4
interface BingoBoard {
  data: BingoSpace[][];
  winner: boolean;
}
interface BingoSpace {
  num: number;
  marked: boolean;
}

// Day 11
interface Octocell {
  energy: number;
  flash: boolean;
}

// Day 12
interface CaveNode {
  name: string;
  big: boolean;
  isEnd?: boolean;
  smallJoins: string[];
  bigJoins: string[];
}

// Day 13
interface Position2D {
  x: number;
  y: number;
}
interface FoldInstruction {
  direction: string;
  position: number;
}

// Day 18
type ParsedEntity = number | [ParsedEntity, ParsedEntity];
interface SnailfishNumber {
  value: number;
  pairMember: string[];
}

// Day 19
interface Position3D {
  x: number;
  y: number;
  z: number;
}
interface Beacon {
  pos: Position3D;
  relBeaconDistance: number[][];
}

// Day 22
type Range = [number, number];
interface BootCubeV3 {
  state: boolean;
  rangeX: Range;
  rangeY: Range;
  rangeZ: Range;
}

// General utility
const getInput = (year: number, day: number) => {
  if (useTestData && testData !== null) return Promise.resolve(testData);
  if (!existsSync("cache")) mkdirSync("cache");
  const cachePath = pathJoin("cache", year.toString());
  if (!existsSync(cachePath)) mkdirSync(cachePath);
  const cacheFile = pathJoin(cachePath, `${day}.txt`);
  if (existsSync(cacheFile))
    return Promise.resolve(readFileSync(cacheFile).toString());

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
        res.on("close", () => {
          writeFileSync(cacheFile, data);
          f(data);
        });
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
      [this.Day13Problem1, this.Day13Problem2],
      [this.Day14Problem1, this.Day14Problem2],
      [this.Dummy, this.Dummy],
      [this.Day16Problem1, this.Day16Problem2],
      [this.Day17Problem1, this.Day17Problem2],
      [this.Day18Problem1, this.Day18Problem2],
      [this.Day19Problem1, this.Day19Problem2],
      [this.Day20Problem1, this.Day20Problem2],
      [this.Day21Problem1, this.Day21Problem2],
      [this.Day22Problem1, this.Day22Problem2],
      [this.Day23Problem1, this.Dummy],
      [this.Day24Problem1, this.Day24Problem2],
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

  // Day 13
  ParseSheetAndFolds(data: string): [Position2D[], FoldInstruction[]] {
    const baseData = data.trim().split(/\n{2}/);
    const coords = baseData[0]
      .trim()
      .split(/\n/)
      .map((i) => i.split(","))
      .map((i) => {
        return {
          x: Number.parseInt(i[0]),
          y: Number.parseInt(i[1]),
        } as Position2D;
      });
    const folds = baseData[1]
      .trim()
      .split(/\n/)
      .map((i) => {
        const foldRegex = /fold along ([xy])=(\d+)/.exec(i);
        if (!foldRegex)
          throw new Error(`Parsing error on fold instruction: ${i}`);
        return {
          direction: foldRegex[1],
          position: Number.parseInt(foldRegex[2]),
        } as FoldInstruction;
      });

    return [coords, folds];
  }

  FoldPaper(
    startingSheet: Position2D[],
    folds: FoldInstruction[],
    iterations?: number
  ) {
    const workingSheet = startingSheet.map((i) => {
      return { x: i.x, y: i.y } as Position2D;
    });

    for (
      let x = 0;
      x < (iterations === undefined ? folds.length : iterations);
      x++
    ) {
      const fold = folds[x];
      for (const pos of workingSheet) {
        const chkPos = fold.direction === "x" ? pos.x : pos.y;
        if (chkPos > fold.position) {
          const deltaPos = (chkPos - fold.position) * 2;
          if (fold.direction === "x") pos.x -= deltaPos;
          else pos.y -= deltaPos;
        }
      }
    }

    return workingSheet;
  }

  LayoutFoldedSheet(endingSheet: Position2D[]): boolean[][] {
    const width = Math.max(...endingSheet.map((i) => i.x)) + 1;
    const height = Math.max(...endingSheet.map((i) => i.y)) + 1;
    //console.debug('Creating array with dimensions:', width, height)
    const retval: boolean[][] = [];
    for (let y = 0; y < height; y++) retval.push(Array(width).fill(false));
    //console.debug('Height of new array:', retval.length);
    //console.debug('Width of new array:', retval[0].length);

    for (const pos of endingSheet) {
      //console.debug('Setting position', pos.y, pos.x, 'to true')
      retval[pos.y][pos.x] = true;
    }

    return retval;
  }

  async Day13Problem1(data: string) {
    const [coords, folds] = this.ParseSheetAndFolds(data);
    const foldedPaper = this.FoldPaper(coords, folds, 1);
    //console.debug(foldedPaper);
    const paperLayout = this.LayoutFoldedSheet(foldedPaper);
    //console.debug(paperLayout.map(i => i.map(ii => ii ? '#' : '.').join('')).join('\n'));

    return paperLayout.reduce(
      (r, i) => r + i.reduce((rr, ii) => rr + (ii ? 1 : 0), 0),
      0
    );
  }

  async Day13Problem2(data: string) {
    const [coords, folds] = this.ParseSheetAndFolds(data);
    const foldedPaper = this.FoldPaper(coords, folds);
    const paperLayout = this.LayoutFoldedSheet(foldedPaper);

    return (
      "\n" +
      paperLayout
        .map((i) => i.map((ii) => (ii ? "#" : ".")).join(""))
        .join("\n")
    );
  }

  // Day 14
  JoinPolymersV2(
    startingString: string,
    pairs: Record<string, string>,
    steps: number
  ) {
    let pairCount: Record<string, number> = {};
    for (const pair of Object.keys(pairs)) pairCount[pair] = 0;

    for (let x = 0; x < startingString.length - 1; x++) {
      const pair = startingString.substring(x, x + 2);
      pairCount[pair]++;
    }

    for (let x = 0; x < steps; x++) {
      const newPairCount: Record<string, number> = {};
      for (const pair of Object.keys(pairs)) newPairCount[pair] = 0;

      for (const [pair, count] of Object.entries(pairCount)) {
        if (count === 0) continue;

        for (const newPair of [pair[0] + pairs[pair], pairs[pair] + pair[1]])
          newPairCount[newPair] += count;
      }
      pairCount = newPairCount;
    }

    const retval: Record<string, number> = { [startingString[0]]: 1 };
    for (const [pair, count] of Object.entries(pairCount)) {
      const polymerToCount = pair[1];
      if (!retval[polymerToCount]) retval[polymerToCount] = count;
      else retval[polymerToCount] += count;
    }

    return retval;
  }

  Day14(data: string, steps: number) {
    const baseData = data.trim().split(/\n{2}/);
    const pairs: Record<string, string> = {};
    baseData[1]
      .trim()
      .split(/\n/)
      .forEach((i) => {
        const arrowSplit = i.split(" -> ");
        pairs[arrowSplit[0]] = arrowSplit[1];
      });

    const polymerCount = this.JoinPolymersV2(baseData[0], pairs, steps);
    const polymerEntries = Object.entries(polymerCount).sort(
      (a, b) => a[1] - b[1]
    );
    const topPoly = polymerEntries.pop();
    const bottomPoly = polymerEntries.shift();
    if (!topPoly || !bottomPoly)
      throw new Error("Undefined top/bottom polymer");

    return topPoly[1] - bottomPoly[1];
  }

  async Day14Problem1(data: string) {
    return this.Day14(data, 10);
  }

  async Day14Problem2(data: string) {
    return this.Day14(data, 40);
  }

  // Day 15 (skipped)
  async Day15Problem1(data: string) {
    const map = data
      .trim()
      .split("\n")
      .map((i) => i.split("").map((ii) => Number.parseInt(ii)));

    const riskTotal: number[][] = [];
    for (let y = 0; y < map.length; y++)
      riskTotal.push(Array(map[y].length).fill(-1));

    map[0][0] = riskTotal[0][0] = 0;
    const maxIteraton = map.length + map[0].length;
    for (let z = 1; z < maxIteraton; z++) {
      for (let x = 0; x <= z; x++) {
        const y = z - x;
        if (x >= map[0].length || y >= map.length) continue;
        const goDown = y === 0 ? Infinity : riskTotal[y - 1][x] + map[y][x];
        const goRight = x === 0 ? Infinity : riskTotal[y][x - 1] + map[y][x];
        riskTotal[y][x] = Math.min(goDown, goRight);
      }
    }

    return riskTotal[map.length - 1][map[0].length - 1];
    // Incorrect: 404 (too high)
  }

  // Day 16
  async Day16Problem1(data: string) {
    const bitsReader = new BITSReader(data.trim());
    const packets: BITSPacket[] = [];
    let nextPacket = bitsReader.readNextPacket();
    while (nextPacket) {
      packets.push(nextPacket);
      nextPacket = bitsReader.readNextPacket();
    }

    const GetPacketVersion = (acc: number, packet: BITSPacket): number => {
      let retval = packet.version;
      if (packet.packetType !== BITSPacketType.Literal)
        retval += (packet as BITSOperatorPacket).subpackets.reduce(
          GetPacketVersion,
          0
        );
      return retval + acc;
    };
    return packets.reduce(GetPacketVersion, 0);
  }

  async Day16Problem2(data: string) {
    const bitsReader = new BITSReader(data.trim());
    const packets: BITSPacket[] = [];
    let nextPacket = bitsReader.readNextPacket();
    while (nextPacket) {
      packets.push(nextPacket);
      nextPacket = bitsReader.readNextPacket();
    }

    const CalculatePackets = (packet: BITSPacket): number => {
      if (packet.packetType === BITSPacketType.Literal)
        return (packet as BITSLiteralPacket).value;
      else {
        const opPacket = packet as BITSOperatorPacket;
        const data = opPacket.subpackets.map(CalculatePackets);
        switch (packet.packetType) {
          case BITSPacketType.AddOp:
            return data.reduce((r, i) => r + i);
          case BITSPacketType.MultOp:
            return data.reduce((r, i) => r * i);
          case BITSPacketType.MinOp:
            return Math.min(...data);
          case BITSPacketType.MaxOp:
            return Math.max(...data);
          case BITSPacketType.GTOp:
            return data[0] > data[1] ? 1 : 0;
          case BITSPacketType.LTOp:
            return data[0] < data[1] ? 1 : 0;
          case BITSPacketType.EqOp:
            return data[0] === data[1] ? 1 : 0;
        }
      }
    };
    return packets.map(CalculatePackets).reduce((r, i) => r + i);
  }

  // Day 17
  async Day17Problem1(data: string) {
    const match =
      /target area: x=(-?\d+)\.\.(-?\d+), y=(-?\d+)\.\.(-?\d+)/.exec(data);
    if (!match) throw new Error("Invalid input data");
    const [y1, y2] = match.slice(3).map((i) => Number.parseInt(i));

    const bottomEdge = Math.min(y1, y2);
    let retval = 0;
    for (let y = 0; y < Math.abs(bottomEdge); y++) retval += y;
    return retval;
  }

  async Day17Problem2(data: string) {
    const match =
      /target area: x=(-?\d+)\.\.(-?\d+), y=(-?\d+)\.\.(-?\d+)/.exec(data);
    if (!match) throw new Error("Invalid input data");
    const [x1, x2, y1, y2] = match.slice(1).map((i) => Number.parseInt(i));

    const xValid: Record<number, number[]> = {};
    const xRemainsValid: Record<number, number[]> = {};
    const yValid: Record<number, number[]> = {};

    const leftEdge = Math.min(x1, x2);
    const rightEdge = Math.max(x1, x2);
    const bottomEdge = Math.min(y1, y2);
    const topEdge = Math.max(y1, y2);

    const xmin = (() => {
      let count = 0;
      for (let x = 1; count < rightEdge; x++) {
        count += x;
        if (count >= leftEdge) return x;
      }
      throw new Error("No valid minimum X vel found");
    })();

    for (let xStartVel = xmin; xStartVel <= rightEdge; xStartVel++) {
      let xPos = xStartVel;
      for (let step = 1; step <= xStartVel && xPos <= rightEdge; step++) {
        if (xPos >= leftEdge && xPos <= rightEdge) {
          if (step + 1 === xStartVel) {
            if (!xRemainsValid[step]) xRemainsValid[step] = [xStartVel];
            else xRemainsValid[step].push(xStartVel);
            break;
          } else {
            if (!xValid[step]) xValid[step] = [xStartVel];
            else xValid[step].push(xStartVel);
          }
        }
        xPos += xStartVel - step;
      }
    }

    for (
      let yStartVel = bottomEdge;
      yStartVel <= Math.abs(bottomEdge);
      yStartVel++
    ) {
      let yPos = yStartVel;
      for (let step = 1; yPos >= bottomEdge; step++) {
        if (yPos >= bottomEdge && yPos <= topEdge) {
          if (!yValid[step]) yValid[step] = [yStartVel];
          else yValid[step].push(yStartVel);
        }
        yPos += yStartVel - step;
      }
    }

    const maxStep = Math.max(
      ...Object.keys(xValid)
        .concat(Object.keys(xRemainsValid))
        .concat(Object.keys(yValid))
        .map((i) => Number.parseInt(i))
    );

    const xCarryover: number[] = [];
    const validVels: [number, number][] = [];

    for (let x = 1; x <= maxStep; x++) {
      if (xRemainsValid[x]) xCarryover.push(...xRemainsValid[x]);
      if (xCarryover.length > 0) console.debug(x, xCarryover);
      if ((!xValid[x] && xCarryover.length === 0) || !yValid[x]) continue;

      for (const xvel of xCarryover.concat(xValid[x] ?? []))
        for (const yvel of yValid[x]) validVels.push([xvel, yvel]);
    }

    const retval = new Set(
      validVels
        .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]))
        .map((i) => `${i[0]},${i[1]}`)
    );

    return [...retval].length;
  }

  // Day 18
  ParseToSnailfish(parsedLine: ParsedEntity) {
    const retval: SnailfishNumber[] = [];
    const InnerParseToSnailfish = (
      data: ParsedEntity,
      curDepth: string[] = []
    ) => {
      if (!Array.isArray(data))
        throw new Error("Tried to call ParseToSnailfish on non-array element");
      const lr = [["l"], ["r"]];
      for (const x in lr) {
        if (Array.isArray(data[x]))
          InnerParseToSnailfish(data[x], lr[x].concat(curDepth));
        else
          retval.push({
            value: data[x] as number,
            pairMember: lr[x].concat(curDepth),
          });
      }
    };
    InnerParseToSnailfish(parsedLine);
    return retval;
  }

  ProcessSnailfishLine(process: SnailfishNumber[]) {
    let done = false;
    while (!done) {
      done = true;
      for (const x in process) {
        const nx = Number.parseInt(x);
        const element = process[nx];
        if (element.pairMember.length >= 5) {
          console.assert(
            element.pairMember[0] === "l",
            "Exploding element detected not the left side",
            element
          );
          const explosion = process.splice(nx, 2, {
            value: 0,
            pairMember: element.pairMember.slice(1),
          });
          if (nx > 0) process[nx - 1].value += explosion[0].value;
          if (nx < process.length - 1)
            process[nx + 1].value += explosion[1].value;

          done = false;
          break;
        }
      }
      if (!done) continue;

      for (const x in process) {
        const nx = Number.parseInt(x);
        const element = process[nx];

        if (element.value >= 10) {
          process.splice(
            nx,
            1,
            {
              value: Math.floor(element.value / 2),
              pairMember: ["l"].concat(element.pairMember.slice()),
            },
            {
              value: Math.ceil(element.value / 2),
              pairMember: ["r"].concat(element.pairMember.slice()),
            }
          );
          console.assert(
            process[nx].value + process[nx + 1].value === element.value,
            "Result of split not equal to original element"
          );
          console.assert(
            process[nx].pairMember[0] === "l",
            "Left value of split not indicated as left value"
          );

          done = false;
          break;
        }
      }
    }
    return process;
  }

  OutputSnailfishAsString(line: SnailfishNumber[]) {
    let retval = "";
    let lastLevel = 0;
    for (const element of line) {
      for (; lastLevel < element.pairMember.length; lastLevel++) retval += "[";
      retval += element.value;
      for (const scanRight of element.pairMember)
        if (scanRight === "r") {
          lastLevel--;
          retval += "]";
        } else {
          retval += ",";
          break;
        }
    }
    while (0 < lastLevel--) retval += "]";
    return retval;
  }

  ReduceSnailfish(data: [ParsedEntity, ParsedEntity]): number {
    return (
      (typeof data[0] === "number" ? data[0] : this.ReduceSnailfish(data[0])) *
        3 +
      (typeof data[1] === "number" ? data[1] : this.ReduceSnailfish(data[1])) *
        2
    );
  }

  async Day18Problem1(data: string) {
    const parsedLines: ParsedEntity[] = data
      .trim()
      .split(/\n/)
      .map((i) => JSON.parse(i));
    const lines: SnailfishNumber[][] = [];

    for (const parsedLine of parsedLines)
      lines.push(this.ParseToSnailfish(parsedLine));

    const process: SnailfishNumber[] = [];
    while (lines.length > 0) {
      const firstOne = parsedLines.length === lines.length;
      const nextLine = lines.shift();
      if (nextLine === undefined) break;

      if (!firstOne) {
        for (const element of process) element.pairMember.push("l");
        for (const element of nextLine) element.pairMember.push("r");
      }

      process.push(...nextLine);
      this.ProcessSnailfishLine(process);
    }

    const sum: [ParsedEntity, ParsedEntity] = JSON.parse(
      this.OutputSnailfishAsString(process)
    );

    return this.ReduceSnailfish(sum);
  }

  async Day18Problem2(data: string) {
    const parsedLines: ParsedEntity[] = data
      .trim()
      .split(/\n/)
      .map((i) => JSON.parse(i));
    const lines: SnailfishNumber[][] = [];

    for (const parsedLine of parsedLines)
      lines.push(this.ParseToSnailfish(parsedLine));

    let retval = 0;
    for (let x = 0; x < lines.length; x++)
      for (let y = 0; y < lines.length; y++) {
        if (x === y) continue;
        const process: SnailfishNumber[] = [];
        for (const { value, pairMember } of lines[x])
          process.push({ value, pairMember: pairMember.concat(["l"]) });
        for (const { value, pairMember } of lines[y])
          process.push({ value, pairMember: pairMember.concat(["r"]) });

        this.ProcessSnailfishLine(process);

        retval = Math.max(
          retval,
          this.ReduceSnailfish(
            JSON.parse(this.OutputSnailfishAsString(process))
          )
        );
      }

    return retval;
  }

  // Day 19
  private readonly beaconTransformers: ((pos: Position3D) => Position3D)[] = [
    (pos) => pos,
    (pos) => {
      return { x: -pos.x, y: pos.y, z: pos.z };
    },
    (pos) => {
      return { x: pos.x, y: -pos.y, z: pos.z };
    },
    (pos) => {
      return { x: -pos.x, y: -pos.y, z: pos.z };
    },
    (pos) => {
      return { x: pos.x, y: pos.y, z: -pos.z };
    },
    (pos) => {
      return { x: -pos.x, y: pos.y, z: -pos.z };
    },
    (pos) => {
      return { x: pos.x, y: -pos.y, z: -pos.z };
    },
    (pos) => {
      return { x: -pos.x, y: -pos.y, z: -pos.z };
    },

    (pos) => {
      return { x: pos.y, y: pos.x, z: pos.z };
    },
    (pos) => {
      return { x: -pos.y, y: pos.x, z: pos.z };
    },
    (pos) => {
      return { x: pos.y, y: -pos.x, z: pos.z };
    },
    (pos) => {
      return { x: -pos.y, y: -pos.x, z: pos.z };
    },
    (pos) => {
      return { x: pos.y, y: pos.x, z: -pos.z };
    },
    (pos) => {
      return { x: -pos.y, y: pos.x, z: -pos.z };
    },
    (pos) => {
      return { x: pos.y, y: -pos.x, z: -pos.z };
    },
    (pos) => {
      return { x: -pos.y, y: -pos.x, z: -pos.z };
    },

    (pos) => {
      return { x: pos.z, y: pos.y, z: pos.x };
    },
    (pos) => {
      return { x: -pos.z, y: pos.y, z: pos.x };
    },
    (pos) => {
      return { x: pos.z, y: -pos.y, z: pos.x };
    },
    (pos) => {
      return { x: -pos.z, y: -pos.y, z: pos.x };
    },
    (pos) => {
      return { x: pos.z, y: pos.y, z: -pos.x };
    },
    (pos) => {
      return { x: -pos.z, y: pos.y, z: -pos.x };
    },
    (pos) => {
      return { x: pos.z, y: -pos.y, z: -pos.x };
    },
    (pos) => {
      return { x: -pos.z, y: -pos.y, z: -pos.x };
    },

    (pos) => {
      return { x: pos.x, y: pos.z, z: pos.y };
    },
    (pos) => {
      return { x: -pos.x, y: pos.z, z: pos.y };
    },
    (pos) => {
      return { x: pos.x, y: -pos.z, z: pos.y };
    },
    (pos) => {
      return { x: -pos.x, y: -pos.z, z: pos.y };
    },
    (pos) => {
      return { x: pos.x, y: pos.z, z: -pos.y };
    },
    (pos) => {
      return { x: -pos.x, y: pos.z, z: -pos.y };
    },
    (pos) => {
      return { x: pos.x, y: -pos.z, z: -pos.y };
    },
    (pos) => {
      return { x: -pos.x, y: -pos.z, z: -pos.y };
    },

    (pos) => {
      return { x: pos.y, y: pos.z, z: pos.x };
    },
    (pos) => {
      return { x: -pos.y, y: pos.z, z: pos.x };
    },
    (pos) => {
      return { x: pos.y, y: -pos.z, z: pos.x };
    },
    (pos) => {
      return { x: -pos.y, y: -pos.z, z: pos.x };
    },
    (pos) => {
      return { x: pos.y, y: pos.z, z: -pos.x };
    },
    (pos) => {
      return { x: -pos.y, y: pos.z, z: -pos.x };
    },
    (pos) => {
      return { x: pos.y, y: -pos.z, z: -pos.x };
    },
    (pos) => {
      return { x: -pos.y, y: -pos.z, z: -pos.x };
    },

    (pos) => {
      return { x: pos.z, y: pos.x, z: pos.y };
    },
    (pos) => {
      return { x: -pos.z, y: pos.x, z: pos.y };
    },
    (pos) => {
      return { x: pos.z, y: -pos.x, z: pos.y };
    },
    (pos) => {
      return { x: -pos.z, y: -pos.x, z: pos.y };
    },
    (pos) => {
      return { x: pos.z, y: pos.x, z: -pos.y };
    },
    (pos) => {
      return { x: -pos.z, y: pos.x, z: -pos.y };
    },
    (pos) => {
      return { x: pos.z, y: -pos.x, z: -pos.y };
    },
    (pos) => {
      return { x: -pos.z, y: -pos.x, z: -pos.y };
    },
  ];

  NumberWang(lhs: number[], rhs: number[]) {
    if (lhs.length !== rhs.length) return false;
    else
      for (let x = 0; x < lhs.length; x++) if (lhs[x] !== rhs[x]) return false;
    return true;
  }

  AddToBigMap(
    bigMap: Beacon[],
    pos: Position3D,
    rel: Position3D = { x: 0, y: 0, z: 0 },
    order: (pos: Position3D) => Position3D = (pos) => pos
  ) {
    const modPos = order(pos);
    const retval: Beacon = {
      pos: {
        x: modPos.x + rel.x,
        y: modPos.y + rel.y,
        z: modPos.z + rel.z,
      },
      relBeaconDistance: [],
    };

    for (const beacon of bigMap) {
      if (
        beacon.pos.x === retval.pos.x &&
        beacon.pos.y === retval.pos.y &&
        beacon.pos.z === retval.pos.z
      )
        return false;
    }

    for (const beacon of bigMap) {
      const relval = [
        Math.abs(retval.pos.x - beacon.pos.x),
        Math.abs(retval.pos.y - beacon.pos.y),
        Math.abs(retval.pos.z - beacon.pos.z),
      ].sort((a, b) => a - b);

      retval.relBeaconDistance.push(relval);
      beacon.relBeaconDistance.push(relval);
    }

    bigMap.push(retval);
    return true;
  }

  CorrelateScannerBeacons(scanner: Beacon[]) {
    for (let x = 0; x < scanner.length - 1; x++) {
      for (let y = x; y < scanner.length; y++) {
        const beaconX = scanner[x],
          beaconY = scanner[y];
        const relpos = [
          Math.abs(beaconX.pos.x - beaconY.pos.x),
          Math.abs(beaconX.pos.y - beaconY.pos.y),
          Math.abs(beaconX.pos.z - beaconY.pos.z),
        ].sort((a, b) => a - b);

        beaconX.relBeaconDistance.push(relpos);
        beaconY.relBeaconDistance.push(relpos);
      }
    }
  }

  CorrelateScanner(bigMap: Beacon[], scanner: Beacon[]) {
    const matchingPairs: [Beacon, Beacon][] = [];
    for (const beaconX of bigMap)
      for (const beaconY of scanner) {
        let posMatches = 0;
        for (const relBeaconX of beaconX.relBeaconDistance)
          for (const relBeaconY of beaconY.relBeaconDistance) {
            if (this.NumberWang(relBeaconX, relBeaconY)) {
              posMatches++;
              break;
            }
          }
        if (posMatches >= 11) {
          matchingPairs.push([beaconX, beaconY]);
        }
        if (matchingPairs.length >= 2) break;
      }

    if (matchingPairs.length >= 2) {
      const firstSet = matchingPairs.map((i) => i[0].pos);
      for (const modifier of this.beaconTransformers) {
        const secondSet = matchingPairs.map((i) => modifier(i[1].pos));
        const relPos = firstSet.map((i, x) => {
          return {
            x: i.x - secondSet[x].x,
            y: i.y - secondSet[x].y,
            z: i.z - secondSet[x].z,
          };
        });
        if (
          relPos[0].x === relPos[1].x &&
          relPos[0].y === relPos[1].y &&
          relPos[0].z === relPos[1].z
        ) {
          for (const beacon of scanner)
            this.AddToBigMap(bigMap, beacon.pos, relPos[0], modifier);

          return relPos[0];
        }
      }
    }
    return null;
  }

  async Day19Problem1(data: string) {
    const scannerData: Beacon[][] = data
      .trim()
      .split(/\n\n/)
      .map((i) =>
        i
          .split(/\n/)
          .slice(1)
          .map((ii) => {
            const [x, y, z] = ii.split(",");
            return {
              pos: {
                x: Number.parseInt(x),
                y: Number.parseInt(y),
                z: Number.parseInt(z),
              },
              relBeaconDistance: [],
            } as Beacon;
          })
      );

    const bigMap: Beacon[] = [];

    const firstScanner = scannerData.shift();
    if (!firstScanner) throw new Error("No scanners in data set");
    for (const beacon of firstScanner) this.AddToBigMap(bigMap, beacon.pos);

    for (const scanner of scannerData) this.CorrelateScannerBeacons(scanner);

    let done = false;
    let workingSet = scannerData.slice(0);
    while (!done) {
      const matchedScanners: Beacon[][] = [];
      done = true;

      for (const scanner of workingSet) {
        if (this.CorrelateScanner(bigMap, scanner)) {
          done = false;
          matchedScanners.push(scanner);
        }
      }

      workingSet = workingSet.filter((i) => !matchedScanners.includes(i));
    }
    if (workingSet.length > 0)
      throw new Error(`${workingSet.length} unmatched scanner(s)`);

    return bigMap.length;
  }

  async Day19Problem2(data: string) {
    const scannerData: Beacon[][] = data
      .trim()
      .split(/\n\n/)
      .map((i) =>
        i
          .split(/\n/)
          .slice(1)
          .map((ii) => {
            const [x, y, z] = ii.split(",");
            return {
              pos: {
                x: Number.parseInt(x),
                y: Number.parseInt(y),
                z: Number.parseInt(z),
              },
              relBeaconDistance: [],
            } as Beacon;
          })
      );

    const bigMap: Beacon[] = [];
    const scannerLocations: Position3D[] = [{ x: 0, y: 0, z: 0 }];

    const firstScanner = scannerData.shift();
    if (!firstScanner) throw new Error("No scanners in data set");
    for (const beacon of firstScanner) this.AddToBigMap(bigMap, beacon.pos);

    for (const scanner of scannerData) this.CorrelateScannerBeacons(scanner);

    let done = false;
    let workingSet = scannerData.slice(0);
    while (!done) {
      const matchedScanners: Beacon[][] = [];
      done = true;

      for (const scanner of workingSet) {
        const relPos = this.CorrelateScanner(bigMap, scanner);
        if (relPos) {
          done = false;
          scannerLocations.push(relPos);
          matchedScanners.push(scanner);
        }
      }

      workingSet = workingSet.filter((i) => !matchedScanners.includes(i));
    }
    if (workingSet.length > 0)
      throw new Error(`${workingSet.length} unmatched scanner(s)`);

    let longestManhattan = 0;
    for (let x = 0; x < scannerLocations.length - 1; x++)
      for (let y = x; y < scannerLocations.length; y++) {
        const scannerX = scannerLocations[x],
          scannerY = scannerLocations[y];
        longestManhattan = Math.max(
          longestManhattan,
          Math.abs(scannerX.x - scannerY.x) +
            Math.abs(scannerX.y - scannerY.y) +
            Math.abs(scannerX.z - scannerY.z)
        );
      }

    return longestManhattan;
  }

  // Day 20
  ZoomAndEnhance(
    enhanceData: boolean[],
    map: boolean[][],
    outside: boolean
  ): [boolean[][], boolean] {
    const retval: boolean[][] = [];
    for (let y = 0; y < map.length + 2; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < map[0].length + 2; x++) row.push(false);
      retval.push(row);
    }

    for (let y = 0; y < retval.length; y++)
      for (let x = 0; x < retval[0].length; x++) {
        let refPoint = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            refPoint <<= 1;
            if (
              y + dy > 0 &&
              x + dx > 0 &&
              y - 1 + dy < map.length &&
              x - 1 + dx < map[0].length
            ) {
              if (map[y - 1 + dy][x - 1 + dx]) refPoint |= 1;
            } else refPoint |= outside ? 1 : 0;
          }
        console.assert(
          refPoint < enhanceData.length,
          "Reference point out of bounds (was %d, max %d)",
          refPoint,
          enhanceData.length
        );
        retval[y][x] = enhanceData[refPoint];
      }

    //console.debug(retval);
    return [retval, enhanceData[0] !== outside];
  }

  Day20(data: string, iterations: number) {
    const baseData = data.trim().split(/\n\n/);
    const enhanceData = baseData[0].split("").map((i) => i === "#");
    const startingMap = baseData[1]
      .split(/\n/)
      .map((i) => i.split("").map((i) => i === "#"));

    let workingMap = startingMap,
      outside = false;
    for (let x = 1; x <= iterations; x++) {
      [workingMap, outside] = this.ZoomAndEnhance(
        enhanceData,
        workingMap,
        outside
      );
      console.assert(
        workingMap.length === startingMap.length + x * 2,
        "Incorrect working map height"
      );
      console.assert(
        workingMap[0].length === startingMap[0].length + x * 2,
        "Incorrect working map height"
      );
    }

    // console.debug(
    //   workingMap.map((i) => i.map((ii) => (ii ? "#" : ".")).join("")).join("\n")
    // );

    return workingMap.reduce(
      (r, i) => r + i.reduce((rr, ii) => (ii ? ++rr : rr), 0),
      0
    );
  }

  async Day20Problem1(data: string) {
    return this.Day20(data, 2);
  }

  async Day20Problem2(data: string) {
    return this.Day20(data, 50);
  }

  // Day 21
  async Day21Problem1(data: string) {
    const startPos = data
      .trim()
      .split(/\n/)
      .map((i) => {
        const posData = /Player \d starting position: (\d+)/.exec(i);
        if (!posData) throw new Error("Error reading starting position data");
        return Number.parseInt(posData[1]);
      });

    const dice = [0, 1, 2];
    const score = [0, 0];
    const pos = startPos.slice().map((i) => i - 1);
    let totalRolls = 0;

    let done = false;
    while (!done) {
      for (const x in startPos) {
        pos[x] = (pos[x] + dice.reduce((r, i) => r + i) + 3) % 10;
        score[x] += pos[x] + 1;
        totalRolls += 3;
        for (const y in dice) dice[y] = (dice[y] + 3) % 100;
        if (score[x] >= 1000) {
          done = true;
          break;
        }
      }
    }
    // console.debug(score, totalRolls);

    return Math.min(...score) * totalRolls;
  }

  async Day21Problem2(data: string) {
    const startPos = data
      .trim()
      .split(/\n/)
      .map((i) => {
        const posData = /Player \d starting position: (\d+)/.exec(i);
        if (!posData) throw new Error("Error reading starting position data");
        return Number.parseInt(posData[1]);
      });

    const odds: Record<number, number> = {};
    for (let x = 0; x < 27; x++) {
      const result =
        [x % 3, Math.floor(x / 3) % 3, Math.floor(x / 9) % 3].reduce(
          (r, i) => r + i
        ) + 3;
      odds[result] === undefined ? (odds[result] = 1) : odds[result]++;
    }

    const wins = [0, 0];
    const RecurseReality = (
      score: number[],
      pos: number[],
      splits: number[],
      curPlayer: number
    ) => {
      for (const roll of Object.keys(odds).map((i) => Number.parseInt(i))) {
        const newScore = score.slice();
        const newPos = pos.slice();
        const newSplits = splits.slice();

        newPos[curPlayer] = (newPos[curPlayer] + roll) % 10;
        newScore[curPlayer] += newPos[curPlayer] + 1;
        newSplits.push(odds[roll]);

        if (newScore[curPlayer] >= 21) {
          wins[curPlayer] += newSplits.reduce((r, i) => r * i);
        } else {
          RecurseReality(newScore, newPos, newSplits, curPlayer === 0 ? 1 : 0);
        }
        if (splits.length === 0) console.debug("Wins so far:", wins);
      }
    };
    RecurseReality(
      [0, 0],
      startPos.slice().map((i) => i - 1),
      [],
      0
    );

    return Math.max(...wins);
  }

  // Day 22
  async Day22Problem1(data: string) {
    const cubes: BootCubeV3[] = data
      .trim()
      .split(/\n/)
      .map((i) => {
        const cubeRegex =
          /(o(?:n|ff)) x=(-?\d+)\.\.(-?\d+),y=(-?\d+)\.\.(-?\d+),z=(-?\d+)\.\.(-?\d+)/.exec(
            i
          );
        if (!cubeRegex) throw new Error("Error reading boot cube data");
        const [x1, x2, y1, y2, z1, z2] = cubeRegex
          .slice(2)
          .map((i) => Number.parseInt(i));
        return {
          state: cubeRegex[1] === "on",
          rangeX: [x1, x2].sort((a, b) => a - b) as Range,
          rangeY: [y1, y2].sort((a, b) => a - b) as Range,
          rangeZ: [z1, z2].sort((a, b) => a - b) as Range,
        };
      });

    const nodes = new Set<string>();

    for (const { state, rangeX, rangeY, rangeZ } of cubes)
      for (let x = Math.max(rangeX[0], -50); x <= Math.min(rangeX[1], 50); x++)
        for (
          let y = Math.max(rangeY[0], -50);
          y <= Math.min(rangeY[1], 50);
          y++
        )
          for (
            let z = Math.max(rangeZ[0], -50);
            z <= Math.min(rangeZ[1], 50);
            z++
          )
            if (state) nodes.add(`${x}|${y}|${z}`);
            else nodes.delete(`${x}|${y}|${z}`);

    return nodes.size;
  }

  async Day22Problem2(data: string) {
    const cubes: BootCubeV3[] = data
      .trim()
      .split(/\n/)
      .map((i) => {
        const cubeRegex =
          /(o(?:n|ff)) x=(-?\d+)\.\.(-?\d+),y=(-?\d+)\.\.(-?\d+),z=(-?\d+)\.\.(-?\d+)/.exec(
            i
          );
        if (!cubeRegex) throw new Error("Error reading boot cube data");
        const [x1, x2, y1, y2, z1, z2] = cubeRegex
          .slice(2)
          .map((i) => Number.parseInt(i));
        return {
          state: cubeRegex[1] === "on",
          rangeX: [x1, x2].sort((a, b) => a - b) as Range,
          rangeY: [y1, y2].sort((a, b) => a - b) as Range,
          rangeZ: [z1, z2].sort((a, b) => a - b) as Range,
        };
      });

    // Thanks to GitHub user leyanlo for this function -- not proud of using this, but I am tired
    const Intersect = (a: Range[], b: Range[]): Range[] | null => {
      const c = [0, 1, 2].map(
        (i) => [Math.max(a[i][0], b[i][0]), Math.min(a[i][1], b[i][1])] as Range
      );
      if (c.some(([min, max]) => min > max)) {
        return null;
      }
      return c;
    };

    const IntersectAdapter = (
      lhs: BootCubeV3,
      rhs: BootCubeV3
    ): BootCubeV3 | null => {
      const c = Intersect(
        [lhs.rangeX, lhs.rangeY, lhs.rangeZ],
        [rhs.rangeX, rhs.rangeY, rhs.rangeZ]
      );
      if (!c) return null;
      const [rangeX, rangeY, rangeZ] = c;
      return {
        state: !rhs.state,
        rangeX,
        rangeY,
        rangeZ,
      };
    };

    const bigMap: BootCubeV3[] = [];

    for (const cube of cubes) {
      for (const compCube of bigMap.slice()) {
        const intersect = IntersectAdapter(cube, compCube);
        if (intersect) bigMap.push(intersect);
      }
      if (cube.state) bigMap.push(cube);
    }

    const RangeSize = (range: Range) => range[1] - range[0] + 1;
    const Volume = (cube: BootCubeV3) =>
      RangeSize(cube.rangeX) * RangeSize(cube.rangeY) * RangeSize(cube.rangeZ);

    return bigMap.reduce((r, i) => r + Volume(i) * (i.state ? 1 : -1), 0);
  }

  // Day 23 (skipped)
  async Day23Problem1(data: string) {
    // (not) completed using MZX
    console.debug(data);
    return 0;
  }

  // Day 24
  RecurseMonad(
    alsUnit: ALS,
    mem: Set<string>[],
    direction: boolean,
    recursion: number,
    answer: string[]
  ) {
    if (answer[0]) return;
    for (let dx = 0; dx <= 8; dx++) {
      const x = direction ? dx + 1 : 9 - dx;
      const state = `${alsUnit.z}|${x}`;

      // concept of using Sets adapted from hqli's solution, expanded to prevent crashing and
      // heavily reduce memory usage without affecting performance too much
      if (mem[recursion].has(state)) continue;
      mem.push(new Set());

      if (recursion < 3)
        console.debug("Solving for #%d digit", recursion + 1, x);
      console.group();

      alsUnit.PushState();
      alsUnit.AddInput(x);
      alsUnit.Run();
      if (alsUnit.state === ALSProgramState.NeedInput)
        this.RecurseMonad(alsUnit, mem, direction, recursion + 1, answer);
      else if (alsUnit.state === ALSProgramState.Done) {
        if (alsUnit.z === 0) {
          answer.push(alsUnit.processedInput.join(""));
          console.debug("Answer found:", answer[answer.length - 1]);
        }
      }
      alsUnit.PopState();

      try {
        mem[recursion].add(state);
      } catch (e) {
        console.log(alsUnit.processedInput.join(""));
        mem[recursion] = new Set();
        mem[recursion].add(state);
      }
      mem.pop();
      console.groupEnd();
    }
  }

  async Day24Problem1(data: string) {
    const alsUnit = new ALS(data);
    const mem: Set<string>[] = [];
    for (let x = 0; x < 5; x++) mem.push(new Set());
    const answer: string[] = [];

    this.RecurseMonad(alsUnit, mem, false, 0, answer);

    console.debug(answer);
    if (!answer[0]) return 0;
    return answer;
  }

  async Day24Problem2(data: string) {
    const alsUnit = new ALS(data);
    const mem: Set<string>[] = [];
    for (let x = 0; x < 5; x++) mem.push(new Set());
    const answer: string[] = [];

    this.RecurseMonad(alsUnit, mem, true, 0, answer);

    console.debug(answer);
    if (!answer[0]) return 0;
    return answer[0];

    /*
      Just for fun, the complete set of valid serial numbers for my input:
      [
        '11911316711816', '11911326711916', '12911316711826',
        '12911326711926', '13911316711836', '13911326711936',
        '14911316711846', '14911326711946', '15911316711856',
        '15911326711956', '16911316711866', '16911326711966',
        '17911316711876', '17911326711976', '18911316711886',
        '18911326711986', '19911316711896', '19911326711996',
        '21911316711817', '21911326711917', '22911316711827',
        '22911326711927', '23911316711837', '23911326711937',
        '24911316711847', '24911326711947', '25911316711857',
        '25911326711957', '26911316711867', '26911326711967',
        '27911316711877', '27911326711977', '28911316711887',
        '28911326711987', '29911316711897', '29911326711997',
        '31911316711818', '31911326711918', '32911316711828',
        '32911326711928', '33911316711838', '33911326711938',
        '34911316711848', '34911326711948', '35911316711858',
        '35911326711958', '36911316711868', '36911326711968',
        '37911316711878', '37911326711978', '38911316711888',
        '38911326711988', '39911316711898', '39911326711998',
        '41911316711819', '41911326711919', '42911316711829',
        '42911326711929', '43911316711839', '43911326711939',
        '44911316711849', '44911326711949', '45911316711859',
        '45911326711959', '46911316711869', '46911326711969',
        '47911316711879', '47911326711979', '48911316711889',
        '48911326711989', '49911316711899', '49911326711999'
      ]
    */
  }
}
