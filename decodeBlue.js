const {
  EthereumBundlerV2__factory,
} = require("@morpho-org/morpho-blue-bundlers/types");
const fs = require("fs");

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const decodeCalls = (calls) => {
  const bundlerIfc = EthereumBundlerV2__factory.createInterface();
  return calls.map((_data) => bundlerIfc.parseTransaction({ data: _data }));
};

const decodeMulticall = (data) => {
  const bundlerIfc = EthereumBundlerV2__factory.createInterface();
  const [calls] = bundlerIfc.decodeFunctionData("multicall", data);
  return decodeCalls(calls);
};

try {
  let res;
  if (process.argv.filter((d) => !d.startsWith("-")).length === 3) {
    res = decodeMulticall(process.argv[2]);
  } else {
    res = decodeCalls(
      process.argv.slice(2).filter((call) => call !== "--simple")
    );
  }

  const path = `output/${Date.now()}.json`;

  if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
  }

  if (process.argv[process.argv.length - 1] === "--simple") {
    res = res.map((r) => r && { name: r.name, args: r.args });
  }

  fs.writeFileSync(path, JSON.stringify(res));

  console.log("saved in", path);
} catch (e) {
  console.log("couldn't decode", e);
}
