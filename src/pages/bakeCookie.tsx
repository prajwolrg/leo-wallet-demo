//@ts-nocheck

import { useState, FormEvent, SyntheticEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Trade from '@/components/ui/trade';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Check } from '@/components/icons/check';
import Button from '@/components/ui/button';
import {
  Transaction,
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from '@demox-labs/aleo-wallet-adapter-base';
import { downloadAndStoreFiles, getSavedFile } from '@/lib/db';

import clientPromise from '../lib/mongodb';

import { WebBundlr } from '@bundlr-network/client';
import { ethers } from 'ethers';
import { method } from 'lodash';

const BakeCookiesPage: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();

  let [yourPost, setYourPost] = useState('');

  let [txPayload, setTxPayload] = useState<string>('');

  const initialiseBundlrAndUploadContent = async () => {
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();

    provider.getSigner = () => signer;

    const bundlr = new WebBundlr(
      'https://devnet.bundlr.network',
      'matic',
      provider,
      {
        providerUrl: 'https://rpc.ankr.com/polygon_mumbai',
      }
    );
    await bundlr.ready();

    // Check the price to upload 1MB of data
    // The function accepts a number of bytes, so to check the price of
    // 1MB, check the price of 1,048,576 bytes.
    // const dataSizeToCheck = 1048576;
    // const price1MBAtomic = await bundlr.getPrice(dataSizeToCheck);

    // To ensure accuracy when performing mathematical operations
    // on fractional numbers in JavaScript, it is common to use atomic units.
    // This is a way to represent a floating point (decimal) number using non-decimal notation.
    // Once we have the value in atomic units, we can convert it into something easier to read.
    // const price1MBConverted = bundlr.utils.unitConverter(price1MBAtomic);
    // console.log(`Uploading 1MB to Bundlr costs $${price1MBConverted}`);

    // const response = await bundlr.fund(price1MBAtomic);
    // console.log(`Funding successful txID=${response.id} amount funded=${response.quantity}`);

    const dataContent = 'This is test post';
    const tx = await bundlr.upload(dataContent, {
      tags: [{ name: 'Content-Type', value: 'text' }],
    });
    console.log(tx);
    console.log(`File uploaded ==> https://arweave.net/${tx.id}`);

    console.log('Tx ID', tx.id);
    console.log('FF', encodeToFF(tx.id));

    return tx;
  };

  const ENCODING =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
  const ARWEAVE_TX_ID_LENGTH = 43;

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
    return ff;
  };

  const decodeFromFF = (ff) => {
    const bin = BigInt(ff).toString(2);
    res = bin.match(/.{1,6}/g);
    const indices = res.map((x) => parseInt(x, 2));
    const values = indices.map((x) => ENCODING[x]);
    const decoded = values.join('');
    if (decoded.length !== ARWEAVE_TX_ID_LENGTH)
      throw Error('Incorrect tx id length');
    return decoded;
  };

  const createPost = (arweaveTx, aleoTx) => {
    return {
      cid: arweaveTx.id,
      timestamp: arweaveTx.timestamp,
      content: yourPost,
      total_tips: '0',
      uncollected_tips: '0',
      aleo: aleoTx,
    };
  };

  const uploadPostToDB = async (post) => {
    console.log('Trying to upload to db', post);
    await fetch('/api/db', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    const arweaveTx = await initialiseBundlrAndUploadContent();
    const postTxId = arweaveTx.id;
    const encodedPostTxId = encodeToFF(postTxId);
    console.log('Post TX ID', postTxId);
    console.log('Encoded Post TX ID', encodedPostTxId);

    const inputs = [`${encodedPostTxId}field`];
    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      'postsV.aleo',
      'post',
      inputs,
      'https://media.githubusercontent.com/media/prajwolrg/zk-posts/proving_keys/build/build/post.prover'
    );

    const post = createPost(arweaveTx, aleoTransaction);
    uploadPostToDB(post);

    const txPayload =
      (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )) || '';
    if (event.target?.elements[0]?.value) {
      event.target.elements[0].value = '';
    }
    setTxPayload('Check your wallet to see the post transaction');
  };

  const handleYourPostChange = (event: any) => {
    event.preventDefault();
    setYourPost(event.currentTarget.value);
  };

  return (
    <>
      <NextSeo
        title="Leo Wallet Bake a cookie"
        description="Create a cookie record via the Leo Wallet"
      />
      <Trade>
        <form
          className="relative flex w-full flex-col rounded-full md:w-auto"
          noValidate
          role="search"
          onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
            await handleSubmit(event);
          }}
        >
          <label className="flex w-full items-center py-4">
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="Anything you want to post..."
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleYourPostChange(event)
              }
              value={yourPost}
            />
            <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
              <Check className="h-4 w-4" />
            </span>
          </label>

          <div className="flex items-center justify-center">
            <Button
              disabled={!publicKey}
              type="submit"
              color="white"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Submit'}
            </Button>
          </div>
        </form>
        {txPayload && (
          <div className="mt-5 inline-flex w-full items-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full px-4 text-xs text-white sm:text-sm">
              Check your wallet to see the transaction
            </div>
          </div>
        )}
      </Trade>
    </>
  );
};

BakeCookiesPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default BakeCookiesPage;
