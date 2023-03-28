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

import { WebBundlr } from '@bundlr-network/client';
import { ethers } from 'ethers';

const BakeCookiesPage: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();

  let [toAddress, setToAddress] = useState(
    'aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru'
  );
  let [cookieType, setCookieType] = useState<number | undefined>(1);
  let [cookieDeliciousness, setCookieDeliciousness] = useState('3');

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

    const dataContent = 'This is test post';
    const tx = await bundlr.upload(dataContent, {
      tags: [{ name: 'Content-Type', value: 'text' }],
    });
    console.log(tx);
    console.log(`File uploaded ==> https://arweave.net/${tx.id}`);

    // console.log('Tx ID', tx.id)
    // console.log('FF', encodeToFF(tx.id))

    return encodeToFF(tx.id);
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

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    const postTxId = await initialiseBundlrAndUploadContent();
    console.log('Post TX ID', postTxId);

    // const inputs = [toAddress, `${cookieType}u64`, `${cookieDeliciousness}u64`];
    const inputs = [`${postTxId}field`];
    // console.log(inputs);
    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      'postsV.aleo',
      'post',
      inputs,
      'https://media.githubusercontent.com/media/prajwolrg/zk-posts/proving_keys/build/build/post.prover'
    );

    console.log(aleoTransaction);

    const txPayload =
      (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )) || '';
    if (event.target?.elements[0]?.value) {
      event.target.elements[0].value = '';
    }
    setTxPayload('Check your wallet to see the cookie transaction');
  };

  const handleToAddressChange = (event: any) => {
    event.preventDefault();
    setToAddress(event.currentTarget.value);
  };
  const handleCookieTypeChange = (event: any) => {
    event.preventDefault();
    setCookieType(event.currentTarget.value);
  };
  const handleDeliciousnessChange = (event: any) => {
    event.preventDefault();
    setCookieDeliciousness(event.currentTarget.value);
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
              placeholder="To address: ie, aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleToAddressChange(event)
              }
              value={toAddress}
            />
            <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
              <Check className="h-4 w-4" />
            </span>
          </label>
          <label className="flex w-full items-center py-4">
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="Cookie type as u64"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleCookieTypeChange(event)
              }
              value={cookieType}
            />
            <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
              <Check className="h-4 w-4" />
            </span>
          </label>
          <label className="flex w-full items-center py-4">
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="How delicious should this cookie be? Use u64"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleDeliciousnessChange(event)
              }
              value={cookieDeliciousness}
            />
            <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
              <Check className="h-4 w-4" />
            </span>
          </label>
          <div className="flex items-center justify-center">
            <Button
              disabled={!publicKey || cookieDeliciousness.length < 1}
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
