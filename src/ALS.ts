export enum ALSInstructionType {
  Input,
  Add,
  Multiply,
  Divide,
  Modulo,
  Equals,
}

export enum ALSProgramState {
  Ready,
  NeedInput,
  Done,

  ParseError = 100,
  DivideByZero,
  NegativeModulo,
  ExecutionError,
}

interface ALSInstruction {
  type: ALSInstructionType;
  dst: string;
  src?: string | number;
}

interface ALSSavedState {
  state: ALSProgramState;
  pos: number;
  input: number[];
  processedInput: number[];
  registers: Record<string, number>;
}

export class ALS {
  private _input: number[] = [];
  private _processedInput: number[] = [];
  private _program: ALSInstruction[] = [];
  private _state: ALSProgramState = ALSProgramState.Ready;
  private _pos = 0;
  private _registers: Record<string, number> = {
    w: 0,
    x: 0,
    y: 0,
    z: 0,
  };
  private _stateStack: ALSSavedState[] = [];

  constructor(data: string) {
    const translate: Record<string, ALSInstructionType> = {
      inp: ALSInstructionType.Input,
      add: ALSInstructionType.Add,
      mul: ALSInstructionType.Multiply,
      div: ALSInstructionType.Divide,
      mod: ALSInstructionType.Modulo,
      eql: ALSInstructionType.Equals,
    };

    try {
      this._program = data
        .trim()
        .split(/\n/)
        .map((i, x) => {
          const parsedLine = /([a-z]{3}) ([w-z])(?: ([w-z]|-?\d+))?/.exec(i);
          if (parsedLine) {
            if (translate[parsedLine[1]] === undefined)
              throw new Error(
                `Invalid instruction: ${parsedLine[1]} at line ${x + 1}`
              );
            const newInstruction: ALSInstruction = {
              type: translate[parsedLine[1]],
              dst: parsedLine[2],
            };
            if (newInstruction.type !== ALSInstructionType.Input) {
              if (parsedLine[3] === undefined)
                throw new Error(
                  `${parsedLine[1]} without src data at line ${x + 1}`
                );
              const dstNum = Number.parseInt(parsedLine[3]);
              newInstruction.src = isNaN(dstNum) ? parsedLine[3] : dstNum;
            }
            return newInstruction;
          } else throw new Error(`Cannot parse line at line ${x + 1}: ${i}`);
        });
    } catch (e) {
      this._state = ALSProgramState.ParseError;
      throw e;
    }
  }

  get state() {
    return this._state;
  }
  get pos() {
    return this._pos + 1;
  }
  get length() {
    return this._program.length;
  }
  get processedInput(): Readonly<number[]> {
    return this._processedInput.slice();
  }
  get w() {
    return this._registers.w;
  }
  get x() {
    return this._registers.x;
  }
  get y() {
    return this._registers.y;
  }
  get z() {
    return this._registers.z;
  }

  PushState() {
    if (this._state >= 100) {
      console.warn("Cannot store error state");
      return false;
    }

    const newState: ALSSavedState = {
      state: this._state,
      pos: this._pos,
      input: this._input.slice(),
      processedInput: this._processedInput.slice(),
      registers: {...this._registers},
    };
    this._stateStack.push(newState);
    return true;
  }

  PopState() {
    const loadState = this._stateStack.pop();
    if (!loadState) console.warn("No state on stack to load");
    else {
      this._state = loadState.state;
      this._pos = loadState.pos;
      this._input = loadState.input;
      this._processedInput = loadState.processedInput;
      this._registers = loadState.registers;
    }
    return loadState !== undefined;
  }

  AddInput(...input: number[]) {
    if (input.some((i) => i < 1 || i > 9))
      throw new Error("Invalid input (must be numbers from 1 to 9)");
    this._input.push(...input);
    if (this._state === ALSProgramState.NeedInput)
      this._state = ALSProgramState.Ready;
  }

  AddInputByString(input: string) {
    const parsedInput = input.split("").map((i) => Number.parseInt(i));
    if (parsedInput.some((i) => isNaN(i)))
      throw new Error("Invalid input (must be all digits)");
    return this.AddInput(...parsedInput);
  }

  ClearInput() {
    while (this._input.shift() !== undefined);
  }

  SkipToNext(type: ALSInstructionType) {
    do {this._pos++} while (this._pos < this.length && this._program[this._pos].type !== type);
    if (this._pos >= this.length) this._state = ALSProgramState.Done;
  }

  Run(fromStart = false) {
    if (fromStart) {
      this._pos = 0;
      this._state = ALSProgramState.Ready;
    }

    try {
      if (this._state !== ALSProgramState.Ready)
        throw new Error("Program not ready");

      for (; this._pos < this._program.length; this._pos++) {
        const instruction = this._program[this._pos];
        const src =
          typeof instruction.src === "string"
            ? this._registers[instruction.src]
            : instruction.src;
        const dst = this._registers[instruction.dst];

        if (!instruction)
          throw new Error(`Out of instruction data at line ${this._pos + 1}`);

        switch (instruction.type) {
          case ALSInstructionType.Input:
            {
              const input = this._input.shift();
              if (input === undefined) {
                this._state = ALSProgramState.NeedInput;
                throw new Error(`Out of input at line ${this._pos}`);
              }
              this._processedInput.push(input);
              this._registers[instruction.dst] = input;
            }
            break;

          case ALSInstructionType.Add:
            if (src === undefined)
              throw new Error(
                `No src for add instruction on line ${this._pos + 1}`
              );
            this._registers[instruction.dst] += src;
            break;

          case ALSInstructionType.Multiply:
            if (src === undefined)
              throw new Error(
                `No src for mul instruction on line ${this._pos + 1}`
              );
            this._registers[instruction.dst] *= src;
            break;

          case ALSInstructionType.Divide:
            if (src === undefined)
              throw new Error(
                `No src for div instruction on line ${this._pos + 1}`
              );
            if (src === 0) {
              this._state = ALSProgramState.DivideByZero;
              throw new Error(`Divide by zero at line ${this._pos + 1}`);
            }
            this._registers[instruction.dst] = Math.trunc(dst / src);
            break;

          case ALSInstructionType.Modulo:
            if (src === undefined)
              throw new Error(
                `No src for mod instruction on line ${this._pos + 1}`
              );
            if (src === 0) {
              this._state = ALSProgramState.DivideByZero;
              throw new Error(`Divide by zero at line ${this._pos + 1}`);
            }
            if (src < 0 || this._registers[instruction.dst] < 0) {
              this._state = ALSProgramState.NegativeModulo;
              throw new Error(`Invalid modulo at line ${this._pos + 1}`);
            }
            this._registers[instruction.dst] %= src;
            break;

          case ALSInstructionType.Equals:
            if (src === undefined)
              throw new Error(
                `No src for add instruction on line ${this._pos + 1}`
              );
            this._registers[instruction.dst] = src === dst ? 1 : 0;
            break;
        }
      }
      if (this._pos === this._program.length)
        this._state = ALSProgramState.Done;
    } catch (e) {
      //console.error(e);
      if (this._state === ALSProgramState.Ready)
        this._state = ALSProgramState.ExecutionError;
    }
    return this._state;
  }
}
