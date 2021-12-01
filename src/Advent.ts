import { get as httpsGet } from "https";

const getInput = (year: number, day: number) => {
  const {COOKIE} = process.env;
  const url = `https://adventofcode.com/${year}/day/${day}/input`;
  return new Promise<string>((f, r) => {
    httpsGet(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.114 Safari/537.36 Vivaldi/4.3.2439.63",
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
  private functions: ((data: string) => Promise<void>)[][];

  constructor() {
    this.functions = [[this.Day1Problem1]];
  }

  async DoToday(day: number, problem?: number) {
    const { YEAR } = process.env;
    const data = await getInput(Number.parseInt(YEAR as string), day);

    if (!this.functions[day - 1])
      console.error(`Error: no function assigned for day ${day}`);
    else if (problem !== undefined) {
      const Today = this.functions[day - 1][problem - 1];
      if (Today !== undefined) await Today(data);
      else
        console.error(
          `Error: no function assigned for day ${day} problem ${problem}`
        );
    } else {
      for (const Today of this.functions[day - 1]) await Today(data);
    }
  }

  async Day1Problem1(data: string) {
    console.log(data);
    console.log("Hello world");
  }
}
