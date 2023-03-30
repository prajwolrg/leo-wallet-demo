// @ts-nocheck

import { useState, FormEvent, SyntheticEvent, useEffect } from 'react';
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

const PROGRAM = 'postsVI.aleo'

const RecordsPage: NextPageWithLayout = () => {
  const { wallet, publicKey, requestRecords } = useWallet();

  let [recordsPayload, setRecordsPayload] = useState<JSX.Element | null>();
  let [myPosts, setMyPosts] = useState<any>([]);


  // useEffect(()=> {
  //   requestMyPosts();
  // }, [])

  const ENCODING =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
  const ARWEAVE_TX_ID_LENGTH = 43;

  const decodeFromFF = (ff) => {
    const REQUIRED_BINARY_LENGTH = 258
    // console.log('Decoding:: Integer ', concated_ff, concated_ff.length)
    let bin = BigInt(ff).toString(2);
    if (bin.length > REQUIRED_BINARY_LENGTH) {
      throw Error('Decoding: Incorrect input');
    } else if (bin.length < REQUIRED_BINARY_LENGTH) {
      const differenceInBits = REQUIRED_BINARY_LENGTH - bin.length
      if (differenceInBits > 5) {
        throw Error('Decoding: Incorrect input');
      } else {
        bin = '0'.repeat(differenceInBits) + bin
      }
    }
    // console.log('Decoding:: Binary ', bin, bin.length)
    let res = bin.match(/.{1,6}/g);
    const indices = res.map((x) => parseInt(x, 2));
    const values = indices.map((x) => ENCODING[x]);
    const decoded = values.join('');
    if (decoded.length !== ARWEAVE_TX_ID_LENGTH)
      throw Error('Incorrect tx id length');
    return decoded;
  };

  const decodePostContent = async (post) => {
    const VALUE_TO_REMOVE = "field.private"
    let _cidPart1AsAleoFF = post.data.cid_part1
    let _cidPart2AsAleoFF = post.data.cid_part2
    let _cidPart1AsFF = _cidPart1AsAleoFF.substring(0, _cidPart1AsAleoFF.length - VALUE_TO_REMOVE.length)
    let _cidPart2AsFF = _cidPart2AsAleoFF.substring(0, _cidPart2AsAleoFF.length - VALUE_TO_REMOVE.length)
    let _cid = _cidPart1AsFF + _cidPart2AsFF
    let arweaveTxId = decodeFromFF(_cid)
    let arweaveUrl = `https://arweave.net/${arweaveTxId}`
    // console.log('Fetching from', arweaveUrl)
    let res = await fetch(arweaveUrl)
    res = await res.json()
    return res.content;
  }


  const handleRecordRequest = async (event: any) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    const _myRecords = (await requestRecords!(PROGRAM)) || '';
    if (event.target?.elements[0]?.value) {
      event.target.elements[0].value = '';
    }

    const _myPosts = []
    for (let i = 0; i < _myRecords.length; i++) {
      const _myRecord = _myRecords[i]
      // console.log(_myRecord)
      if (_myRecord.data.cid) {
        const _post = _myRecord
        const postContent = await decodePostContent(_myRecord)
        // console.log(postContent)
        _post.content = postContent
        _myPosts.push(_post)
      }
    }
    setMyPosts(_myPosts)

    // const recordsFormatted = collect.map((rec) => JSON.stringify(rec, null, 2));
    // console.log(recordsFormatted)
    // const recordsElement = (
    //   <textarea className="w-full text-gray-500" style={{ height: '250px' }}>
    //     {recordsFormatted.join('\n')}
    //   </textarea>
    // );
    // setRecordsPayload(recordsElement);
  };

  const collectTip = async (post: any) => {
    console.log(post)
    const inputs = ['test'];
    if (!publicKey) throw new WalletNotConnectedError();
    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      'postsV.aleo',
      'post',
      inputs,
      'https://media.githubusercontent.com/media/prajwolrg/zk-posts/proving_keys/build/build/collect.prover'
    );

    const txPayload =
      (await (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )) || '';
    if (post.target?.elements[0]?.value) {
      post.target.elements[0].value = '';
    }
  }

  return (
    <>
      <NextSeo
        title="Leo Wallet Request Collect"
        description="Request Collect from the Leo Wallet"
      />
      <Trade>
        <form
          className="relative flex w-full rounded-full md:w-auto"
          noValidate
          role="search"
          onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
            await handleRecordRequest(event);
          }}
        >
          <label className="flex w-full items-center">
            <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
              <Check className="h-4 w-4" />
            </span>
            <Button
              disabled={!publicKey || PROGRAM.length < 1}
              type="submit"
              color="white"
              className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!publicKey ? 'Connect Your Wallet' : 'Request My Posts'}
            </Button>
          </label>
        </form>

        <div>
          {
            myPosts.map((post: { id: string | number | readonly string[] | undefined; content: string }) => {
              return (
                <div >
                  <label className="flex w-full items-center">
                    <input
                      className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                      value={post.content}
                      autoComplete="off"
                    // onChange={(event: FormEvent<Element>) => handleChange(event)}
                    />
                    <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
                      <Check className="h-4 w-4" />
                    </span>
                    <Button
                      disabled={!publicKey || PROGRAM.length < 1}
                      type="submit"
                      color="white"
                      className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
                      onClick={() => collectTip(post)}
                    >
                      {!publicKey ? 'Connect Your Wallet' : 'Collect'}
                    </Button>
                  </label>
                </div>
              )

            })

          }
        </div>


        {/* {recordsPayload && (
          <div
            className="mt-5 inline-flex w-full items-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6"
            style={{ height: '250px' }}
          >
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full px-4 text-xs text-white sm:text-sm">
              Collect:
            </div>
            <div className="text w-full truncate text-ellipsis bg-center text-xs text-gray-500 ltr:pl-4 rtl:pr-4 dark:text-gray-300 sm:text-sm">
              {recordsPayload}
            </div>
          </div>
        )} */}

      </Trade>
    </>
  );
};

RecordsPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default RecordsPage;
