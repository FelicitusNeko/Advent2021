import { get as httpsGet } from "https";

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
        console.log(`Day ${day} problem ${problem}:`, await Today(data));
      else
        console.error(
          `Error: no function assigned for day ${day} problem ${problem}`
        );
    } else {
      const todayAll = this.functions[day - 1];
      for (const problem in todayAll)
        console.log(
          `Day ${day} problem ${Number.parseInt(problem) + 1}:`,
          await todayAll[problem](data)
        );
    }
  }

  async Dummy() {
    return "Dummy function";
  }

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

        const keepTarget = (oneCount >= worksheet.length / 2) === targetOnes ? '1' : '0'
        worksheet = worksheet.filter(i => i[x] === keepTarget);
        if (worksheet.length <= 1) break;
      }

      if (worksheet.length === 0) throw new Error('No values left');
      if (worksheet.length > 1) throw new Error(`Too many values left ${worksheet.length}`);
      return worksheet[0];
    };

    const O2Gen = valueScrubber(true);
    const CO2Scrub = valueScrubber(false);

    return Number.parseInt(O2Gen, 2) * Number.parseInt(CO2Scrub, 2);
  }
}
