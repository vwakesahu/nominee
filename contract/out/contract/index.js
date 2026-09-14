import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = __compactRuntime.CompactTypeField;

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.field);
  }
}

const _descriptor_2 = new _MerkleTreeDigest_0();

const _descriptor_3 = __compactRuntime.CompactTypeBoolean;

const _descriptor_4 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_4.toValue(value_0.value)));
  }
}

const _descriptor_5 = new _ShieldedCoinInfo_0();

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_6 = new _ZswapCoinPublicKey_0();

const _descriptor_7 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_8 = __compactRuntime.CompactTypeJubjubPoint;

const _descriptor_9 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _SchnorrSignature_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      announcement: _descriptor_8.fromValue(value_0),
      response: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.announcement).concat(_descriptor_1.toValue(value_0.response));
  }
}

const _descriptor_10 = new _SchnorrSignature_0();

class _QualifiedShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_4.alignment().concat(_descriptor_9.alignment())));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_4.fromValue(value_0),
      mt_index: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_4.toValue(value_0.value).concat(_descriptor_9.toValue(value_0.mt_index))));
  }
}

const _descriptor_11 = new _QualifiedShieldedCoinInfo_0();

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_3.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_2.fromValue(value_0),
      goes_left: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.sibling).concat(_descriptor_3.toValue(value_0.goes_left));
  }
}

const _descriptor_12 = new _MerkleTreePathEntry_0();

const _descriptor_13 = new __compactRuntime.CompactTypeVector(16, _descriptor_12);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_13.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_0.fromValue(value_0),
      path: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.leaf).concat(_descriptor_13.toValue(value_0.path));
  }
}

const _descriptor_14 = new _MerkleTreePath_0();

const _descriptor_15 = new __compactRuntime.CompactTypeVector(4, _descriptor_1);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_16 = new _ContractAddress_0();

class _Either_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_6.alignment().concat(_descriptor_16.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_6.fromValue(value_0),
      right: _descriptor_16.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_6.toValue(value_0.left).concat(_descriptor_16.toValue(value_0.right)));
  }
}

const _descriptor_17 = new _Either_0();

const _descriptor_18 = new __compactRuntime.CompactTypeUnsignedInteger(127n, 1);

const _descriptor_19 = new __compactRuntime.CompactTypeUnsignedInteger(452312848583266388373324160190187140051835877600158453279131187530910662655n, 31);

class _tuple_0 {
  alignment() {
    return _descriptor_18.alignment().concat(_descriptor_19.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_18.fromValue(value_0),
      _descriptor_19.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_18.toValue(value_0[0]).concat(_descriptor_19.toValue(value_0[1]));
  }
}

const _descriptor_20 = new _tuple_0();

const _descriptor_21 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_22 = new __compactRuntime.CompactTypeVector(3, _descriptor_0);

const _descriptor_23 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_23.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_23.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_23.toValue(value_0.domain_sep).concat(_descriptor_0.toValue(value_0.data));
  }
}

const _descriptor_24 = new _LeafPreimage_0();

const _descriptor_25 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

const _descriptor_26 = new __compactRuntime.CompactTypeBytes(21);

class _CoinPreimage_0 {
  alignment() {
    return _descriptor_26.alignment().concat(_descriptor_5.alignment().concat(_descriptor_3.alignment().concat(_descriptor_0.alignment())));
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_26.fromValue(value_0),
      info: _descriptor_5.fromValue(value_0),
      dataType: _descriptor_3.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_26.toValue(value_0.domain_sep).concat(_descriptor_5.toValue(value_0.info).concat(_descriptor_3.toValue(value_0.dataType).concat(_descriptor_0.toValue(value_0.data))));
  }
}

const _descriptor_27 = new _CoinPreimage_0();

class _SchnorrHashInput_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_15.alignment()))));
  }
  fromValue(value_0) {
    return {
      ann_x: _descriptor_1.fromValue(value_0),
      ann_y: _descriptor_1.fromValue(value_0),
      pk_x: _descriptor_1.fromValue(value_0),
      pk_y: _descriptor_1.fromValue(value_0),
      msg: _descriptor_15.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.ann_x).concat(_descriptor_1.toValue(value_0.ann_y).concat(_descriptor_1.toValue(value_0.pk_x).concat(_descriptor_1.toValue(value_0.pk_y).concat(_descriptor_15.toValue(value_0.msg)))));
  }
}

const _descriptor_28 = new _SchnorrHashInput_0();

class _Maybe_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_5.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_3.fromValue(value_0),
      value: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_some).concat(_descriptor_5.toValue(value_0.value));
  }
}

const _descriptor_29 = new _Maybe_0();

