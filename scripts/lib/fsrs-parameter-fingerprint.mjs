import { createHash } from "node:crypto";

export function fsrsParameterFingerprint(parameters) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        schedulerVersion: parameters.schedulerVersion,
        optimizerVersion: parameters.optimizerVersion,
        scope: parameters.scope,
        scopeKey: parameters.scopeKey ?? null,
        trainingBefore: parameters.trainingBefore,
        weights: parameters.weights,
        requestRetention: parameters.requestRetention,
        maximumInterval: parameters.maximumInterval,
        sampleSize: parameters.sampleSize,
      }),
    )
    .digest("hex");
}

export function assertFsrsParameterFingerprint(parameters) {
  const expected = fsrsParameterFingerprint(parameters);
  if (parameters.parameterFingerprint !== expected) {
    throw new Error("Odcisk zestawu parametrów FSRS jest nieprawidłowy.");
  }
  return expected;
}
