import Advent from "./Advent";

(async () => {
  const { DAY, PROBLEM } = process.env;
  new Advent().DoToday(
    Number.parseInt(DAY as string),
    PROBLEM ? Number.parseInt(PROBLEM) : undefined
  );
})();
