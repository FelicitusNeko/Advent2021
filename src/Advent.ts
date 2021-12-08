import { get as httpsGet } from "https";

interface BingoBoard {
  data: BingoSpace[][];
  winner: boolean;
}
interface BingoSpace {
  num: number;
  marked: boolean;
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
      for (const problem in todayAll)
        console.log(
          `Day ${day} problem ${Number.parseInt(problem) + 1}:`,
          await todayAll[problem].call(this, data)
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
}