class _ShieldedSendResult_0 {
  alignment() {
    return _descriptor_29.alignment().concat(_descriptor_5.alignment());
  }
  fromValue(value_0) {
    return {
      change: _descriptor_29.fromValue(value_0),
      sent: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_29.toValue(value_0.change).concat(_descriptor_5.toValue(value_0.sent));
  }
}

const _descriptor_30 = new _ShieldedSendResult_0();

class _Either_1 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_31 = new _Either_1();

const _descriptor_32 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.getSchnorrReduction) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getSchnorrReduction');
    }
    if (typeof(witnesses_0.ownerSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named ownerSecret');
    }
    if (typeof(witnesses_0.willRoot) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named willRoot');
    }
    if (typeof(witnesses_0.ownerPath) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named ownerPath');
    }
    if (typeof(witnesses_0.newVaultRoot) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named newVaultRoot');
    }
    if (typeof(witnesses_0.heirSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named heirSecret');
    }
    if (typeof(witnesses_0.heirShare) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named heirShare');
    }
    if (typeof(witnesses_0.heirPath) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named heirPath');
    }
    if (typeof(witnesses_0.spendCoin) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named spendCoin');
    }
    if (typeof(witnesses_0.gSig0) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named gSig0');
    }
    if (typeof(witnesses_0.gSig1) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named gSig1');
    }
    if (typeof(witnesses_0.gSig2) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named gSig2');
    }
    if (typeof(witnesses_0.totalValue) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named totalValue');
    }
    if (typeof(witnesses_0.executorId) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named executorId');
    }
    if (typeof(witnesses_0.probateBlind) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named probateBlind');
    }
    if (typeof(witnesses_0.envelopeCipher) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named envelopeCipher');
    }
    if (typeof(witnesses_0.pin) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named pin');
    }
    if (typeof(witnesses_0.decoyRoot) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named decoyRoot');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      register: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`register: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('register',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 76 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._register_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      heartbeat: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`heartbeat: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const now_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('heartbeat',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 88 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(now_0) === 'bigint' && now_0 >= 0n && now_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('heartbeat',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 88 char 1',
                                     'Uint<0..18446744073709551616>',
                                     now_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_9.toValue(now_0),
            alignment: _descriptor_9.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._heartbeat_0(context, partialProofData, now_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      deposit: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`deposit: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const coin_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('deposit',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 97 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(coin_0) === 'object' && coin_0.nonce.buffer instanceof ArrayBuffer && coin_0.nonce.BYTES_PER_ELEMENT === 1 && coin_0.nonce.length === 32 && coin_0.color.buffer instanceof ArrayBuffer && coin_0.color.BYTES_PER_ELEMENT === 1 && coin_0.color.length === 32 && typeof(coin_0.value) === 'bigint' && coin_0.value >= 0n && coin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('deposit',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 97 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     coin_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_5.toValue(coin_0),
            alignment: _descriptor_5.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._deposit_0(context, partialProofData, coin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      updateWill: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`updateWill: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('updateWill',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 104 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._updateWill_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      resolve: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`resolve: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tag_0 = args_1[1];
        const deadline_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('resolve',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 113 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tag_0.buffer instanceof ArrayBuffer && tag_0.BYTES_PER_ELEMENT === 1 && tag_0.length === 32)) {
          __compactRuntime.typeError('resolve',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 113 char 1',
                                     'Bytes<32>',
                                     tag_0)
        }
        if (!(typeof(deadline_0) === 'bigint' && deadline_0 >= 0n && deadline_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('resolve',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'nominee.compact line 113 char 1',
                                     'Uint<0..18446744073709551616>',
                                     deadline_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tag_0).concat(_descriptor_9.toValue(deadline_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_9.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._resolve_0(context,
                                         partialProofData,
                                         tag_0,
                                         deadline_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      guardianResolve2of3: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`guardianResolve2of3: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tag_0 = args_1[1];
        const g0_0 = args_1[2];
        const g1_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('guardianResolve2of3',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 121 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tag_0.buffer instanceof ArrayBuffer && tag_0.BYTES_PER_ELEMENT === 1 && tag_0.length === 32)) {
          __compactRuntime.typeError('guardianResolve2of3',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 121 char 1',
                                     'Bytes<32>',
                                     tag_0)
        }
        if (!(typeof(g0_0) === 'bigint' && g0_0 >= 0n && g0_0 <= 65535n)) {
          __compactRuntime.typeError('guardianResolve2of3',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'nominee.compact line 121 char 1',
                                     'Uint<0..65536>',
                                     g0_0)
        }
        if (!(typeof(g1_0) === 'bigint' && g1_0 >= 0n && g1_0 <= 65535n)) {
          __compactRuntime.typeError('guardianResolve2of3',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'nominee.compact line 121 char 1',
                                     'Uint<0..65536>',
                                     g1_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tag_0).concat(_descriptor_7.toValue(g0_0).concat(_descriptor_7.toValue(g1_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_7.alignment().concat(_descriptor_7.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._guardianResolve2of3_0(context,
                                                     partialProofData,
                                                     tag_0,
                                                     g0_0,
                                                     g1_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      guardianResolve3of5: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`guardianResolve3of5: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tag_0 = args_1[1];
        const g0_0 = args_1[2];
        const g1_0 = args_1[3];
        const g2_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('guardianResolve3of5',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 132 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tag_0.buffer instanceof ArrayBuffer && tag_0.BYTES_PER_ELEMENT === 1 && tag_0.length === 32)) {
          __compactRuntime.typeError('guardianResolve3of5',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 132 char 1',
                                     'Bytes<32>',
                                     tag_0)
        }
        if (!(typeof(g0_0) === 'bigint' && g0_0 >= 0n && g0_0 <= 65535n)) {
          __compactRuntime.typeError('guardianResolve3of5',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'nominee.compact line 132 char 1',
                                     'Uint<0..65536>',
                                     g0_0)
        }
        if (!(typeof(g1_0) === 'bigint' && g1_0 >= 0n && g1_0 <= 65535n)) {
          __compactRuntime.typeError('guardianResolve3of5',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'nominee.compact line 132 char 1',
                                     'Uint<0..65536>',
                                     g1_0)
        }
        if (!(typeof(g2_0) === 'bigint' && g2_0 >= 0n && g2_0 <= 65535n)) {
          __compactRuntime.typeError('guardianResolve3of5',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'nominee.compact line 132 char 1',
                                     'Uint<0..65536>',
                                     g2_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tag_0).concat(_descriptor_7.toValue(g0_0).concat(_descriptor_7.toValue(g1_0).concat(_descriptor_7.toValue(g2_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_7.alignment().concat(_descriptor_7.alignment().concat(_descriptor_7.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._guardianResolve3of5_0(context,
                                                     partialProofData,
                                                     tag_0,
                                                     g0_0,
                                                     g1_0,
                                                     g2_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      claim: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`claim: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tag_0 = args_1[1];
        const heirKey_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('claim',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 146 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tag_0.buffer instanceof ArrayBuffer && tag_0.BYTES_PER_ELEMENT === 1 && tag_0.length === 32)) {
          __compactRuntime.typeError('claim',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 146 char 1',
                                     'Bytes<32>',
                                     tag_0)
        }
        if (!(typeof(heirKey_0) === 'object' && heirKey_0.bytes.buffer instanceof ArrayBuffer && heirKey_0.bytes.BYTES_PER_ELEMENT === 1 && heirKey_0.bytes.length === 32)) {
          __compactRuntime.typeError('claim',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'nominee.compact line 146 char 1',
                                     'struct ZswapCoinPublicKey<bytes: Bytes<32>>',
                                     heirKey_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tag_0).concat(_descriptor_6.toValue(heirKey_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_6.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._claim_0(context,
                                       partialProofData,
                                       tag_0,
                                       heirKey_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      openProbate: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`openProbate: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tag_0 = args_1[1];
        const vaultCommit_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('openProbate',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 167 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tag_0.buffer instanceof ArrayBuffer && tag_0.BYTES_PER_ELEMENT === 1 && tag_0.length === 32)) {
          __compactRuntime.typeError('openProbate',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 167 char 1',
                                     'Bytes<32>',
                                     tag_0)
        }
        if (!(vaultCommit_0.buffer instanceof ArrayBuffer && vaultCommit_0.BYTES_PER_ELEMENT === 1 && vaultCommit_0.length === 32)) {
          __compactRuntime.typeError('openProbate',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'nominee.compact line 167 char 1',
                                     'Bytes<32>',
                                     vaultCommit_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tag_0).concat(_descriptor_0.toValue(vaultCommit_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._openProbate_0(context,
                                             partialProofData,
                                             tag_0,
                                             vaultCommit_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      resolveUnderPin: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`resolveUnderPin: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const tag_0 = args_1[1];
        const realCommit_0 = args_1[2];
        const decoyCommit_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('resolveUnderPin',
                                     'argument 1 (as invoked from Typescript)',
                                     'nominee.compact line 175 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(tag_0.buffer instanceof ArrayBuffer && tag_0.BYTES_PER_ELEMENT === 1 && tag_0.length === 32)) {
          __compactRuntime.typeError('resolveUnderPin',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'nominee.compact line 175 char 1',
                                     'Bytes<32>',
                                     tag_0)
        }
        if (!(realCommit_0.buffer instanceof ArrayBuffer && realCommit_0.BYTES_PER_ELEMENT === 1 && realCommit_0.length === 32)) {
          __compactRuntime.typeError('resolveUnderPin',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'nominee.compact line 175 char 1',
                                     'Bytes<32>',
                                     realCommit_0)
        }
        if (!(decoyCommit_0.buffer instanceof ArrayBuffer && decoyCommit_0.BYTES_PER_ELEMENT === 1 && decoyCommit_0.length === 32)) {
          __compactRuntime.typeError('resolveUnderPin',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'nominee.compact line 175 char 1',
                                     'Bytes<32>',
                                     decoyCommit_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(tag_0).concat(_descriptor_0.toValue(realCommit_0).concat(_descriptor_0.toValue(decoyCommit_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._resolveUnderPin_0(context,
                                                 partialProofData,
                                                 tag_0,
                                                 realCommit_0,
                                                 decoyCommit_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      register: this.circuits.register,
      heartbeat: this.circuits.heartbeat,
      deposit: this.circuits.deposit,
      updateWill: this.circuits.updateWill,
      resolve: this.circuits.resolve,
      guardianResolve2of3: this.circuits.guardianResolve2of3,
      guardianResolve3of5: this.circuits.guardianResolve3of5,
      claim: this.circuits.claim,
      openProbate: this.circuits.openProbate,
      resolveUnderPin: this.circuits.resolveUnderPin
    };
    this.provableCircuits = {
      register: this.circuits.register,
      heartbeat: this.circuits.heartbeat,
      deposit: this.circuits.deposit,
      updateWill: this.circuits.updateWill,
      resolve: this.circuits.resolve,
      guardianResolve2of3: this.circuits.guardianResolve2of3,
      guardianResolve3of5: this.circuits.guardianResolve3of5,
      claim: this.circuits.claim,
      openProbate: this.circuits.openProbate,
      resolveUnderPin: this.circuits.resolveUnderPin
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 9) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 9 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const initialOwnerSet_0 = args_0[1];
    const grace_0 = args_0[2];
    const g0x_0 = args_0[3];
    const g0y_0 = args_0[4];
    const g1x_0 = args_0[5];
    const g1y_0 = args_0[6];
    const g2x_0 = args_0[7];
    const g2y_0 = args_0[8];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(initialOwnerSet_0) === 'object' && typeof(initialOwnerSet_0.field) === 'bigint' && initialOwnerSet_0.field >= 0 && initialOwnerSet_0.field <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'struct MerkleTreeDigest<field: Field>',
                                 initialOwnerSet_0)
    }
    if (!(typeof(grace_0) === 'bigint' && grace_0 >= 0n && grace_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Uint<0..18446744073709551616>',
                                 grace_0)
    }
    if (!(typeof(g0x_0) === 'bigint' && g0x_0 >= 0 && g0x_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 3 (argument 4 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Field',
                                 g0x_0)
    }
    if (!(typeof(g0y_0) === 'bigint' && g0y_0 >= 0 && g0y_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 4 (argument 5 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Field',
                                 g0y_0)
    }
    if (!(typeof(g1x_0) === 'bigint' && g1x_0 >= 0 && g1x_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 5 (argument 6 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Field',
                                 g1x_0)
    }
    if (!(typeof(g1y_0) === 'bigint' && g1y_0 >= 0 && g1y_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 6 (argument 7 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Field',
                                 g1y_0)
    }
    if (!(typeof(g2x_0) === 'bigint' && g2x_0 >= 0 && g2x_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 7 (argument 8 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Field',
                                 g2x_0)
    }
    if (!(typeof(g2y_0) === 'bigint' && g2y_0 >= 0 && g2y_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 8 (argument 9 as invoked from Typescript)',
                                 'nominee.compact line 56 char 1',
                                 'Field',
                                 g2y_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('register', new __compactRuntime.ContractOperation());
    state_0.setOperation('heartbeat', new __compactRuntime.ContractOperation());
    state_0.setOperation('deposit', new __compactRuntime.ContractOperation());
    state_0.setOperation('updateWill', new __compactRuntime.ContractOperation());
    state_0.setOperation('resolve', new __compactRuntime.ContractOperation());
    state_0.setOperation('guardianResolve2of3', new __compactRuntime.ContractOperation());
    state_0.setOperation('guardianResolve3of5', new __compactRuntime.ContractOperation());
    state_0.setOperation('claim', new __compactRuntime.ContractOperation());
    state_0.setOperation('openProbate', new __compactRuntime.ContractOperation());
    state_0.setOperation('resolveUnderPin', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(0n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue({ field: 0n }),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(1n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(2n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(3n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(4n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(5n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(6n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(7n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(8n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(9n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(0n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(initialOwnerSet_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(2n),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(grace_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 0n;
    const tmp_1 = this._constructJubjubPoint_0(g0x_0, g0y_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(6n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(tmp_1),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_2 = 1n;
    const tmp_3 = this._constructJubjubPoint_0(g1x_0, g1y_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(6n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_2),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(tmp_3),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_4 = 2n;
    const tmp_5 = this._constructJubjubPoint_0(g2x_0, g2y_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(6n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_4),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(tmp_5),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _some_0(value_0) { return { is_some: true, value: value_0 }; }
  _none_0() {
    return { is_some: false,
             value:
               { nonce: new Uint8Array(32), color: new Uint8Array(32), value: 0n } };
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _merkleTreePathRoot_0(path_0) {
    return { field:
               this._folder_0((...args_0) =>
                                this._merkleTreePathEntryRoot_0(...args_0),
                              this._degradeToTransient_0(this._persistentHash_1({ domain_sep:
                                                                                    new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                  data:
                                                                                    path_0.leaf })),
                              path_0.path) };
  }
  _merkleTreePathEntryRoot_0(recursiveDigest_0, entry_0) {
    const left_0 = entry_0.goes_left ? recursiveDigest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left ?
                    entry_0.sibling.field :
                    recursiveDigest_0;
    return this._transientHash_1([left_0, right_0]);
  }
  _receiveShielded_0(context, partialProofData, coin_0) {
    const recipient_0 = this._right_0(_descriptor_16.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                 partialProofData,
                                                                                                 [
                                                                                                  { dup: { n: 2 } },
                                                                                                  { idx: { cached: true,
                                                                                                           pushPath: false,
                                                                                                           path: [
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_32.toValue(0n),
                                                                                                                             alignment: _descriptor_32.alignment() } }] } },
                                                                                                  { popeq: { cached: true,
                                                                                                             result: undefined } }]).value));
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const tmp_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(1n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  _sendShielded_0(context, partialProofData, input_0, recipient_0, value_0) {
    const selfAddr_0 = _descriptor_16.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 2 } },
                                                                                   { idx: { cached: true,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_32.toValue(0n),
                                                                                                              alignment: _descriptor_32.alignment() } }] } },
                                                                                   { popeq: { cached: true,
                                                                                              result: undefined } }]).value);
    this._createZswapInput_0(context, partialProofData, input_0);
    const tmp_0 = this._coinNullifier_0(this._downcastQualifiedCoin_0(input_0),
                                        selfAddr_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(0n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    let t_0;
    const change_0 = (t_0 = input_0.value,
                      (__compactRuntime.assert(t_0 >= value_0,
                                               'result of subtraction would be negative'),
                       t_0 - value_0));
    const output_0 = { nonce:
                         this._upgradeFromTransient_0(this._transientHash_1([__compactRuntime.convertBytesToField(28,
                                                                                                                  new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101]),
                                                                                                                  '<standard library>'),
                                                                             this._degradeToTransient_0(input_0.nonce)])),
                       color: input_0.color,
                       value: value_0 };
    this._createZswapOutput_0(context, partialProofData, output_0, recipient_0);
    const tmp_1 = this._coinCommitment_0(output_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(2n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_0(recipient_0.right.bytes, selfAddr_0.bytes))
    {
      const tmp_2 = this._coinCommitment_0(output_0, recipient_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_32.toValue(1n),
                                                                    alignment: _descriptor_32.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_2),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    if (this._equal_1(change_0, 0n)) {
      return { change: this._none_0(), sent: output_0 };
    } else {
      const changeCoin_0 = { nonce:
                               this._upgradeFromTransient_0(this._transientHash_1([__compactRuntime.convertBytesToField(30,
                                                                                                                        new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101, 47, 50]),
                                                                                                                        '<standard library>'),
                                                                                   this._degradeToTransient_0(input_0.nonce)])),
                             color: input_0.color,
                             value: change_0 };
      this._createZswapOutput_0(context,
                                partialProofData,
                                changeCoin_0,
                                this._right_0(selfAddr_0));
      const cm_0 = this._coinCommitment_0(changeCoin_0,
                                          this._right_0(selfAddr_0));
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_32.toValue(2n),
                                                                    alignment: _descriptor_32.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_32.toValue(1n),
                                                                    alignment: _descriptor_32.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      return { change: this._some_0(changeCoin_0), sent: output_0 };
    }
  }
  _downcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce, color: coin_0.color, value: coin_0.value };
  }
  _coinCommitment_0(coin_0, recipient_0) {
    return this._persistentHash_0({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 99, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: recipient_0.is_left,
                                    data:
                                      recipient_0.is_left ?
                                      recipient_0.left.bytes :
                                      recipient_0.right.bytes });
  }
  _coinNullifier_0(coin_0, addr_0) {
    return this._persistentHash_0({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 110, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: false,
                                    data: addr_0.bytes });
  }
  _blockTimeLt_0(context, partialProofData, time_0) {
    return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 2 } },
                                                                      { idx: { cached: true,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_32.toValue(2n),
                                                                                                 alignment: _descriptor_32.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(time_0),
                                                                                                                             alignment: _descriptor_9.alignment() }).encode() } },
                                                                      'lt',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value);
  }
  _blockTimeGte_0(context, partialProofData, time_0) {
    return !this._blockTimeLt_0(context, partialProofData, time_0);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_28, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_25, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_27, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_24, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_4, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_21, value_0);
    return result_0;
  }
  _persistentHash_4(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_22, value_0);
    return result_0;
  }
  _persistentHash_5(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_7, value_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _upgradeFromTransient_0(x_0) {
    const result_0 = __compactRuntime.upgradeFromTransient(x_0);
    return result_0;
  }
  _jubjubPointX_0(np_0) {
    const result_0 = __compactRuntime.jubjubPointX(np_0);
    return result_0;
  }
  _jubjubPointY_0(np_0) {
    const result_0 = __compactRuntime.jubjubPointY(np_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _constructJubjubPoint_0(x_0, y_0) {
    const result_0 = __compactRuntime.constructJubjubPoint(x_0, y_0);
    return result_0;
  }
  _createZswapInput_0(context, partialProofData, coin_0) {
    const result_0 = __compactRuntime.createZswapInput(context, coin_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _createZswapOutput_0(context, partialProofData, coin_0, recipient_0) {
    const result_0 = __compactRuntime.createZswapOutput(context,
                                                        coin_0,
                                                        recipient_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _getSchnorrReduction_0(context, partialProofData, challengeHash_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getSchnorrReduction(witnessContext_0,
                                                                              challengeHash_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 2  && typeof(result_0[0]) === 'bigint' && result_0[0] >= 0n && result_0[0] <= 127n && typeof(result_0[1]) === 'bigint' && result_0[1] >= 0n && result_0[1] <= 452312848583266388373324160190187140051835877600158453279131187530910662655n)) {
      __compactRuntime.typeError('getSchnorrReduction',
                                 'return value',
                                 'schnorr.compact line 26 char 3',
                                 '[Uint<0..128>, Uint<0..452312848583266388373324160190187140051835877600158453279131187530910662656>]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_20.toValue(result_0),
      alignment: _descriptor_20.alignment()
    });
    return result_0;
  }
  _schnorrVerify_0(context, partialProofData, msg_0, signature_0, pk_0) {
    const __compact_pattern_tmp2_0 = signature_0;
    const announcement_0 = __compact_pattern_tmp2_0.announcement;
    const response_0 = __compact_pattern_tmp2_0.response;
    const cFull_0 = this._transientHash_0({ ann_x:
                                              this._jubjubPointX_0(announcement_0),
                                            ann_y:
                                              this._jubjubPointY_0(announcement_0),
                                            pk_x: this._jubjubPointX_0(pk_0),
                                            pk_y: this._jubjubPointY_0(pk_0),
                                            msg: msg_0 });
    const TWO_248_0 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;
    const __compact_pattern_tmp1_0 = this._getSchnorrReduction_0(context,
                                                                 partialProofData,
                                                                 cFull_0);
    const q_0 = __compact_pattern_tmp1_0[0];
    const cTruncated_0 = __compact_pattern_tmp1_0[1];
    let t_0;
    __compactRuntime.assert((t_0 = q_0, t_0 < 116n),
                            'Schnorr quotient out of range');
    __compactRuntime.assert(__compactRuntime.addField(__compactRuntime.mulField(q_0,
                                                                                TWO_248_0),
                                                      cTruncated_0)
                            ===
                            cFull_0,
                            'Invalid challenge reduction');
    const c_0 = cTruncated_0;
    const lhs_0 = this._ecMulGenerator_0(response_0);
    const rhs_0 = this._ecAdd_0(announcement_0, this._ecMul_0(pk_0, c_0));
    __compactRuntime.assert(this._jubjubPointX_0(lhs_0)
                            ===
                            this._jubjubPointX_0(rhs_0)
                            &&
                            this._jubjubPointY_0(lhs_0)
                            ===
                            this._jubjubPointY_0(rhs_0),
                            'Invalid attestation signature');
    return [];
  }
  _ownerSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.ownerSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('ownerSecret',
                                 'return value',
                                 'nominee.compact line 29 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _willRoot_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.willRoot(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('willRoot',
                                 'return value',
                                 'nominee.compact line 30 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _ownerPath_0(context, partialProofData, leaf_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.ownerPath(witnessContext_0,
                                                                    leaf_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 16 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('ownerPath',
                                 'return value',
                                 'nominee.compact line 31 char 1',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<16, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_14.toValue(result_0),
      alignment: _descriptor_14.alignment()
    });
    return result_0;
  }
  _newVaultRoot_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.newVaultRoot(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && typeof(result_0.field) === 'bigint' && result_0.field >= 0 && result_0.field <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('newVaultRoot',
                                 'return value',
                                 'nominee.compact line 33 char 1',
                                 'struct MerkleTreeDigest<field: Field>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_2.toValue(result_0),
      alignment: _descriptor_2.alignment()
    });
    return result_0;
  }
  _heirSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.heirSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('heirSecret',
                                 'return value',
                                 'nominee.compact line 34 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _heirShare_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.heirShare(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('heirShare',
                                 'return value',
                                 'nominee.compact line 35 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_4.toValue(result_0),
      alignment: _descriptor_4.alignment()
    });
    return result_0;
  }
  _heirPath_0(context, partialProofData, leaf_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.heirPath(witnessContext_0,
                                                                   leaf_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 16 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('heirPath',
                                 'return value',
                                 'nominee.compact line 36 char 1',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<16, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_14.toValue(result_0),
      alignment: _descriptor_14.alignment()
    });
    return result_0;
  }
  _spendCoin_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.spendCoin(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.nonce.buffer instanceof ArrayBuffer && result_0.nonce.BYTES_PER_ELEMENT === 1 && result_0.nonce.length === 32 && result_0.color.buffer instanceof ArrayBuffer && result_0.color.BYTES_PER_ELEMENT === 1 && result_0.color.length === 32 && typeof(result_0.value) === 'bigint' && result_0.value >= 0n && result_0.value <= 340282366920938463463374607431768211455n && typeof(result_0.mt_index) === 'bigint' && result_0.mt_index >= 0n && result_0.mt_index <= 18446744073709551615n)) {
      __compactRuntime.typeError('spendCoin',
                                 'return value',
                                 'nominee.compact line 37 char 1',
                                 'struct QualifiedShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>, mt_index: Uint<0..18446744073709551616>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_11.toValue(result_0),
      alignment: _descriptor_11.alignment()
    });
    return result_0;
  }
  _gSig0_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.gSig0(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && true && typeof(result_0.response) === 'bigint' && result_0.response >= 0 && result_0.response <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('gSig0',
                                 'return value',
                                 'nominee.compact line 38 char 1',
                                 'struct SchnorrSignature<announcement: Opaque<"JubjubPoint">, response: Field>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _gSig1_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.gSig1(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && true && typeof(result_0.response) === 'bigint' && result_0.response >= 0 && result_0.response <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('gSig1',
                                 'return value',
                                 'nominee.compact line 39 char 1',
                                 'struct SchnorrSignature<announcement: Opaque<"JubjubPoint">, response: Field>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _gSig2_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.gSig2(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && true && typeof(result_0.response) === 'bigint' && result_0.response >= 0 && result_0.response <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('gSig2',
                                 'return value',
                                 'nominee.compact line 40 char 1',
                                 'struct SchnorrSignature<announcement: Opaque<"JubjubPoint">, response: Field>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _totalValue_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.totalValue(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('totalValue',
                                 'return value',
                                 'nominee.compact line 41 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_4.toValue(result_0),
      alignment: _descriptor_4.alignment()
    });
    return result_0;
  }
  _executorId_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.executorId(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('executorId',
                                 'return value',
                                 'nominee.compact line 42 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _probateBlind_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.probateBlind(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('probateBlind',
                                 'return value',
                                 'nominee.compact line 43 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _envelopeCipher_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.envelopeCipher(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('envelopeCipher',
                                 'return value',
                                 'nominee.compact line 44 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _pin_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.pin(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 65535n)) {
      __compactRuntime.typeError('pin',
                                 'return value',
                                 'nominee.compact line 45 char 1',
                                 'Uint<0..65536>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_7.toValue(result_0),
      alignment: _descriptor_7.alignment()
    });
    return result_0;
  }
  _decoyRoot_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.decoyRoot(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && typeof(result_0.field) === 'bigint' && result_0.field >= 0 && result_0.field <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('decoyRoot',
                                 'return value',
                                 'nominee.compact line 46 char 1',
                                 'struct MerkleTreeDigest<field: Field>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_2.toValue(result_0),
      alignment: _descriptor_2.alignment()
    });
    return result_0;
  }
  _ownerTag_0(sk_0, wr_0) {
    return this._persistentHash_4([new Uint8Array([110, 111, 109, 105, 110, 101, 101, 58, 111, 119, 110, 101, 114, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0,
                                   wr_0]);
  }
  _register_0(context, partialProofData) {
    const sk_0 = this._ownerSecret_0(context, partialProofData);
    const wr_0 = this._willRoot_0(context, partialProofData);
    const tag_0 = this._ownerTag_0(sk_0, wr_0);
    const leaf_0 = this._persistentHash_3([sk_0, wr_0]);
    __compactRuntime.assert(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(0n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value).field
                            ===
                            this._merkleTreePathRoot_0(this._ownerPath_0(context,
                                                                         partialProofData,
                                                                         leaf_0)).field,
                            'not a registered owner');
    const tmp_0 = 0n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(1n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(tmp_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 0n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(9n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(tmp_1),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _heartbeat_0(context, partialProofData, now_0) {
    const sk_0 = this._ownerSecret_0(context, partialProofData);
    const wr_0 = this._willRoot_0(context, partialProofData);
    const leaf_0 = this._persistentHash_3([sk_0, wr_0]);
    __compactRuntime.assert(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(0n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value).field
                            ===
                            this._merkleTreePathRoot_0(this._ownerPath_0(context,
                                                                         partialProofData,
                                                                         leaf_0)).field,
                            'not a registered owner');
    __compactRuntime.assert(this._blockTimeGte_0(context,
                                                 partialProofData,
                                                 now_0),
                            'timestamp in the future');
    const tmp_0 = this._ownerTag_0(sk_0, wr_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(1n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(now_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _deposit_0(context, partialProofData, coin_0) {
    const sk_0 = this._ownerSecret_0(context, partialProofData);
    const wr_0 = this._willRoot_0(context, partialProofData);
    this._receiveShielded_0(context, partialProofData, coin_0);
    const tmp_0 = this._ownerTag_0(sk_0, wr_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(7n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(coin_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _updateWill_0(context, partialProofData) {
    const sk_0 = this._ownerSecret_0(context, partialProofData);
    const wr_0 = this._willRoot_0(context, partialProofData);
    const tag_0 = this._ownerTag_0(sk_0, wr_0);
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(1n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown owner');
    const tmp_0 = this._newVaultRoot_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(3n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = ((t1) => {
                    if (t1 > 18446744073709551615n) {
                      throw new __compactRuntime.CompactError('nominee.compact line 109 char 27: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                    }
                    return t1;
                  })(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_32.toValue(9n),
                                                                                                           alignment: _descriptor_32.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(tag_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value)
                     +
                     1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(9n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(tmp_1),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _resolve_0(context, partialProofData, tag_0, deadline_0) {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(1n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown owner');
    __compactRuntime.assert(this._equal_2(deadline_0,
                                          ((t1) => {
                                            if (t1 > 18446744073709551615n) {
                                              throw new __compactRuntime.CompactError('nominee.compact line 115 char 32: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                            }
                                            return t1;
                                          })(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                       partialProofData,
                                                                                                       [
                                                                                                        { dup: { n: 0 } },
                                                                                                        { idx: { cached: false,
                                                                                                                 pushPath: false,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_32.toValue(1n),
                                                                                                                                   alignment: _descriptor_32.alignment() } }] } },
                                                                                                        { idx: { cached: false,
                                                                                                                 pushPath: false,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_0.toValue(tag_0),
                                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                                        { popeq: { cached: false,
                                                                                                                   result: undefined } }]).value)
                                             +
                                             _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                       partialProofData,
                                                                                                       [
                                                                                                        { dup: { n: 0 } },
                                                                                                        { idx: { cached: false,
                                                                                                                 pushPath: false,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_32.toValue(2n),
                                                                                                                                   alignment: _descriptor_32.alignment() } }] } },
                                                                                                        { popeq: { cached: false,
                                                                                                                   result: undefined } }]).value))),
                            'bad deadline');
    __compactRuntime.assert(this._blockTimeGte_0(context,
                                                 partialProofData,
                                                 deadline_0),
                            'grace not elapsed');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(4n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _guardianResolve2of3_0(context, partialProofData, tag_0, g0_0, g1_0) {
    const msg_0 = [1n, 0n, 0n, 0n];
    let t_0;
    __compactRuntime.assert((t_0 = g0_0, t_0 < g1_0),
                            'guardian ids must strictly increase');
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(6n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(g0_0),
                                                                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown guardian');
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(6n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(g1_0),
                                                                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown guardian');
    this._schnorrVerify_0(context,
                          partialProofData,
                          msg_0,
                          this._gSig0_0(context, partialProofData),
                          _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_32.toValue(6n),
                                                                                                                alignment: _descriptor_32.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_7.toValue(g0_0),
                                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value));
    this._schnorrVerify_0(context,
                          partialProofData,
                          msg_0,
                          this._gSig1_0(context, partialProofData),
                          _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_32.toValue(6n),
                                                                                                                alignment: _descriptor_32.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_7.toValue(g1_0),
                                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(4n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _guardianResolve3of5_0(context, partialProofData, tag_0, g0_0, g1_0, g2_0) {
    const msg_0 = [1n, 0n, 0n, 0n];
    let t_0;
    __compactRuntime.assert((t_0 = g0_0, t_0 < g1_0),
                            'ids must strictly increase');
    let t_1;
    __compactRuntime.assert((t_1 = g1_0, t_1 < g2_0),
                            'ids must strictly increase');
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(6n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(g0_0),
                                                                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown guardian');
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(6n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(g1_0),
                                                                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown guardian');
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(6n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(g2_0),
                                                                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'unknown guardian');
    this._schnorrVerify_0(context,
                          partialProofData,
                          msg_0,
                          this._gSig0_0(context, partialProofData),
                          _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_32.toValue(6n),
                                                                                                                alignment: _descriptor_32.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_7.toValue(g0_0),
                                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value));
    this._schnorrVerify_0(context,
                          partialProofData,
                          msg_0,
                          this._gSig1_0(context, partialProofData),
                          _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_32.toValue(6n),
                                                                                                                alignment: _descriptor_32.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_7.toValue(g1_0),
                                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value));
    this._schnorrVerify_0(context,
                          partialProofData,
                          msg_0,
                          this._gSig2_0(context, partialProofData),
                          _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_32.toValue(6n),
                                                                                                                alignment: _descriptor_32.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_7.toValue(g2_0),
                                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(4n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _claim_0(context, partialProofData, tag_0, heirKey_0) {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(4n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'vault not resolved');
    const sk_0 = this._heirSecret_0(context, partialProofData);
    const share_0 = this._heirShare_0(context, partialProofData);
    const leaf_0 = this._persistentHash_3([sk_0, this._persistentHash_2(share_0)]);
    __compactRuntime.assert(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_32.toValue(3n),
                                                                                                                  alignment: _descriptor_32.alignment() } }] } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_0.toValue(tag_0),
                                                                                                                  alignment: _descriptor_0.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value).field
                            ===
                            this._merkleTreePathRoot_0(this._heirPath_0(context,
                                                                        partialProofData,
                                                                        leaf_0)).field,
                            'not a beneficiary');
    const nf_0 = this._persistentHash_3([new Uint8Array([110, 111, 109, 105, 110, 101, 101, 58, 110, 102, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                         sk_0]);
    __compactRuntime.assert(!_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_32.toValue(5n),
                                                                                                                   alignment: _descriptor_32.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nf_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'already claimed');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(5n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nf_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const q_0 = this._spendCoin_0(context, partialProofData);
    const outstanding_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_32.toValue(7n),
                                                                                                                alignment: _descriptor_32.alignment() } }] } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_0.toValue(tag_0),
                                                                                                                alignment: _descriptor_0.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value);
    __compactRuntime.assert(this._equal_3(q_0.nonce, outstanding_0.nonce),
                            'stale coin qualification');
    __compactRuntime.assert(this._equal_4(q_0.value, outstanding_0.value),
                            'stale coin value');
    let t_0;
    __compactRuntime.assert((t_0 = share_0, t_0 <= outstanding_0.value),
                            'share exceeds remaining');
    const res_0 = this._sendShielded_0(context,
                                       partialProofData,
                                       q_0,
                                       this._left_0(heirKey_0),
                                       share_0);
    const tmp_0 = res_0.change.value;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(7n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _openProbate_0(context, partialProofData, tag_0, vaultCommit_0) {
    const v_0 = this._totalValue_0(context, partialProofData);
    const ex_0 = this._executorId_0(context, partialProofData);
    const b_0 = this._probateBlind_0(context, partialProofData);
    const c_0 = this._persistentHash_4([this._persistentHash_2(v_0), ex_0, b_0]);
    __compactRuntime.assert(this._equal_5(vaultCommit_0, c_0),
                            'figures do not match the vault commitment');
    const tmp_0 = this._persistentHash_3([this._envelopeCipher_0(context,
                                                                 partialProofData),
                                          c_0]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(8n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _resolveUnderPin_0(context,
                     partialProofData,
                     tag_0,
                     realCommit_0,
                     decoyCommit_0)
  {
    const sk_0 = this._ownerSecret_0(context, partialProofData);
    const p_0 = this._pin_0(context, partialProofData);
    const c_0 = this._persistentHash_4([sk_0,
                                        this._persistentHash_5(p_0),
                                        this._willRoot_0(context,
                                                         partialProofData)]);
    const isReal_0 = this._equal_6(c_0, realCommit_0);
    const isDecoy_0 = this._equal_7(c_0, decoyCommit_0);
    __compactRuntime.assert(isReal_0 || isDecoy_0, 'bad pin');
    const tmp_0 = this._decoyRoot_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(3n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_32.toValue(4n),
                                                                  alignment: _descriptor_32.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tag_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 16; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get ownerSet() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_32.toValue(0n),
                                                                                                   alignment: _descriptor_32.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    lastSeen: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(1n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(1n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 18 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(1n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'nominee.compact line 18 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(1n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get graceSeconds() {
      return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_32.toValue(2n),
                                                                                                   alignment: _descriptor_32.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    vaultRoot: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(3n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(3n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 20 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(3n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'nominee.compact line 20 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(3n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_2.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    resolvedVault: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(4n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(4n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 21 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(4n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[4];
        return self_0.asMap().keys().map((elem) => _descriptor_0.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    spent: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(5n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(5n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 22 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(5n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[5];
        return self_0.asMap().keys().map((elem) => _descriptor_0.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    guardians: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(6n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(6n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 65535n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 23 char 1',
                                     'Uint<0..65536>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(6n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(key_0),
                                                                                                                                 alignment: _descriptor_7.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 65535n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'nominee.compact line 23 char 1',
                                     'Uint<0..65536>',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(6n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_7.toValue(key_0),
                                                                                                     alignment: _descriptor_7.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[6];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_7.fromValue(key.value),      _descriptor_8.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    heldCoin: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(7n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(7n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 24 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(7n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'nominee.compact line 24 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(7n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    probateOpened: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(8n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(8n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 25 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(8n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'nominee.compact line 25 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(8n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[8];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    willVersion: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(9n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(0n),
                                                                                                                                 alignment: _descriptor_9.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(9n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'nominee.compact line 26 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(9n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'nominee.compact line 26 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_32.toValue(9n),
                                                                                                     alignment: _descriptor_32.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[9];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  getSchnorrReduction: (...args) => undefined,
  ownerSecret: (...args) => undefined,
  willRoot: (...args) => undefined,
  ownerPath: (...args) => undefined,
  newVaultRoot: (...args) => undefined,
  heirSecret: (...args) => undefined,
  heirShare: (...args) => undefined,
  heirPath: (...args) => undefined,
  spendCoin: (...args) => undefined,
  gSig0: (...args) => undefined,
  gSig1: (...args) => undefined,
  gSig2: (...args) => undefined,
  totalValue: (...args) => undefined,
  executorId: (...args) => undefined,
  probateBlind: (...args) => undefined,
  envelopeCipher: (...args) => undefined,
  pin: (...args) => undefined,
  decoyRoot: (...args) => undefined
});
export const pureCircuits = {};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
