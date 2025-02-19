import React, { useState, useEffect, FormEvent, SyntheticEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Trade from '@/components/ui/trade';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Check } from '@/components/icons/check';
import Button from '@/components/ui/button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Copy } from '@/components/icons/copy';
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';

const PROGRAM = 'postsVI.aleo'

const SignPage: NextPageWithLayout = () => {
  const { wallet, publicKey, requestRecords } =
    useWallet();
  let [message, setMessage] = useState('');
  let [signature, setSignature] = useState('');
  let [copyButtonStatus, setCopyButtonStatus] = useState(false);
  let [_, copyToClipboard] = useCopyToClipboard();
  const handleCopyToClipboard = () => {
    copyToClipboard(signature);
    setCopyButtonStatus(true);
    setTimeout(() => {
      setCopyButtonStatus(copyButtonStatus);
    }, 1500);
  };

  let [myAmountRecords, setMyAmountRecords] = useState([])

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    const bytes = new TextEncoder().encode(message);
    const signatureBytes = await (
      wallet?.adapter as LeoWalletAdapter
    ).signMessage(bytes);
    const signature = new TextDecoder().decode(signatureBytes);
    if (event.target?.elements[0]?.value) {
      event.target.elements[0].value = '';
    }
    setMessage('');
    setSignature(signature);
  };

  const checkMyBalance = async (event: any) => {
    event.preventDefault()
    if (!publicKey) throw new WalletNotConnectedError();

    const _myRecords = (await requestRecords!(PROGRAM)) || '';

    const _myAmountRecords = []

    const VALUE_TO_REMOVE = "u64.private"
    let amount = 0
    for (let i=0; i<_myRecords.length; i++) {
      const _myRecord = _myRecords[i];
      console.log(_myRecord)
      let amountInStr = _myRecord.data.amount
      if (amountInStr) {
        _myAmountRecords.push(_myRecord)
        amountInStr = amountInStr.substring(0, amountInStr.length - VALUE_TO_REMOVE.length)
        amount += parseInt(amountInStr);
      }
    }

    console.log(`Balance`, amount)

  }

  const loadPostsFromDB = async () => {
    let res = await fetch('/api/db')
    const posts = await res.json()

    console.log(posts)
  }

  const handleChange = (event: any) => {
    event.preventDefault();
    setMessage(event.currentTarget.value);
  };

  return (
    <>
      <NextSeo
        title="Leo Wallet Sign"
        description="Sign Messages with the Leo Wallet"
      />
      <Trade>
        <label className="flex w-full items-center">
          <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
            <Check className="h-4 w-4" />
          </span>
          <Button
            disabled={!publicKey}
            color="white"
            className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            onClick={loadPostsFromDB}
          >
            {!publicKey ? 'Connect Your Wallet' : 'Check My Balance'}
          </Button>
        </label>

        <form
          className="relative flex w-full rounded-full md:w-auto"
          noValidate
          role="search"
          onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
            await handleSubmit(event);
          }}
        >
          <label className="flex w-full items-center">
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="Message to Sign"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) => handleChange(event)}
            />
            <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
              <Check className="h-4 w-4" />
            </span>
            <Button
              disabled={!publicKey || message.length < 1}
              type="submit"
              color="white"
              className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Sign'}
            </Button>
          </label>
        </form>
        {signature && (
          <div className="mt-5 inline-flex h-9 items-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full bg-gray-900 px-4 text-xs text-white sm:text-sm">
              Signature:
            </div>
            <div className="text w-28 grow-0 truncate text-ellipsis bg-center text-xs text-gray-500 ltr:pl-4 rtl:pr-4 dark:text-gray-300 sm:w-32 sm:text-sm">
              {signature}
            </div>
            <div
              className="flex cursor-pointer items-center px-4 text-gray-500 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              title="Copy Address"
              onClick={handleCopyToClipboard}
            >
              {copyButtonStatus ? (
                <Check className="h-auto w-3.5 text-green-500" />
              ) : (
                <Copy className="h-auto w-3.5" />
              )}
            </div>
          </div>
        )}
      </Trade>
    </>
  );
};

SignPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SignPage;
