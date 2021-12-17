export enum BITSPacketType {
  AddOp,
  MultOp,
  MinOp,
  MaxOp,
  Literal,
  GTOp,
  LTOp,
  EqOp,
}

export interface BITSPacket {
  version: number;
  packetType: BITSPacketType;
}

export interface BITSLiteralPacket extends BITSPacket {
  packetType: BITSPacketType.Literal;
  value: number;
}

export interface BITSOperatorPacket extends BITSPacket {
  packetType:
    | BITSPacketType.AddOp
    | BITSPacketType.MultOp
    | BITSPacketType.MinOp
    | BITSPacketType.MaxOp
    | BITSPacketType.GTOp
    | BITSPacketType.LTOp
    | BITSPacketType.EqOp;
  subpackets: BITSPacket[];
}

export default class BITSReader {
  private remainingData: string[];
  private parsedBits: boolean[] = [];

  constructor(data: string) {
    this.remainingData = data.split("");
  }

  get bitsLeft() {
    return this.remainingData.length * 4 + this.parsedBits.length;
  }

  private grabNextByte() {
    for (let x = 0; x < 2; x++) {
      if (this.remainingData.length === 0) return false;
      this.parsedBits.push(
        ...((i) => {
          if (i === undefined) throw new Error("Out of data");
          const parsed = Number.parseInt(i, 16);
          return [
            (parsed & 0x08) > 0,
            (parsed & 0x04) > 0,
            (parsed & 0x02) > 0,
            (parsed & 0x01) > 0,
          ];
        })(this.remainingData.shift())
      );
    }
    return true;
  }

  getBits(count: number, discard = false) {
    let retval = 0;
    while (count > this.parsedBits.length)
      if (!this.grabNextByte()) throw new Error("Out of data");
    for (let x = 0; x < count; x++) {
      if (discard) this.parsedBits.shift();
      else retval = (retval << 1) | (this.parsedBits.shift() ? 1 : 0);
    }
    return retval;
  }

  flushPacket() {
    console.warn('Flushing');
    while (this.parsedBits.shift() !== undefined);
  }

  readNextPacket(isSubpacket = 0) {
    if (this.remainingData.length === 0 && this.parsedBits.length === 0)
      return null;

    const retval: BITSPacket = {
      version: this.getBits(3),
      packetType: this.getBits(3),
    };

    switch (retval.packetType) {
      case BITSPacketType.Literal:
        {
          const literalPacket = retval as BITSLiteralPacket;
          let notDone = 1,
            totalValue = 0;
          while (notDone) {
            notDone = this.getBits(1);
            totalValue = (totalValue * Math.pow(2,4)) + this.getBits(4);
          }
          literalPacket.value = totalValue;
        }
        break;
      default:
        {
          const operatorPacket = retval as BITSOperatorPacket;
          const lengthIndicator = this.getBits(1);

          operatorPacket.subpackets = [];
          if (lengthIndicator) {
            const packetCount = this.getBits(11);
            for (let x = 0; x < packetCount; x++) {
              const nextPacket = this.readNextPacket(isSubpacket + 1);
              if (nextPacket) operatorPacket.subpackets.push(nextPacket);
              else break;
            }
          } else {
            const bitCount = this.getBits(15);
            const readToPoint = this.bitsLeft - bitCount;
            while (this.bitsLeft - readToPoint > 0) {
              const nextPacket = this.readNextPacket(isSubpacket + 1);
              if (nextPacket) operatorPacket.subpackets.push(nextPacket);
              else break;
            }
          }
        }
        break;
    }

    if (!isSubpacket) this.flushPacket();
    return retval;
  }
}
