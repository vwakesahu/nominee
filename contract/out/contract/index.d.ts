import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  getSchnorrReduction(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      challengeHash_0: bigint): [PS, [bigint, bigint]];
  ownerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  willRoot(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  ownerPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
            leaf_0: Uint8Array): [PS, { leaf: Uint8Array,
                                        path: { sibling: { field: bigint },
                                                goes_left: boolean
                                              }[]
                                      }];
  newVaultRoot(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { field: bigint
                                                                           }];
  heirSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  heirShare(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  heirPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
           leaf_0: Uint8Array): [PS, { leaf: Uint8Array,
                                       path: { sibling: { field: bigint },
                                               goes_left: boolean
                                             }[]
                                     }];
  spendCoin(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { nonce: Uint8Array,
                                                                          color: Uint8Array,
                                                                          value: bigint,
                                                                          mt_index: bigint
                                                                        }];
  gSig0(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { announcement: __compactRuntime.JubjubPoint,
                                                                      response: bigint
                                                                    }];
  gSig1(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { announcement: __compactRuntime.JubjubPoint,
                                                                      response: bigint
                                                                    }];
  gSig2(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { announcement: __compactRuntime.JubjubPoint,
                                                                      response: bigint
                                                                    }];
  totalValue(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  executorId(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  probateBlind(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  envelopeCipher(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  pin(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  decoyRoot(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { field: bigint
                                                                        }];
}

export type ImpureCircuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  heartbeat(context: __compactRuntime.CircuitContext<PS>, now_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<PS, []>;
  updateWill(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  resolve(context: __compactRuntime.CircuitContext<PS>,
          tag_0: Uint8Array,
          deadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  guardianResolve2of3(context: __compactRuntime.CircuitContext<PS>,
                      tag_0: Uint8Array,
                      g0_0: bigint,
                      g1_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  guardianResolve3of5(context: __compactRuntime.CircuitContext<PS>,
                      tag_0: Uint8Array,
                      g0_0: bigint,
                      g1_0: bigint,
                      g2_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claim(context: __compactRuntime.CircuitContext<PS>,
        tag_0: Uint8Array,
        heirKey_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
  openProbate(context: __compactRuntime.CircuitContext<PS>,
              tag_0: Uint8Array,
              vaultCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  resolveUnderPin(context: __compactRuntime.CircuitContext<PS>,
                  tag_0: Uint8Array,
                  realCommit_0: Uint8Array,
                  decoyCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  heartbeat(context: __compactRuntime.CircuitContext<PS>, now_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<PS, []>;
  updateWill(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  resolve(context: __compactRuntime.CircuitContext<PS>,
          tag_0: Uint8Array,
          deadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  guardianResolve2of3(context: __compactRuntime.CircuitContext<PS>,
                      tag_0: Uint8Array,
                      g0_0: bigint,
                      g1_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  guardianResolve3of5(context: __compactRuntime.CircuitContext<PS>,
                      tag_0: Uint8Array,
                      g0_0: bigint,
                      g1_0: bigint,
                      g2_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claim(context: __compactRuntime.CircuitContext<PS>,
        tag_0: Uint8Array,
        heirKey_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
  openProbate(context: __compactRuntime.CircuitContext<PS>,
              tag_0: Uint8Array,
              vaultCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  resolveUnderPin(context: __compactRuntime.CircuitContext<PS>,
                  tag_0: Uint8Array,
                  realCommit_0: Uint8Array,
                  decoyCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  heartbeat(context: __compactRuntime.CircuitContext<PS>, now_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<PS, []>;
  updateWill(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  resolve(context: __compactRuntime.CircuitContext<PS>,
          tag_0: Uint8Array,
          deadline_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  guardianResolve2of3(context: __compactRuntime.CircuitContext<PS>,
                      tag_0: Uint8Array,
                      g0_0: bigint,
                      g1_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  guardianResolve3of5(context: __compactRuntime.CircuitContext<PS>,
                      tag_0: Uint8Array,
                      g0_0: bigint,
                      g1_0: bigint,
                      g2_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claim(context: __compactRuntime.CircuitContext<PS>,
        tag_0: Uint8Array,
        heirKey_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
  openProbate(context: __compactRuntime.CircuitContext<PS>,
              tag_0: Uint8Array,
              vaultCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  resolveUnderPin(context: __compactRuntime.CircuitContext<PS>,
                  tag_0: Uint8Array,
                  realCommit_0: Uint8Array,
                  decoyCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly ownerSet: { field: bigint };
  lastSeen: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  readonly graceSeconds: bigint;
  vaultRoot: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { field: bigint };
    [Symbol.iterator](): Iterator<[Uint8Array, { field: bigint }]>
  };
  resolvedVault: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  spent: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  guardians: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): __compactRuntime.JubjubPoint;
    [Symbol.iterator](): Iterator<[bigint, __compactRuntime.JubjubPoint]>
  };
  heldCoin: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { nonce: Uint8Array,
                                 color: Uint8Array,
                                 value: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { nonce: Uint8Array, color: Uint8Array, value: bigint }]>
  };
  probateOpened: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  willVersion: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               initialOwnerSet_0: { field: bigint },
               grace_0: bigint,
               g0x_0: bigint,
               g0y_0: bigint,
               g1x_0: bigint,
               g1y_0: bigint,
               g2x_0: bigint,
               g2y_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
