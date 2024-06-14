const {
  EthereumBundlerV2__factory,
} = require("@morpho-org/morpho-blue-bundlers/types");
const fs = require("fs");

const KNOWN_TX_ORIGINS = {
  "00011111": "unknown interface deployment",
  "00022222": "app.morpho.dev",
  "00033333": "netlify",
  "0000da44": "app.morpho.org",
  "05afea44": "safe-app.morpho.org",
};

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
  let res, origin, submissionTimestamp;
  if (process.argv.filter((d) => !d.startsWith("-")).length === 3) {
    const data = process.argv[2];
    res = decodeMulticall(data);
    const metadataLength = (data.length - 10) % 64;
    if (metadataLength !== 0) {
      const encodedSubmissionTimestamp = data.slice(
        -metadataLength,
        -metadataLength + 8
      );
      origin = data.slice(-metadataLength + 8);
      submissionTimestamp = Number("0x" + encodedSubmissionTimestamp);
    }
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

  fs.writeFileSync(
    path,
    JSON.stringify({
      calls: res,
      origin: KNOWN_TX_ORIGINS[origin] ?? origin,
      submissionTimestamp,
    })
  );

  console.log("saved in", path);
} catch (e) {
  console.log("couldn't decode", e);
}
