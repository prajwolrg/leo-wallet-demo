const { createHash } = require('crypto');

const ENCODING =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
const ARWEAVE_TX_ID_LENGTH = 43;

function splitString(str) {
  const length = str.length;
  const midpoint = Math.floor(length / 2);
  let firstHalf = str.slice(0, midpoint);
  let secondHalf = str.slice(midpoint);

  // check if the second half starts with '0', if it does, shift the midpoint to the left
  while (secondHalf.charAt(0) === '0') {
    secondHalf = str.slice(--midpoint);
    firstHalf = str.slice(0, midpoint);
  }

  return [firstHalf, secondHalf];
}

const encodeToFF = (tx) => {
  if (tx.length !== ARWEAVE_TX_ID_LENGTH)
    throw Error('Incorrect tx id length');
  let bin = '';
  for (let i = 0; i < ARWEAVE_TX_ID_LENGTH; i++) {
    const index = ENCODING.indexOf(tx[i]);
    if (index < 0) throw Error('Invalid tx id');
    const bin_index = index.toString(2);
    const padded_bin_index = bin_index.padStart(6, '0');
    bin = bin.concat(padded_bin_index);
  }
  const ff = BigInt('0b' + bin).toString(10);
  // console.log('Encoding:: Original ', tx, tx.length)
  // console.log('Encoding:: Binary ', bin, bin.length)
  // console.log('Encoding:: Integer ', ff, ff.length)

  const hash = createHash('sha256').update(ff).digest('hex')
  const partHash = hash.split(/(.{60})/)[1]
  const partHashFF = BigInt(`0x`+partHash).toString(10)
  // console.log(hashBigInt.length)

  let parts = splitString(ff);

  return {
    cid_part1: parts[0],
    cid_part2: parts[1],
    cid: partHashFF
  }
};

const decodeFromFF = (ff) => {
  const REQUIRED_BINARY_LENGTH = 258
  const concated_ff = ff.cid_part1 + ff.cid_part2;
  // console.log('Decoding:: Integer ', concated_ff, concated_ff.length)
  let bin = BigInt(concated_ff).toString(2);
  if (bin.length > REQUIRED_BINARY_LENGTH) {
    throw Error('Decoding: Incorrect input');
  } else if (bin.length < REQUIRED_BINARY_LENGTH ) {
    const differenceInBits = REQUIRED_BINARY_LENGTH - bin.length
    if (differenceInBits > 5) {
      throw Error('Decoding: Incorrect input');
    } else {
      bin = '0'.repeat(differenceInBits) + bin
    }
  }

  // console.log('Decoding:: Binary ', bin, bin.length)
  res = bin.match(/.{1,6}/g);
  const indices = res.map((x) => parseInt(x, 2));
  const values = indices.map((x) => ENCODING[x]);
  const decoded = values.join('');
  if (decoded.length !== ARWEAVE_TX_ID_LENGTH)
    throw Error('Incorrect tx id length');
  return decoded;
};

ARWEAVE_TX_1 = 'Uk4XJiO045kCfstz69hUQWUefLvCJTjmAIhebYfy3dQ'
ARWEAVE_TX_2 = 'scjQv99W2hhvxIydvoCejK3R_k3sV-fgEaUiYbpki8A'

console.log(ARWEAVE_TX_1)
// console.log(encodeToFF(ARWEAVE_TX_1))
console.log(decodeFromFF(encodeToFF(ARWEAVE_TX_1)))

